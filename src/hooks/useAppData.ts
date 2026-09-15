/**
 * アプリ全体のデータ管理フック。
 * Local Storage との同期と、患者・各記録の CRUD、Demo Data 管理を提供する。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AppData,
  HandoverRecord,
  HandoverStatus,
  Medication,
  NursingNote,
  Patient,
  SoapRecord,
  VitalSign,
} from '../types';
import { DATA_VERSION, createEmptyAppData, loadAppData, saveAppData } from '../utils/storage';
import { createDemoData, createSampleData, isDemoPatientId } from '../data/sampleData';
import type { DemoData } from '../data/sampleData';
import { generateId } from '../utils/id';
import { normalizeText } from '../utils/validation';

/** 患者登録・更新時にフォームから受け取る値 */
export type PatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'profileUpdatedAt'>;
export type VitalSignInput = Omit<VitalSign, 'id' | 'patientId' | 'createdAt' | 'updatedAt'>;
export type NursingNoteInput = Omit<NursingNote, 'id' | 'patientId' | 'createdAt' | 'updatedAt'>;
export type SoapInput = Omit<SoapRecord, 'id' | 'patientId' | 'createdAt' | 'updatedAt'>;
export type MedicationInput = Omit<Medication, 'id' | 'patientId' | 'createdAt' | 'updatedAt'>;
export type HandoverInput = Omit<
  HandoverRecord,
  'id' | 'patientId' | 'createdAt' | 'updatedAt' | 'status' | 'acknowledgedAt'
>;

export type StorageIssue =
  | { kind: 'unavailable' }
  | { kind: 'corrupt'; backedUp: boolean }
  | { kind: 'dropped'; count: number }
  | { kind: 'save-failed' };

interface ChildRecord {
  id: string;
  patientId: string;
  updatedAt: string;
}

/** AppData 内の子データ配列への読み書き関数 */
interface Lens<T extends ChildRecord> {
  get: (data: AppData) => T[];
  set: (data: AppData, items: T[]) => AppData;
}

const vitalsLens: Lens<VitalSign> = { get: (d) => d.vitalSigns, set: (d, vitalSigns) => ({ ...d, vitalSigns }) };
const notesLens: Lens<NursingNote> = { get: (d) => d.nursingNotes, set: (d, nursingNotes) => ({ ...d, nursingNotes }) };
const soapLens: Lens<SoapRecord> = { get: (d) => d.soapRecords, set: (d, soapRecords) => ({ ...d, soapRecords }) };
const medicationsLens: Lens<Medication> = { get: (d) => d.medications, set: (d, medications) => ({ ...d, medications }) };
const handoversLens: Lens<HandoverRecord> = { get: (d) => d.handovers, set: (d, handovers) => ({ ...d, handovers }) };

/** 子データの変更時に、親患者の更新日時も進める */
function touchPatient(data: AppData, patientId: string, at: string): AppData {
  return {
    ...data,
    patients: data.patients.map((patient) => (patient.id === patientId ? { ...patient, updatedAt: at } : patient)),
  };
}

function insertRecord<T extends ChildRecord>(data: AppData, lens: Lens<T>, record: T): AppData {
  return touchPatient(lens.set(data, [...lens.get(data), record]), record.patientId, record.updatedAt);
}

function updateRecord<T extends ChildRecord>(
  data: AppData,
  lens: Lens<T>,
  id: string,
  update: (record: T, now: string) => T,
): AppData {
  const target = lens.get(data).find((record) => record.id === id);
  if (!target) return data;
  const now = new Date().toISOString();
  const next = lens.set(
    data,
    lens.get(data).map((record) => (record.id === id ? update(record, now) : record)),
  );
  return touchPatient(next, target.patientId, now);
}

function removeRecord<T extends ChildRecord>(data: AppData, lens: Lens<T>, id: string): AppData {
  const target = lens.get(data).find((record) => record.id === id);
  if (!target) return data;
  const next = lens.set(data, lens.get(data).filter((record) => record.id !== id));
  return touchPatient(next, target.patientId, new Date().toISOString());
}

/** 指定した患者（内部ID）と子データをまとめて除外する */
function removePatients(data: AppData, ids: Set<string>): AppData {
  const keep = <T extends { patientId: string }>(items: T[]) => items.filter((item) => !ids.has(item.patientId));
  return {
    ...data,
    patients: data.patients.filter((patient) => !ids.has(patient.id)),
    vitalSigns: keep(data.vitalSigns),
    nursingNotes: keep(data.nursingNotes),
    soapRecords: keep(data.soapRecords),
    medications: keep(data.medications),
    handovers: keep(data.handovers),
  };
}

function mergeDemo(data: AppData, demo: DemoData): AppData {
  return {
    ...data,
    patients: [...data.patients, ...demo.patients],
    vitalSigns: [...data.vitalSigns, ...demo.vitalSigns],
    nursingNotes: [...data.nursingNotes, ...demo.nursingNotes],
    soapRecords: [...data.soapRecords, ...demo.soapRecords],
    medications: [...data.medications, ...demo.medications],
    handovers: [...data.handovers, ...demo.handovers],
  };
}

/** 既存の患者IDと衝突するサンプル患者を除外する（利用者データを上書きしない） */
function withoutConflicts(data: AppData, sample: DemoData): DemoData {
  const taken = new Set(data.patients.map((patient) => patient.patientId.toLowerCase()));
  const skipped = new Set(
    sample.patients.filter((patient) => taken.has(patient.patientId.toLowerCase())).map((patient) => patient.id),
  );
  if (skipped.size === 0) return sample;
  const keep = <T extends { patientId: string }>(items: T[]) => items.filter((item) => !skipped.has(item.patientId));
  return {
    patients: sample.patients.filter((patient) => !skipped.has(patient.id)),
    vitalSigns: keep(sample.vitalSigns),
    nursingNotes: keep(sample.nursingNotes),
    soapRecords: keep(sample.soapRecords),
    medications: keep(sample.medications),
    handovers: keep(sample.handovers),
  };
}

interface InitialState {
  data: AppData;
  issue: StorageIssue | null;
  sourceVersion: number | null;
}

/** 初回読み込み時の状態を組み立てる（サンプルデータ投入を含む） */
function initializeState(): InitialState {
  const loaded = loadAppData();

  if (loaded.status === 'ok') {
    const { data, droppedCount, sourceVersion } = loaded.result;
    const issue: StorageIssue | null = droppedCount > 0 ? { kind: 'dropped', count: droppedCount } : null;
    // サンプル投入済みフラグが立っていれば、再読み込みしても重複投入しない
    if (data.sampleDataLoaded) return { data, issue, sourceVersion };
    return {
      data: { ...mergeDemo(data, withoutConflicts(data, createSampleData())), sampleDataLoaded: true },
      issue,
      sourceVersion,
    };
  }

  const fresh: AppData = { ...mergeDemo(createEmptyAppData(), createSampleData()), sampleDataLoaded: true };
  if (loaded.status === 'unavailable') return { data: fresh, issue: { kind: 'unavailable' }, sourceVersion: null };
  if (loaded.status === 'corrupt') {
    return { data: fresh, issue: { kind: 'corrupt', backedUp: loaded.backedUp }, sourceVersion: null };
  }
  return { data: fresh, issue: null, sourceVersion: null };
}

export interface AppDataActions {
  addPatient: (input: PatientInput) => Patient;
  updatePatient: (id: string, input: PatientInput) => void;
  deletePatient: (id: string) => void;
  addVitalSign: (patientId: string, input: VitalSignInput) => void;
  updateVitalSign: (id: string, input: VitalSignInput) => void;
  deleteVitalSign: (id: string) => void;
  addNursingNote: (patientId: string, input: NursingNoteInput) => void;
  updateNursingNote: (id: string, input: NursingNoteInput) => void;
  deleteNursingNote: (id: string) => void;
  addSoapRecord: (patientId: string, input: SoapInput) => void;
  updateSoapRecord: (id: string, input: SoapInput) => void;
  deleteSoapRecord: (id: string) => void;
  addMedication: (patientId: string, input: MedicationInput) => void;
  updateMedication: (id: string, input: MedicationInput) => void;
  deleteMedication: (id: string) => void;
  addHandover: (patientId: string, input: HandoverInput) => void;
  updateHandover: (id: string, input: HandoverInput) => void;
  setHandoverStatus: (id: string, status: HandoverStatus) => void;
  deleteHandover: (id: string) => void;
  /** DEMO- 患者を作り直す（DEMO- 以外の患者には触れない） */
  generateDemoData: () => number;
  removeDemoData: () => number;
  resetAllData: () => void;
}

export interface UseAppDataResult {
  data: AppData;
  /** 更新日時の新しい順に並べた患者一覧 */
  patients: Patient[];
  storageIssue: StorageIssue | null;
  dismissStorageIssue: () => void;
  /** 読み込み時の保存データ version（新規作成時は null） */
  loadedVersion: number | null;
  currentVersion: number;
  /** 患者IDが既に使われているか（excludeId は編集中の患者自身を除外するため） */
  isPatientIdTaken: (patientId: string, excludeId?: string) => boolean;
  actions: AppDataActions;
}

export function useAppData(): UseAppDataResult {
  const [initial] = useState(initializeState);
  const [data, setData] = useState<AppData>(initial.data);
  const [storageIssue, setStorageIssue] = useState<StorageIssue | null>(initial.issue);
  const dataRef = useRef(data);

  // 変更のたびに Local Storage へ保存する（初回のサンプル投入も同時に永続化される）
  useEffect(() => {
    dataRef.current = data;
    if (initial.issue?.kind === 'unavailable') return;
    if (!saveAppData(data)) {
      setStorageIssue((current) => (current?.kind === 'save-failed' ? current : { kind: 'save-failed' }));
    }
  }, [data, initial.issue]);

  const patients = useMemo(
    () => [...data.patients].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [data.patients],
  );

  const isPatientIdTaken = useCallback(
    (patientId: string, excludeId?: string) => {
      const target = normalizeText(patientId).toLowerCase();
      return data.patients.some(
        (patient) => patient.id !== excludeId && patient.patientId.trim().toLowerCase() === target,
      );
    },
    [data.patients],
  );

  const dismissStorageIssue = useCallback(() => setStorageIssue(null), []);

  const actions = useMemo<AppDataActions>(() => {
    const stamp = () => new Date().toISOString();

    return {
      addPatient: (input) => {
        const now = stamp();
        const patient: Patient = { ...input, id: generateId(), createdAt: now, updatedAt: now, profileUpdatedAt: '' };
        setData((current) => ({ ...current, patients: [...current.patients, patient] }));
        return patient;
      },
      updatePatient: (id, input) => {
        const now = stamp();
        setData((current) => ({
          ...current,
          patients: current.patients.map((patient) =>
            patient.id === id ? { ...patient, ...input, updatedAt: now, profileUpdatedAt: now } : patient,
          ),
        }));
      },
      deletePatient: (id) => setData((current) => removePatients(current, new Set([id]))),

      addVitalSign: (patientId, input) => {
        const now = stamp();
        setData((current) =>
          insertRecord(current, vitalsLens, { ...input, id: generateId(), patientId, createdAt: now, updatedAt: now }),
        );
      },
      updateVitalSign: (id, input) =>
        setData((current) => updateRecord(current, vitalsLens, id, (record, now) => ({ ...record, ...input, updatedAt: now }))),
      deleteVitalSign: (id) => setData((current) => removeRecord(current, vitalsLens, id)),

      addNursingNote: (patientId, input) => {
        const now = stamp();
        setData((current) =>
          insertRecord(current, notesLens, { ...input, id: generateId(), patientId, createdAt: now, updatedAt: now }),
        );
      },
      updateNursingNote: (id, input) =>
        setData((current) => updateRecord(current, notesLens, id, (record, now) => ({ ...record, ...input, updatedAt: now }))),
      deleteNursingNote: (id) => setData((current) => removeRecord(current, notesLens, id)),

      addSoapRecord: (patientId, input) => {
        const now = stamp();
        setData((current) =>
          insertRecord(current, soapLens, { ...input, id: generateId(), patientId, createdAt: now, updatedAt: now }),
        );
      },
      updateSoapRecord: (id, input) =>
        setData((current) => updateRecord(current, soapLens, id, (record, now) => ({ ...record, ...input, updatedAt: now }))),
      deleteSoapRecord: (id) => setData((current) => removeRecord(current, soapLens, id)),

      addMedication: (patientId, input) => {
        const now = stamp();
        setData((current) =>
          insertRecord(current, medicationsLens, { ...input, id: generateId(), patientId, createdAt: now, updatedAt: now }),
        );
      },
      updateMedication: (id, input) =>
        setData((current) =>
          updateRecord(current, medicationsLens, id, (record, now) => ({ ...record, ...input, updatedAt: now })),
        ),
      deleteMedication: (id) => setData((current) => removeRecord(current, medicationsLens, id)),

      addHandover: (patientId, input) => {
        const now = stamp();
        const record: HandoverRecord = {
          ...input,
          id: generateId(),
          patientId,
          status: 'open',
          acknowledgedAt: '',
          createdAt: now,
          updatedAt: now,
        };
        setData((current) => insertRecord(current, handoversLens, record));
      },
      updateHandover: (id, input) =>
        setData((current) =>
          updateRecord(current, handoversLens, id, (record, now) => ({ ...record, ...input, updatedAt: now })),
        ),
      setHandoverStatus: (id, status) =>
        setData((current) =>
          updateRecord(current, handoversLens, id, (record, now) => ({
            ...record,
            status,
            acknowledgedAt: status === 'acknowledged' ? now : '',
            updatedAt: now,
          })),
        ),
      deleteHandover: (id) => setData((current) => removeRecord(current, handoversLens, id)),

      generateDemoData: () => {
        const demo = createDemoData();
        setData((current) => {
          const previousDemoIds = new Set(
            current.patients.filter((patient) => isDemoPatientId(patient.patientId)).map((patient) => patient.id),
          );
          return mergeDemo(removePatients(current, previousDemoIds), demo);
        });
        return demo.patients.length;
      },
      removeDemoData: () => {
        // setData の更新関数は遅延実行されるため、件数は直近の確定データから数える
        const removed = dataRef.current.patients.filter((patient) => isDemoPatientId(patient.patientId)).length;
        setData((current) => {
          const demoIds = new Set(
            current.patients.filter((patient) => isDemoPatientId(patient.patientId)).map((patient) => patient.id),
          );
          return removePatients(current, demoIds);
        });
        return removed;
      },
      resetAllData: () => setData({ ...createEmptyAppData(), sampleDataLoaded: true }),
    };
  }, []);

  return {
    data,
    patients,
    storageIssue,
    dismissStorageIssue,
    loadedVersion: initial.sourceVersion,
    currentVersion: DATA_VERSION,
    isPatientIdTaken,
    actions,
  };
}

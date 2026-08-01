/**
 * アプリ全体のデータ管理フック。
 * Local Storage との同期と、患者・バイタル・看護記録のCRUDを提供する。
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppData, Medication, NursingNote, Patient, VitalSign } from '../types';
import { createEmptyAppData, loadAppData, saveAppData } from '../utils/storage';
import { createSampleData } from '../data/sampleData';
import { generateId } from '../utils/id';
import { normalizeText } from '../utils/validation';

/** 患者登録・更新時にフォームから受け取る値 */
export type PatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;

/** バイタル登録時にフォームから受け取る値 */
export type VitalSignInput = Omit<VitalSign, 'id' | 'patientId' | 'createdAt'>;

/** 看護記録登録時にフォームから受け取る値 */
export type NursingNoteInput = Omit<NursingNote, 'id' | 'patientId' | 'createdAt'>;

/** 薬剤登録・更新時にフォームから受け取る値 */
export type MedicationInput = Omit<
  Medication,
  'id' | 'patientId' | 'createdAt' | 'updatedAt'
>;

/** 初回読み込み時の状態を組み立てる（サンプルデータ投入を含む） */
function initializeAppData(): AppData {
  const stored = loadAppData();
  if (stored !== null) {
    // サンプル投入済みフラグが立っていれば、再読み込みしても重複投入しない
    if (stored.sampleDataLoaded) return stored;

    const sample = createSampleData();
    return {
      ...stored,
      patients: [...stored.patients, ...sample.patients],
      vitalSigns: [...stored.vitalSigns, ...sample.vitalSigns],
      nursingNotes: [...stored.nursingNotes, ...sample.nursingNotes],
      medications: stored.medications,
      sampleDataLoaded: true,
    };
  }

  const sample = createSampleData();
  return {
    ...createEmptyAppData(),
    ...sample,
    sampleDataLoaded: true,
  };
}

export interface UseAppDataResult {
  data: AppData;
  /** 更新日時の新しい順に並べた患者一覧 */
  patients: Patient[];
  getPatient: (id: string) => Patient | undefined;
  getVitalSigns: (patientId: string) => VitalSign[];
  getNursingNotes: (patientId: string) => NursingNote[];
  getMedications: (patientId: string) => Medication[];
  /** 患者IDが既に使われているか（excludeId は編集中の患者自身を除外するため） */
  isPatientIdTaken: (patientId: string, excludeId?: string) => boolean;
  addPatient: (input: PatientInput) => Patient;
  updatePatient: (id: string, input: PatientInput) => void;
  deletePatient: (id: string) => void;
  addVitalSign: (patientId: string, input: VitalSignInput) => void;
  deleteVitalSign: (id: string) => void;
  addNursingNote: (patientId: string, input: NursingNoteInput) => void;
  deleteNursingNote: (id: string) => void;
  addMedication: (patientId: string, input: MedicationInput) => void;
  updateMedication: (id: string, input: MedicationInput) => void;
  deleteMedication: (id: string) => void;
}

export function useAppData(): UseAppDataResult {
  const [data, setData] = useState<AppData>(initializeAppData);

  // 変更のたびに Local Storage へ保存する（初回のサンプル投入も同時に永続化される）
  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const patients = useMemo(
    () =>
      [...data.patients].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [data.patients],
  );

  const getPatient = useCallback(
    (id: string) => data.patients.find((patient) => patient.id === id),
    [data.patients],
  );

  const getVitalSigns = useCallback(
    (patientId: string) =>
      data.vitalSigns
        .filter((vital) => vital.patientId === patientId)
        .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()),
    [data.vitalSigns],
  );

  const getNursingNotes = useCallback(
    (patientId: string) =>
      data.nursingNotes
        .filter((note) => note.patientId === patientId)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()),
    [data.nursingNotes],
  );

  const getMedications = useCallback(
    (patientId: string) =>
      data.medications
        .filter((medication) => medication.patientId === patientId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [data.medications],
  );

  const isPatientIdTaken = useCallback(
    (patientId: string, excludeId?: string) => {
      const target = normalizeText(patientId).toLowerCase();
      return data.patients.some(
        (patient) =>
          patient.id !== excludeId && patient.patientId.trim().toLowerCase() === target,
      );
    },
    [data.patients],
  );

  const addPatient = useCallback((input: PatientInput): Patient => {
    const now = new Date().toISOString();
    const patient: Patient = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setData((current) => ({ ...current, patients: [...current.patients, patient] }));
    return patient;
  }, []);

  const updatePatient = useCallback((id: string, input: PatientInput) => {
    const now = new Date().toISOString();
    setData((current) => ({
      ...current,
      patients: current.patients.map((patient) =>
        patient.id === id ? { ...patient, ...input, updatedAt: now } : patient,
      ),
    }));
  }, []);

  const deletePatient = useCallback((id: string) => {
    // 患者に紐づくバイタル・看護記録もまとめて削除する
    setData((current) => ({
      ...current,
      patients: current.patients.filter((patient) => patient.id !== id),
      vitalSigns: current.vitalSigns.filter((vital) => vital.patientId !== id),
      nursingNotes: current.nursingNotes.filter((note) => note.patientId !== id),
      medications: current.medications.filter((medication) => medication.patientId !== id),
    }));
  }, []);

  /** 子データの追加・削除時に、親患者の更新日時も進める */
  const touchPatient = useCallback((patients: Patient[], patientId: string, at: string) => {
    return patients.map((patient) =>
      patient.id === patientId ? { ...patient, updatedAt: at } : patient,
    );
  }, []);

  const addVitalSign = useCallback(
    (patientId: string, input: VitalSignInput) => {
      const now = new Date().toISOString();
      const vital: VitalSign = { ...input, id: generateId(), patientId, createdAt: now };
      setData((current) => ({
        ...current,
        vitalSigns: [...current.vitalSigns, vital],
        patients: touchPatient(current.patients, patientId, now),
      }));
    },
    [touchPatient],
  );

  const deleteVitalSign = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      vitalSigns: current.vitalSigns.filter((vital) => vital.id !== id),
    }));
  }, []);

  const addNursingNote = useCallback(
    (patientId: string, input: NursingNoteInput) => {
      const now = new Date().toISOString();
      const note: NursingNote = { ...input, id: generateId(), patientId, createdAt: now };
      setData((current) => ({
        ...current,
        nursingNotes: [...current.nursingNotes, note],
        patients: touchPatient(current.patients, patientId, now),
      }));
    },
    [touchPatient],
  );

  const deleteNursingNote = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      nursingNotes: current.nursingNotes.filter((note) => note.id !== id),
    }));
  }, []);

  const addMedication = useCallback(
    (patientId: string, input: MedicationInput) => {
      const now = new Date().toISOString();
      const medication: Medication = {
        ...input,
        id: generateId(),
        patientId,
        createdAt: now,
        updatedAt: now,
      };
      setData((current) => ({
        ...current,
        medications: [...current.medications, medication],
        patients: touchPatient(current.patients, patientId, now),
      }));
    },
    [touchPatient],
  );

  const updateMedication = useCallback(
    (id: string, input: MedicationInput) => {
      const now = new Date().toISOString();
      setData((current) => {
        const target = current.medications.find((medication) => medication.id === id);
        if (!target) return current;
        return {
          ...current,
          medications: current.medications.map((medication) =>
            medication.id === id ? { ...medication, ...input, updatedAt: now } : medication,
          ),
          patients: touchPatient(current.patients, target.patientId, now),
        };
      });
    },
    [touchPatient],
  );

  const deleteMedication = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      setData((current) => {
        const target = current.medications.find((medication) => medication.id === id);
        if (!target) return current;
        return {
          ...current,
          medications: current.medications.filter((medication) => medication.id !== id),
          patients: touchPatient(current.patients, target.patientId, now),
        };
      });
    },
    [touchPatient],
  );

  return {
    data,
    patients,
    getPatient,
    getVitalSigns,
    getNursingNotes,
    getMedications,
    isPatientIdTaken,
    addPatient,
    updatePatient,
    deletePatient,
    addVitalSign,
    deleteVitalSign,
    addNursingNote,
    deleteNursingNote,
    addMedication,
    updateMedication,
    deleteMedication,
  };
}

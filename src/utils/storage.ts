/**
 * Local Storage への読み書きを一箇所に集約する。
 *
 * - JSON の解析に失敗してもアプリがクラッシュしないよう、すべて try/catch で保護する。
 * - 保存済みデータの形が壊れていても、可能な範囲で復元し、不正な要素は破棄する。
 */

import type { AppData, Medication, NursingNote, Patient, VitalSign } from '../types';
import { isBloodType, isGender, isRecordType } from '../data/options';
import { generateId } from './id';

export const STORAGE_KEY = 'medichart-lite:app-data:v1';

const DATA_VERSION = 3;

/** 空のデータセット */
export function createEmptyAppData(): AppData {
  return {
    version: DATA_VERSION,
    patients: [],
    vitalSigns: [],
    nursingNotes: [],
    medications: [],
    sampleDataLoaded: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(source: Record<string, unknown>, key: string, fallback = ''): string {
  const value = source[key];
  return typeof value === 'string' ? value : fallback;
}

function readNumberOrNull(source: Record<string, unknown>, key: string): number | null {
  const value = source[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readStringArray(source: Record<string, unknown>, key: string): string[] {
  const value = source[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function sanitizePatient(raw: unknown): Patient | null {
  if (!isRecord(raw)) return null;

  const patientId = readString(raw, 'patientId');
  const name = readString(raw, 'name');
  // 患者IDと氏名が失われているレコードは復元できないため破棄する
  if (patientId.trim() === '' || name.trim() === '') return null;

  const gender = raw.gender;
  const bloodType = raw.bloodType;
  const now = new Date().toISOString();

  return {
    id: readString(raw, 'id') || generateId(),
    patientId,
    name,
    avatarUrl: readString(raw, 'avatarUrl'),
    dateOfBirth: readString(raw, 'dateOfBirth'),
    gender: isGender(gender) ? gender : 'undisclosed',
    room: readString(raw, 'room'),
    bloodType: isBloodType(bloodType) ? bloodType : 'unknown',
    allergies: readString(raw, 'allergies'),
    medicalHistory: readString(raw, 'medicalHistory'),
    chiefComplaint: readString(raw, 'chiefComplaint'),
    diagnoses: readStringArray(raw, 'diagnoses'),
    notes: readString(raw, 'notes'),
    createdAt: readString(raw, 'createdAt', now),
    updatedAt: readString(raw, 'updatedAt', now),
  };
}

function sanitizeVitalSign(raw: unknown): VitalSign | null {
  if (!isRecord(raw)) return null;

  const patientId = readString(raw, 'patientId');
  if (patientId === '') return null;

  const now = new Date().toISOString();

  return {
    id: readString(raw, 'id') || generateId(),
    patientId,
    measuredAt: readString(raw, 'measuredAt', now),
    temperature: readNumberOrNull(raw, 'temperature'),
    systolic: readNumberOrNull(raw, 'systolic'),
    diastolic: readNumberOrNull(raw, 'diastolic'),
    pulse: readNumberOrNull(raw, 'pulse'),
    respiration: readNumberOrNull(raw, 'respiration'),
    spo2: readNumberOrNull(raw, 'spo2'),
    consciousness: readString(raw, 'consciousness'),
    painScale: readNumberOrNull(raw, 'painScale'),
    memo: readString(raw, 'memo'),
    createdAt: readString(raw, 'createdAt', now),
  };
}

function sanitizeNursingNote(raw: unknown): NursingNote | null {
  if (!isRecord(raw)) return null;

  const patientId = readString(raw, 'patientId');
  const body = readString(raw, 'body');
  if (patientId === '' || body.trim() === '') return null;

  const recordType = raw.recordType;
  const now = new Date().toISOString();

  return {
    id: readString(raw, 'id') || generateId(),
    patientId,
    recordedAt: readString(raw, 'recordedAt', now),
    author: readString(raw, 'author'),
    recordType: isRecordType(recordType) ? recordType : 'other',
    body,
    createdAt: readString(raw, 'createdAt', now),
  };
}

function sanitizeMedication(raw: unknown): Medication | null {
  if (!isRecord(raw)) return null;

  const patientId = readString(raw, 'patientId');
  const name = readString(raw, 'name').trim();
  const dose = readString(raw, 'dose').trim();
  if (patientId === '' || name === '' || dose === '') return null;

  const now = new Date().toISOString();
  return {
    id: readString(raw, 'id') || generateId(),
    patientId,
    category: raw.category === 'prn' ? 'prn' : 'regular',
    name,
    dose,
    unit: readString(raw, 'unit').trim(),
    timing: readString(raw, 'timing').trim(),
    indication: readString(raw, 'indication').trim(),
    lastAdministeredAt: readString(raw, 'lastAdministeredAt'),
    startDate: readString(raw, 'startDate'),
    endDate: readString(raw, 'endDate'),
    memo: readString(raw, 'memo').trim(),
    createdAt: readString(raw, 'createdAt', now),
    updatedAt: readString(raw, 'updatedAt', now),
  };
}

function sanitizeAppData(raw: unknown): AppData | null {
  if (!isRecord(raw)) return null;

  const patients = Array.isArray(raw.patients)
    ? raw.patients
        .map(sanitizePatient)
        .filter((patient): patient is Patient => patient !== null)
    : [];

  // 患者が存在しない子データ（孤立レコード）は取り込まない
  const patientIds = new Set(patients.map((patient) => patient.id));

  const vitalSigns = Array.isArray(raw.vitalSigns)
    ? raw.vitalSigns
        .map(sanitizeVitalSign)
        .filter((vital): vital is VitalSign => vital !== null && patientIds.has(vital.patientId))
    : [];

  const nursingNotes = Array.isArray(raw.nursingNotes)
    ? raw.nursingNotes
        .map(sanitizeNursingNote)
        .filter((note): note is NursingNote => note !== null && patientIds.has(note.patientId))
    : [];

  // v1 データには medications が存在しないため、空配列として安全に補完する
  const medications = Array.isArray(raw.medications)
    ? raw.medications
        .map(sanitizeMedication)
        .filter(
          (medication): medication is Medication =>
            medication !== null && patientIds.has(medication.patientId),
        )
    : [];

  return {
    version: DATA_VERSION,
    patients,
    vitalSigns,
    nursingNotes,
    medications,
    sampleDataLoaded: raw.sampleDataLoaded === true,
  };
}

/** Local Storage が利用できるかどうか（プライベートモード等への備え） */
export function isStorageAvailable(): boolean {
  try {
    const testKey = `${STORAGE_KEY}:test`;
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 保存済みデータを読み込む。
 * 未保存・破損・解析失敗のいずれの場合も null を返し、呼び出し側で初期化できるようにする。
 */
export function loadAppData(): AppData | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) return null;

    const parsed: unknown = JSON.parse(stored);
    return sanitizeAppData(parsed);
  } catch (error) {
    // 破損データでアプリを止めないよう、警告のみ出して初期状態から再開する
    console.warn('[MediChart Lite] 保存データを読み込めませんでした。初期データで起動します。', error);
    return null;
  }
}

/** データを保存する。保存に失敗した場合は false を返す。 */
export function saveAppData(data: AppData): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn('[MediChart Lite] データを保存できませんでした。', error);
    return false;
  }
}

/** 保存データを削除する */
export function clearAppData(): boolean {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn('[MediChart Lite] データを削除できませんでした。', error);
    return false;
  }
}

/**
 * Local Storage への読み書きと、保存データのマイグレーションを一箇所に集約する。
 *
 * - JSON の解析に失敗してもアプリがクラッシュしないよう、すべて try/catch で保護する。
 * - 保存済みデータの形が壊れていても、可能な範囲で復元し、不正な要素は破棄する。
 * - v1〜v3 のデータは欠けている配列・項目を補完して v4 として読み込む（既存データは削除しない）。
 * - 解析できないデータは上書き前にバックアップキーへ退避する。
 */

import type {
  AppData,
  HandoverRecord,
  Medication,
  MedicationStatus,
  NursingNote,
  Patient,
  SoapRecord,
  VitalSign,
} from '../types';
import {
  isBloodType,
  isGender,
  isHandoverPriority,
  isHandoverStatus,
  isMedicationStatus,
  isRecordType,
} from '../data/options';
import { generateId } from './id';
import { todayDateValue } from './date';

/** 保存キー。v1 時代のキー名だが、互換性維持のため変更しない（中身の version で管理する） */
export const STORAGE_KEY = 'medichart-lite:app-data:v1';

/** 解析できなかった保存データの退避先 */
export const CORRUPT_BACKUP_KEY = 'medichart-lite:app-data:corrupt-backup';

export const DATA_VERSION = 4;

/** 空のデータセット */
export function createEmptyAppData(): AppData {
  return {
    version: DATA_VERSION,
    patients: [],
    vitalSigns: [],
    nursingNotes: [],
    soapRecords: [],
    medications: [],
    handovers: [],
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

/** 日時文字列として解釈できる値のみ採用する */
function readTimestamp(source: Record<string, unknown>, key: string, fallback: string): string {
  const value = source[key];
  if (typeof value !== 'string' || value === '') return fallback;
  return Number.isNaN(new Date(value).getTime()) ? fallback : value;
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

export function sanitizePatient(raw: unknown, now: string): Patient | null {
  if (!isRecord(raw)) return null;

  const patientId = readString(raw, 'patientId');
  const name = readString(raw, 'name');
  // 患者IDと氏名が失われているレコードは復元できないため破棄する
  if (patientId.trim() === '' || name.trim() === '') return null;

  const createdAt = readTimestamp(raw, 'createdAt', now);

  return {
    id: readString(raw, 'id') || generateId(),
    patientId,
    name,
    avatarUrl: readString(raw, 'avatarUrl'),
    dateOfBirth: readString(raw, 'dateOfBirth'),
    gender: isGender(raw.gender) ? raw.gender : 'undisclosed',
    room: readString(raw, 'room'),
    bloodType: isBloodType(raw.bloodType) ? raw.bloodType : 'unknown',
    allergies: readString(raw, 'allergies'),
    medicalHistory: readString(raw, 'medicalHistory'),
    chiefComplaint: readString(raw, 'chiefComplaint'),
    diagnoses: readStringArray(raw, 'diagnoses'),
    notes: readString(raw, 'notes'),
    createdAt,
    updatedAt: readTimestamp(raw, 'updatedAt', createdAt),
    profileUpdatedAt: readTimestamp(raw, 'profileUpdatedAt', ''),
  };
}

function sanitizeVitalSign(raw: unknown, now: string): VitalSign | null {
  if (!isRecord(raw)) return null;

  const patientId = readString(raw, 'patientId');
  if (patientId === '') return null;

  const measuredAt = readTimestamp(raw, 'measuredAt', now);
  const createdAt = readTimestamp(raw, 'createdAt', measuredAt);

  return {
    id: readString(raw, 'id') || generateId(),
    patientId,
    measuredAt,
    temperature: readNumberOrNull(raw, 'temperature'),
    systolic: readNumberOrNull(raw, 'systolic'),
    diastolic: readNumberOrNull(raw, 'diastolic'),
    pulse: readNumberOrNull(raw, 'pulse'),
    respiration: readNumberOrNull(raw, 'respiration'),
    spo2: readNumberOrNull(raw, 'spo2'),
    consciousness: readString(raw, 'consciousness'),
    painScale: readNumberOrNull(raw, 'painScale'),
    memo: readString(raw, 'memo'),
    createdAt,
    updatedAt: readTimestamp(raw, 'updatedAt', createdAt),
  };
}

function sanitizeNursingNote(raw: unknown, now: string): NursingNote | null {
  if (!isRecord(raw)) return null;

  const patientId = readString(raw, 'patientId');
  const body = readString(raw, 'body');
  if (patientId === '' || body.trim() === '') return null;

  const recordedAt = readTimestamp(raw, 'recordedAt', now);
  const createdAt = readTimestamp(raw, 'createdAt', recordedAt);

  return {
    id: readString(raw, 'id') || generateId(),
    patientId,
    recordedAt,
    author: readString(raw, 'author'),
    recordType: isRecordType(raw.recordType) ? raw.recordType : 'other',
    body,
    tags: readStringArray(raw, 'tags'),
    createdAt,
    updatedAt: readTimestamp(raw, 'updatedAt', createdAt),
  };
}

function sanitizeSoapRecord(raw: unknown, now: string): SoapRecord | null {
  if (!isRecord(raw)) return null;

  const patientId = readString(raw, 'patientId');
  const subjective = readString(raw, 'subjective');
  const objective = readString(raw, 'objective');
  const assessment = readString(raw, 'assessment');
  const plan = readString(raw, 'plan');
  // S/O/A/P のすべてが空の記録は意味を持たないため破棄する
  if (patientId === '' || [subjective, objective, assessment, plan].every((v) => v.trim() === '')) {
    return null;
  }

  const recordedAt = readTimestamp(raw, 'recordedAt', now);
  const createdAt = readTimestamp(raw, 'createdAt', recordedAt);

  return {
    id: readString(raw, 'id') || generateId(),
    patientId,
    recordedAt,
    author: readString(raw, 'author'),
    problem: readString(raw, 'problem'),
    subjective,
    objective,
    assessment,
    plan,
    createdAt,
    updatedAt: readTimestamp(raw, 'updatedAt', createdAt),
  };
}

/** 状態が保存されていない旧データは、終了日から状態を補完する */
function migrateMedicationStatus(raw: Record<string, unknown>, today: string): MedicationStatus {
  if (isMedicationStatus(raw.status)) return raw.status;
  const endDate = readString(raw, 'endDate');
  return endDate !== '' && endDate < today ? 'completed' : 'active';
}

function sanitizeMedication(raw: unknown, now: string, today: string): Medication | null {
  if (!isRecord(raw)) return null;

  const patientId = readString(raw, 'patientId');
  const name = readString(raw, 'name').trim();
  const dose = readString(raw, 'dose').trim();
  if (patientId === '' || name === '' || dose === '') return null;

  const createdAt = readTimestamp(raw, 'createdAt', now);
  return {
    id: readString(raw, 'id') || generateId(),
    patientId,
    category: raw.category === 'prn' ? 'prn' : 'regular',
    name,
    dose,
    unit: readString(raw, 'unit').trim(),
    timing: readString(raw, 'timing').trim(),
    indication: readString(raw, 'indication').trim(),
    lastAdministeredAt: readTimestamp(raw, 'lastAdministeredAt', ''),
    startDate: readString(raw, 'startDate'),
    endDate: readString(raw, 'endDate'),
    status: migrateMedicationStatus(raw, today),
    memo: readString(raw, 'memo').trim(),
    createdAt,
    updatedAt: readTimestamp(raw, 'updatedAt', createdAt),
  };
}

function sanitizeHandover(raw: unknown, now: string): HandoverRecord | null {
  if (!isRecord(raw)) return null;

  const patientId = readString(raw, 'patientId');
  const content = readString(raw, 'content');
  if (patientId === '' || content.trim() === '') return null;

  const recordedAt = readTimestamp(raw, 'recordedAt', now);
  const createdAt = readTimestamp(raw, 'createdAt', recordedAt);
  const status = isHandoverStatus(raw.status) ? raw.status : 'open';

  return {
    id: readString(raw, 'id') || generateId(),
    patientId,
    recordedAt,
    author: readString(raw, 'author'),
    priority: isHandoverPriority(raw.priority) ? raw.priority : 'normal',
    content,
    cautions: readString(raw, 'cautions'),
    status,
    acknowledgedAt: status === 'acknowledged' ? readTimestamp(raw, 'acknowledgedAt', '') : '',
    createdAt,
    updatedAt: readTimestamp(raw, 'updatedAt', createdAt),
  };
}

/** 配列を sanitize し、患者に紐づかない孤立レコードを除外する */
function sanitizeChildren<T extends { patientId: string }>(
  value: unknown,
  sanitize: (raw: unknown) => T | null,
  patientIds: Set<string>,
): { items: T[]; dropped: number } {
  if (!Array.isArray(value)) return { items: [], dropped: 0 };
  const items: T[] = [];
  for (const raw of value) {
    const item = sanitize(raw);
    if (item !== null && patientIds.has(item.patientId)) items.push(item);
  }
  return { items, dropped: value.length - items.length };
}

export interface SanitizeResult {
  data: AppData;
  /** 読み込み時の version（不明なら 0） */
  sourceVersion: number;
  /** 復元できず破棄した要素数 */
  droppedCount: number;
}

/** 保存データ（JSON.parse 済みの値）を現在の AppData へ変換する */
export function sanitizeAppData(raw: unknown, nowDate: Date = new Date()): SanitizeResult | null {
  if (!isRecord(raw)) return null;

  const now = nowDate.toISOString();
  const today = todayDateValue(nowDate);

  const patientSource = Array.isArray(raw.patients) ? raw.patients : [];
  const patients: Patient[] = [];
  const seenIds = new Set<string>();
  for (const item of patientSource) {
    const patient = sanitizePatient(item, now);
    // 内部IDが重複している場合は先勝ちとし、後続を破棄する
    if (patient !== null && !seenIds.has(patient.id)) {
      seenIds.add(patient.id);
      patients.push(patient);
    }
  }
  let droppedCount = patientSource.length - patients.length;

  const vitals = sanitizeChildren(raw.vitalSigns, (r) => sanitizeVitalSign(r, now), seenIds);
  const notes = sanitizeChildren(raw.nursingNotes, (r) => sanitizeNursingNote(r, now), seenIds);
  const soaps = sanitizeChildren(raw.soapRecords, (r) => sanitizeSoapRecord(r, now), seenIds);
  const meds = sanitizeChildren(raw.medications, (r) => sanitizeMedication(r, now, today), seenIds);
  const handovers = sanitizeChildren(raw.handovers, (r) => sanitizeHandover(r, now), seenIds);
  droppedCount += vitals.dropped + notes.dropped + soaps.dropped + meds.dropped + handovers.dropped;

  return {
    data: {
      version: DATA_VERSION,
      patients,
      vitalSigns: vitals.items,
      nursingNotes: notes.items,
      soapRecords: soaps.items,
      medications: meds.items,
      handovers: handovers.items,
      sampleDataLoaded: raw.sampleDataLoaded === true,
    },
    sourceVersion: typeof raw.version === 'number' ? raw.version : 0,
    droppedCount,
  };
}

export type ParseResult =
  | { status: 'ok'; result: SanitizeResult }
  | { status: 'corrupt'; reason: string };

/** 保存文字列を解析する（Local Storage に依存しない純粋関数） */
export function parseStoredData(stored: string, now: Date = new Date()): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return { status: 'corrupt', reason: 'JSON を解析できませんでした。' };
  }
  const result = sanitizeAppData(parsed, now);
  if (result === null) {
    return { status: 'corrupt', reason: '保存データの形式が想定と異なります。' };
  }
  return { status: 'ok', result };
}

export type LoadResult =
  | { status: 'empty' }
  | { status: 'unavailable' }
  | { status: 'ok'; result: SanitizeResult }
  | { status: 'corrupt'; reason: string; backedUp: boolean };

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
 * 解析できない場合は元の文字列をバックアップキーへ退避してから corrupt を返す。
 */
export function loadAppData(): LoadResult {
  let stored: string | null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { status: 'unavailable' };
  }
  if (stored === null) return { status: 'empty' };

  const parsed = parseStoredData(stored);
  if (parsed.status === 'ok') return parsed;

  let backedUp = false;
  try {
    window.localStorage.setItem(CORRUPT_BACKUP_KEY, stored);
    backedUp = true;
  } catch {
    backedUp = false;
  }
  console.warn(`[MediChart Lite] ${parsed.reason} 初期データで起動します。`);
  return { status: 'corrupt', reason: parsed.reason, backedUp };
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

/** 任意キーの安全な読み出し（テーマ設定など） */
export function readPreference(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 任意キーの安全な書き込み */
export function writePreference(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 設定値が保存できなくても画面動作には影響させない
  }
}

/** 任意キーの安全な削除 */
export function removePreference(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 削除できなくても画面動作には影響させない
  }
}

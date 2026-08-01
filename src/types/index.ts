/**
 * MediChart Lite - アプリ全体で共有するデータ型定義
 *
 * 注意: 本アプリは学習・デモ用途です。実在患者の情報は扱いません。
 */

/** 性別 */
export type Gender = 'male' | 'female' | 'other' | 'undisclosed';

/** 血液型 */
export type BloodType = 'A' | 'B' | 'O' | 'AB' | 'unknown';

/** 看護記録の記録種別 */
export type RecordType =
  | 'soap'
  | 'progress'
  | 'observation'
  | 'care'
  | 'handover'
  | 'other';

/** 患者情報 */
export interface Patient {
  /** 内部的に使用する一意なID（他データとの紐付けキー） */
  id: string;
  /** 画面に表示する患者ID（利用者が自由入力・重複不可） */
  patientId: string;
  /** 氏名 */
  name: string;
  /** 生年月日 (YYYY-MM-DD)。未入力の場合は空文字 */
  dateOfBirth: string;
  /** 性別 */
  gender: Gender;
  /** 病室 */
  room: string;
  /** 血液型 */
  bloodType: BloodType;
  /** アレルギー */
  allergies: string;
  /** 既往歴 */
  medicalHistory: string;
  /** 主訴 */
  chiefComplaint: string;
  /** 疾患名（タグ） */
  diagnoses: string[];
  /** 備考 */
  notes: string;
  /** 登録日時 (ISO 8601) */
  createdAt: string;
  /** 最終更新日時 (ISO 8601) */
  updatedAt: string;
}

/** バイタルサイン記録 */
export interface VitalSign {
  id: string;
  /** Patient.id への参照 */
  patientId: string;
  /** 測定日時 (ISO 8601) */
  measuredAt: string;
  /** 体温 (℃) */
  temperature: number | null;
  /** 収縮期血圧 (mmHg) */
  systolic: number | null;
  /** 拡張期血圧 (mmHg) */
  diastolic: number | null;
  /** 脈拍 (回/分) */
  pulse: number | null;
  /** 呼吸数 (回/分) */
  respiration: number | null;
  /** SpO2 (%) */
  spo2: number | null;
  /** 意識レベル（記録した文言をそのまま保持する） */
  consciousness: string;
  /** 疼痛スケール (0-10) */
  painScale: number | null;
  /** メモ */
  memo: string;
  /** 登録日時 (ISO 8601) */
  createdAt: string;
}

/** 看護記録 */
export interface NursingNote {
  id: string;
  /** Patient.id への参照 */
  patientId: string;
  /** 記録日時 (ISO 8601) */
  recordedAt: string;
  /** 記録者名 */
  author: string;
  /** 記録種別 */
  recordType: RecordType;
  /** 記録本文 */
  body: string;
  /** 登録日時 (ISO 8601) */
  createdAt: string;
}

/** Local Storage に保存するアプリ全体のデータ */
export interface AppData {
  /** データ構造のバージョン */
  version: number;
  patients: Patient[];
  vitalSigns: VitalSign[];
  nursingNotes: NursingNote[];
  /** サンプルデータ投入済みフラグ（重複投入の防止） */
  sampleDataLoaded: boolean;
}

/** 画面遷移の状態（ルーティングライブラリを使わず state で管理する） */
export type Route =
  | { name: 'dashboard' }
  | { name: 'patients' }
  | { name: 'new-patient' }
  | { name: 'patient-detail'; patientId: string };

/** 画面上部に表示するフィードバックメッセージ */
export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  text: string;
}

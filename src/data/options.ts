import type {
  BloodType,
  Gender,
  HandoverPriority,
  HandoverStatus,
  MedicationStatus,
  PatientTab,
  RecordType,
} from '../types';

/** 選択肢の共通形 */
export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

/** 性別の選択肢 */
export const GENDER_OPTIONS: SelectOption<Gender>[] = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
  { value: 'undisclosed', label: '未回答' },
];

/** 血液型の選択肢 */
export const BLOOD_TYPE_OPTIONS: SelectOption<BloodType>[] = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'O', label: 'O' },
  { value: 'AB', label: 'AB' },
  { value: 'unknown', label: '不明' },
];

/** 記録種別（保存データの判定・表示用。旧形式の SOAP / 申し送りを含む） */
export const RECORD_TYPE_OPTIONS: SelectOption<RecordType>[] = [
  { value: 'progress', label: '経過記録' },
  { value: 'observation', label: '観察記録' },
  { value: 'care', label: 'ケア実施' },
  { value: 'other', label: 'その他' },
  { value: 'soap', label: 'SOAP（旧形式）' },
  { value: 'handover', label: '申し送り（旧形式）' },
];

/** 新規の経過・看護記録で選べる種別（SOAP・申し送りは専用タブで扱う） */
export const NOTE_RECORD_TYPE_OPTIONS: SelectOption<RecordType>[] = RECORD_TYPE_OPTIONS.filter(
  (option) => option.value !== 'soap' && option.value !== 'handover',
);

/** 記録タグの入力候補（自由入力も可） */
export const RECORD_TAG_SUGGESTIONS: string[] = [
  '食事',
  '排泄',
  '清潔',
  '睡眠',
  '疼痛',
  'リハビリ',
  '転倒予防',
  '家族対応',
  '内服',
  '創部',
];

/**
 * 意識状態の記録用選択肢。
 * 記録された文言をそのまま保持するだけで、状態の評価や判定は行わない。
 */
export const CONSCIOUSNESS_OPTIONS: string[] = [
  '未記入',
  '清明',
  '傾眠',
  '混濁',
  '昏睡',
  '評価不能',
];

export const MEDICATION_STATUS_OPTIONS: SelectOption<MedicationStatus>[] = [
  { value: 'active', label: '継続中' },
  { value: 'paused', label: '一時中止' },
  { value: 'completed', label: '終了' },
];

/** 申し送りの優先度（業務整理のラベル。医学的な緊急度判定ではない） */
export const HANDOVER_PRIORITY_OPTIONS: SelectOption<HandoverPriority>[] = [
  { value: 'high', label: '優先' },
  { value: 'normal', label: '通常' },
  { value: 'low', label: '参考' },
];

export const HANDOVER_STATUS_OPTIONS: SelectOption<HandoverStatus>[] = [
  { value: 'open', label: '未確認' },
  { value: 'acknowledged', label: '確認済み' },
];

/** Patient Detail のタブ定義（表示順） */
export const PATIENT_TABS: { value: PatientTab; english: string; japanese: string }[] = [
  { value: 'overview', english: 'Overview', japanese: '概要' },
  { value: 'vitals', english: 'Vitals', japanese: 'バイタル' },
  { value: 'records', english: 'Records', japanese: '経過記録' },
  { value: 'soap', english: 'SOAP', japanese: 'SOAP' },
  { value: 'medications', english: 'Medications', japanese: '内服' },
  { value: 'medical', english: 'Medical Info', japanese: '医療情報' },
  { value: 'handover', english: 'Handover', japanese: '申し送り' },
  { value: 'timeline', english: 'Timeline', japanese: 'タイムライン' },
];

function labelOf<T extends string>(options: SelectOption<T>[], value: T): string {
  return options.find((option) => option.value === value)?.label ?? '—';
}

function isOptionValue<T extends string>(options: SelectOption<T>[], value: unknown): value is T {
  return options.some((option) => option.value === value);
}

export function genderLabel(value: Gender): string {
  return labelOf(GENDER_OPTIONS, value);
}

export function bloodTypeLabel(value: BloodType): string {
  return labelOf(BLOOD_TYPE_OPTIONS, value);
}

export function recordTypeLabel(value: RecordType): string {
  return labelOf(RECORD_TYPE_OPTIONS, value);
}

export function medicationStatusLabel(value: MedicationStatus): string {
  return labelOf(MEDICATION_STATUS_OPTIONS, value);
}

export function handoverPriorityLabel(value: HandoverPriority): string {
  return labelOf(HANDOVER_PRIORITY_OPTIONS, value);
}

export function handoverStatusLabel(value: HandoverStatus): string {
  return labelOf(HANDOVER_STATUS_OPTIONS, value);
}

/** 保存済みの値が既知の選択肢かどうかを検査する（Local Storage 復元時に使用） */
export function isGender(value: unknown): value is Gender {
  return isOptionValue(GENDER_OPTIONS, value);
}

export function isBloodType(value: unknown): value is BloodType {
  return isOptionValue(BLOOD_TYPE_OPTIONS, value);
}

export function isRecordType(value: unknown): value is RecordType {
  return isOptionValue(RECORD_TYPE_OPTIONS, value);
}

export function isMedicationStatus(value: unknown): value is MedicationStatus {
  return isOptionValue(MEDICATION_STATUS_OPTIONS, value);
}

export function isHandoverPriority(value: unknown): value is HandoverPriority {
  return isOptionValue(HANDOVER_PRIORITY_OPTIONS, value);
}

export function isHandoverStatus(value: unknown): value is HandoverStatus {
  return isOptionValue(HANDOVER_STATUS_OPTIONS, value);
}

export function isPatientTab(value: unknown): value is PatientTab {
  return PATIENT_TABS.some((tab) => tab.value === value);
}

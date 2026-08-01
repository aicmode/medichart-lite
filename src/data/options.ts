import type { BloodType, Gender, RecordType } from '../types';

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

/** 看護記録の記録種別 */
export const RECORD_TYPE_OPTIONS: SelectOption<RecordType>[] = [
  { value: 'soap', label: 'SOAP' },
  { value: 'progress', label: '経過記録' },
  { value: 'observation', label: '観察記録' },
  { value: 'care', label: 'ケア実施' },
  { value: 'handover', label: '申し送り' },
  { value: 'other', label: 'その他' },
];

/**
 * 意識レベルの記録用選択肢。
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

function labelOf<T extends string>(options: SelectOption<T>[], value: T): string {
  return options.find((option) => option.value === value)?.label ?? '—';
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

/** 保存済みの値が既知の選択肢かどうかを検査する（Local Storage 復元時に使用） */
export function isGender(value: unknown): value is Gender {
  return GENDER_OPTIONS.some((option) => option.value === value);
}

export function isBloodType(value: unknown): value is BloodType {
  return BLOOD_TYPE_OPTIONS.some((option) => option.value === value);
}

export function isRecordType(value: unknown): value is RecordType {
  return RECORD_TYPE_OPTIONS.some((option) => option.value === value);
}

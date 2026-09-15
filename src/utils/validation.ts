/** 入力値の検証ユーティリティ */

import { isValidDate } from './date';

/** 数値入力項目の許容範囲 */
export interface NumericRange {
  /** 入力欄のラベル（日本語） */
  label: string;
  min: number;
  max: number;
  /** input の step 属性 */
  step: number;
  /** 単位表記（表示用） */
  unit: string;
}

/**
 * バイタルサインの入力許容範囲。
 * 明らかな入力ミスを弾くための範囲であり、正常・異常の判定には使用しない。
 */
export const VITAL_RANGES = {
  temperature: { label: '体温', min: 25, max: 45, step: 0.1, unit: '℃' },
  systolic: { label: '収縮期血圧', min: 40, max: 300, step: 1, unit: 'mmHg' },
  diastolic: { label: '拡張期血圧', min: 20, max: 200, step: 1, unit: 'mmHg' },
  pulse: { label: '脈拍', min: 20, max: 250, step: 1, unit: '回/分' },
  respiration: { label: '呼吸数', min: 5, max: 80, step: 1, unit: '回/分' },
  spo2: { label: 'SpO₂', min: 50, max: 100, step: 1, unit: '%' },
  painScale: { label: '疼痛スケール', min: 0, max: 10, step: 1, unit: '' },
} as const satisfies Record<string, NumericRange>;

export type VitalFieldKey = keyof typeof VITAL_RANGES;

/** 自由入力欄の最大文字数 */
export const MAX_LENGTH = {
  patientId: 20,
  name: 50,
  room: 20,
  shortText: 100,
  longText: 2000,
} as const;

/** 数値入力の解析結果 */
export interface NumberParseResult {
  value: number | null;
  error: string | null;
}

/**
 * 数値入力欄の文字列を解析する。
 * 空文字は「未入力」として許容し、null を返す。
 */
export function parseNumericField(raw: string, range: NumericRange): NumberParseResult {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { value: null, error: null };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { value: null, error: '数値を入力してください。' };
  }
  if (parsed < range.min || parsed > range.max) {
    return {
      value: null,
      error: `${range.min}〜${range.max}${range.unit ? ` ${range.unit}` : ''} の範囲で入力してください。`,
    };
  }
  if (range.step >= 1 && !Number.isInteger(parsed)) {
    return { value: null, error: '整数で入力してください。' };
  }

  return { value: parsed, error: null };
}

/** 前後の空白を除去する */
export function normalizeText(value: string): string {
  return value.trim();
}

/** 空白のみでないことを確認する */
export function isBlank(value: string): boolean {
  return normalizeText(value) === '';
}

/**
 * 検索用に文字列を正規化する（前後空白除去 + 小文字化 + 全角英数の半角化 + 空白の除去）。
 */
export function normalizeForSearch(value: string): string {
  return value
    .trim()
    .replace(/[Ａ-Ｚａ-ｚ０-９－]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, '')
    .toLowerCase();
}

/** 生年月日が未来日でないことを確認する */
export function isFutureDate(value: string, now: Date = new Date()): boolean {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > now.getTime();
}

/** YYYY-MM-DD 形式かつ実在する日付か（2026-02-30 などを弾く） */
export function isValidDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return (
    isValidDate(date) &&
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
  );
}

/** 患者IDに使える文字: 英数字で始まり、英数字・ハイフン・アンダースコアのみ */
const PATIENT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

interface PatientIdOptions {
  isTaken: (patientId: string) => boolean;
  /** 編集時の元の患者ID。未変更なら形式チェックを免除し、旧データを編集可能にする */
  originalPatientId?: string;
}

export function validatePatientId(raw: string, options: PatientIdOptions): string | null {
  const value = normalizeText(raw);
  if (value === '') return '患者IDは必須です。空白のみでは登録できません。';

  const unchanged = options.originalPatientId !== undefined && value === options.originalPatientId;
  if (!unchanged) {
    if (value.length > MAX_LENGTH.patientId) {
      return `患者IDは${MAX_LENGTH.patientId}文字以内で入力してください。`;
    }
    if (!PATIENT_ID_PATTERN.test(value)) {
      return '患者IDは半角英数字で始まり、半角英数字・ハイフン(-)・アンダースコア(_)のみ使用できます。';
    }
    // Demo Data の再生成で置き換えられないよう、DEMO- で始まるIDは予約する
    if (value.toUpperCase().startsWith('DEMO-')) {
      return '「DEMO-」で始まる患者IDは Demo Data 専用のため使用できません。';
    }
  }
  if (options.isTaken(value)) {
    return `患者ID「${value}」は既に登録されています。別のIDを入力してください。`;
  }
  return null;
}

/** 生年月日の検証。未入力は許容する */
export function validateDateOfBirth(value: string, now: Date = new Date()): string | null {
  if (value === '') return null;
  if (!isValidDateOnly(value)) return '生年月日を正しい日付で入力してください（例：1960-04-12）。';
  if (isFutureDate(value, now)) return '生年月日に未来の日付は指定できません。';
  if (Number(value.slice(0, 4)) < now.getFullYear() - 130) {
    return '生年月日が130年以上前になっています。入力内容を確認してください。';
  }
  return null;
}

/** 記録日時として許容する未来方向の猶予（端末時刻のずれを考慮） */
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

/** datetime-local 入力値の検証。成功時は ISO 文字列を返す */
export function validateRecordDateTime(
  value: string,
  label: string,
  now: Date = new Date(),
): { iso: string | null; error: string | null } {
  if (value === '') return { iso: null, error: `${label}を入力してください。` };
  const date = new Date(value);
  if (!isValidDate(date)) return { iso: null, error: `${label}を正しく入力してください。` };
  if (date.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
    return { iso: null, error: `${label}に未来の日時は指定できません。` };
  }
  return { iso: date.toISOString(), error: null };
}

/** 開始日・終了日の前後関係の検証 */
export function validateDateRange(startDate: string, endDate: string): string | null {
  if (startDate !== '' && !isValidDateOnly(startDate)) return '開始日を正しい日付で入力してください。';
  if (endDate !== '' && !isValidDateOnly(endDate)) return '終了日を正しい日付で入力してください。';
  if (startDate !== '' && endDate !== '' && endDate < startDate) {
    return '終了日は開始日以降の日付を指定してください。';
  }
  return null;
}

/** カンマ・読点・改行区切りのタグ文字列を配列へ変換する（重複除去） */
export function parseTags(raw: string): string[] {
  const tags: string[] = [];
  for (const part of raw.split(/[,、，\n]/)) {
    const tag = part.trim().replace(/^#/, '');
    if (tag !== '' && !tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      tags.push(tag.slice(0, 30));
    }
  }
  return tags.slice(0, 10);
}

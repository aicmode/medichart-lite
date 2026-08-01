/** 入力値の検証ユーティリティ */

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

  return { value: parsed, error: null };
}

/** 前後の空白を除去する（未定義も安全に処理する） */
export function normalizeText(value: string): string {
  return value.trim();
}

/** 空白のみでないことを確認する */
export function isBlank(value: string): boolean {
  return normalizeText(value) === '';
}

/**
 * 検索用に文字列を正規化する（前後空白除去 + 小文字化）。
 */
export function normalizeForSearch(value: string): string {
  return value.trim().toLowerCase();
}

/** 生年月日が未来日でないことを確認する */
export function isFutureDate(value: string, now: Date = new Date()): boolean {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > now.getTime();
}

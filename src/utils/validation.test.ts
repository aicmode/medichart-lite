import { describe, expect, it } from 'vitest';
import {
  VITAL_RANGES,
  normalizeForSearch,
  parseNumericField,
  parseTags,
  validateDateOfBirth,
  validateDateRange,
  validatePatientId,
  validateRecordDateTime,
} from './validation';

const notTaken = () => false;

describe('validatePatientId', () => {
  it('requires a non-blank value', () => {
    expect(validatePatientId('   ', { isTaken: notTaken })).toMatch('必須');
  });

  it('rejects duplicate ids', () => {
    expect(validatePatientId('PT-0001', { isTaken: (id) => id === 'PT-0001' })).toMatch('既に登録');
  });

  it('rejects unsupported characters and overly long ids', () => {
    expect(validatePatientId('患者1', { isTaken: notTaken })).toMatch('半角英数字');
    expect(validatePatientId('A'.repeat(21), { isTaken: notTaken })).toMatch('20文字');
  });

  it('reserves the DEMO- prefix for demo data', () => {
    expect(validatePatientId('demo-0100', { isTaken: notTaken })).toMatch('DEMO-');
  });

  it('keeps legacy ids editable when unchanged', () => {
    expect(validatePatientId('旧ID-01', { isTaken: notTaken, originalPatientId: '旧ID-01' })).toBeNull();
  });

  it('accepts a valid id with surrounding spaces', () => {
    expect(validatePatientId(' PT_0003 ', { isTaken: notTaken })).toBeNull();
  });
});

describe('validateDateOfBirth', () => {
  const now = new Date(2026, 8, 15, 12, 0);

  it('allows an empty value', () => {
    expect(validateDateOfBirth('', now)).toBeNull();
  });

  it('rejects impossible calendar dates', () => {
    expect(validateDateOfBirth('2020-02-30', now)).toMatch('正しい日付');
    expect(validateDateOfBirth('1960/04/12', now)).toMatch('正しい日付');
  });

  it('rejects future dates', () => {
    expect(validateDateOfBirth('2026-09-16', now)).toMatch('未来');
  });

  it('rejects implausibly old dates', () => {
    expect(validateDateOfBirth('1890-01-01', now)).toMatch('130年');
  });

  it('accepts today', () => {
    expect(validateDateOfBirth('2026-09-15', now)).toBeNull();
  });
});

describe('validateRecordDateTime', () => {
  const now = new Date(2026, 8, 15, 12, 0);

  it('requires a value', () => {
    expect(validateRecordDateTime('', '記録日時', now).error).toMatch('入力');
  });

  it('rejects future timestamps beyond the tolerance', () => {
    expect(validateRecordDateTime('2026-09-15T13:00', '記録日時', now).error).toMatch('未来');
  });

  it('accepts timestamps within the tolerance and returns ISO', () => {
    const result = validateRecordDateTime('2026-09-15T12:03', '記録日時', now);
    expect(result.error).toBeNull();
    expect(result.iso).toBe(new Date(2026, 8, 15, 12, 3).toISOString());
  });
});

describe('parseNumericField', () => {
  it('treats blank as not recorded', () => {
    expect(parseNumericField(' ', VITAL_RANGES.pulse)).toEqual({ value: null, error: null });
  });

  it('parses decimals where allowed', () => {
    expect(parseNumericField('36.5', VITAL_RANGES.temperature)).toEqual({ value: 36.5, error: null });
  });

  it('requires integers for integer fields', () => {
    expect(parseNumericField('72.5', VITAL_RANGES.pulse).error).toMatch('整数');
  });

  it('rejects non-numeric and out-of-range input', () => {
    expect(parseNumericField('abc', VITAL_RANGES.pulse).error).toMatch('数値');
    expect(parseNumericField('301', VITAL_RANGES.systolic).error).toMatch('40〜300');
  });
});

describe('text helpers', () => {
  it('normalizes full-width characters and spaces for search', () => {
    expect(normalizeForSearch(' ＰＴ－０００１ ')).toBe('pt-0001');
    expect(normalizeForSearch('月見 里子')).toBe('月見里子');
  });

  it('parses tags without duplicates', () => {
    expect(parseTags('食事、#排泄, 食事\n')).toEqual(['食事', '排泄']);
  });

  it('validates date ranges', () => {
    expect(validateDateRange('2026-09-10', '2026-09-01')).toMatch('終了日');
    expect(validateDateRange('', '2026-09-01')).toBeNull();
    expect(validateDateRange('2026-02-30', '')).toMatch('開始日');
  });
});

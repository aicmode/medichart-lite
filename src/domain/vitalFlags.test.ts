import { describe, expect, it } from 'vitest';
import type { VitalSign } from '../types';
import { compareWithDemoThreshold, getVitalFlags } from './vitalFlags';

function vital(overrides: Partial<VitalSign>): VitalSign {
  return {
    id: 'v', patientId: 'p', measuredAt: '2026-09-15T00:00:00.000Z', temperature: 36.5, systolic: 120,
    diastolic: 70, pulse: 70, respiration: 16, spo2: 98, consciousness: '清明', painScale: 0, memo: '',
    createdAt: '2026-09-15T00:00:00.000Z', updatedAt: '2026-09-15T00:00:00.000Z', ...overrides,
  };
}

describe('compareWithDemoThreshold', () => {
  it('uses inclusive upper and exclusive lower boundaries', () => {
    expect(compareWithDemoThreshold('temperature', 37.9)).toBeNull();
    expect(compareWithDemoThreshold('temperature', 38.0)).toBe('high');
    expect(compareWithDemoThreshold('temperature', 35.5)).toBeNull();
    expect(compareWithDemoThreshold('temperature', 35.4)).toBe('low');
  });

  it('has no upper threshold for SpO2', () => {
    expect(compareWithDemoThreshold('spo2', 100)).toBeNull();
    expect(compareWithDemoThreshold('spo2', 93)).toBeNull();
    expect(compareWithDemoThreshold('spo2', 92)).toBe('low');
  });

  it('ignores missing values', () => {
    expect(compareWithDemoThreshold('pulse', null)).toBeNull();
  });
});

describe('getVitalFlags', () => {
  it('returns no flags for values inside the demo range', () => {
    expect(getVitalFlags(vital({}))).toEqual([]);
  });

  it('labels each flagged metric in a stable order', () => {
    const flags = getVitalFlags(vital({ spo2: 90, temperature: 38.4, systolic: null }));
    expect(flags.map((flag) => flag.label)).toEqual(['BT 38.4℃ ↑', 'SpO₂ 90% ↓']);
  });
});

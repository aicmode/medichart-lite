/**
 * バイタル値の「デモ用閾値」との比較。
 *
 * 重要: ここで使う閾値はポートフォリオ表示のための単純な固定値であり、
 * 医学的な正常・異常の判定、診断、緊急度判定ではない。
 * 年齢・既往・施設基準などは一切考慮しないため、医療判断に使用してはならない。
 */

import type { VitalSign } from '../types';

export type FlaggableVital = 'temperature' | 'systolic' | 'diastolic' | 'pulse' | 'respiration' | 'spo2';

interface DemoThreshold {
  /** この値未満を「デモ下限未満」とする */
  lowBelow: number | null;
  /** この値以上を「デモ上限以上」とする */
  highAtOrAbove: number | null;
  short: string;
  unit: string;
}

export const DEMO_VITAL_THRESHOLDS: Record<FlaggableVital, DemoThreshold> = {
  temperature: { lowBelow: 35.5, highAtOrAbove: 38.0, short: 'BT', unit: '℃' },
  systolic: { lowBelow: 90, highAtOrAbove: 160, short: 'SBP', unit: 'mmHg' },
  diastolic: { lowBelow: 50, highAtOrAbove: 100, short: 'DBP', unit: 'mmHg' },
  pulse: { lowBelow: 50, highAtOrAbove: 110, short: 'HR', unit: '/min' },
  respiration: { lowBelow: 10, highAtOrAbove: 25, short: 'RR', unit: '/min' },
  spo2: { lowBelow: 93, highAtOrAbove: null, short: 'SpO₂', unit: '%' },
};

export const DEMO_THRESHOLD_NOTICE =
  '「デモ閾値外」は固定のデモ用閾値と比較しただけの参考表示です。医学的な正常・異常の判定や診断ではなく、医療判断には使用できません。';

export type FlagDirection = 'low' | 'high';

export interface VitalFlag {
  metric: FlaggableVital;
  direction: FlagDirection;
  value: number;
  /** 例: "BT 38.2℃ ↑" */
  label: string;
}

/** 1項目の値をデモ閾値と比較する */
export function compareWithDemoThreshold(metric: FlaggableVital, value: number | null): FlagDirection | null {
  if (value === null) return null;
  const threshold = DEMO_VITAL_THRESHOLDS[metric];
  if (threshold.lowBelow !== null && value < threshold.lowBelow) return 'low';
  if (threshold.highAtOrAbove !== null && value >= threshold.highAtOrAbove) return 'high';
  return null;
}

const METRIC_ORDER: FlaggableVital[] = ['temperature', 'systolic', 'diastolic', 'pulse', 'respiration', 'spo2'];

/** 1回の測定で、デモ閾値外となった項目を返す */
export function getVitalFlags(vital: VitalSign): VitalFlag[] {
  const flags: VitalFlag[] = [];
  for (const metric of METRIC_ORDER) {
    const value = vital[metric];
    const direction = compareWithDemoThreshold(metric, value);
    if (direction !== null && value !== null) {
      const threshold = DEMO_VITAL_THRESHOLDS[metric];
      flags.push({
        metric,
        direction,
        value,
        label: `${threshold.short} ${value}${threshold.unit} ${direction === 'high' ? '↑' : '↓'}`,
      });
    }
  }
  return flags;
}

/** バイタル値の表示用フォーマット（評価は行わない） */

import type { VitalSign } from '../types';

export function formatVitalValue(value: number | null, unit = ''): string {
  if (value === null) return '—';
  return unit ? `${value} ${unit}` : `${value}`;
}

export function formatBloodPressure(vital: Pick<VitalSign, 'systolic' | 'diastolic'>): string {
  if (vital.systolic === null && vital.diastolic === null) return '—';
  return `${vital.systolic ?? '—'}/${vital.diastolic ?? '—'}`;
}

/** 1行サマリー（例: BT 36.8℃ / BP 120/70 / HR 72 / RR 16 / SpO₂ 98%） */
export function formatVitalSummary(vital: VitalSign): string {
  const parts: string[] = [];
  if (vital.temperature !== null) parts.push(`BT ${vital.temperature}℃`);
  if (vital.systolic !== null || vital.diastolic !== null) parts.push(`BP ${formatBloodPressure(vital)}`);
  if (vital.pulse !== null) parts.push(`HR ${vital.pulse}`);
  if (vital.respiration !== null) parts.push(`RR ${vital.respiration}`);
  if (vital.spo2 !== null) parts.push(`SpO₂ ${vital.spo2}%`);
  if (vital.consciousness && vital.consciousness !== '未記入') parts.push(`意識 ${vital.consciousness}`);
  return parts.length > 0 ? parts.join(' / ') : '数値の記録なし';
}

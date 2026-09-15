/**
 * Dashboard / Patient List 用の集計。
 * すべて保存済みデータからの機械的な集計であり、医学的な評価や優先度判定は行わない。
 */

import type { AppData, HandoverRecord, Patient, PatientTab, VitalSign } from '../types';
import { getVitalFlags } from './vitalFlags';
import type { VitalFlag } from './vitalFlags';
import { hasRegisteredAllergy } from './allergy';
import { isSameLocalDay } from '../utils/date';

export interface PatientSnapshot {
  patient: Patient;
  latestVital: VitalSign | null;
  latestVitalFlags: VitalFlag[];
  vitalCount: number;
  openHandovers: HandoverRecord[];
  hasAllergy: boolean;
  activeMedicationCount: number;
  /** 何らかの記録（バイタル・経過・SOAP・申し送り）の最新日時。なければ空文字 */
  lastActivityAt: string;
}

function maxIso(current: string, candidate: string): string {
  if (current === '') return candidate;
  return new Date(candidate).getTime() > new Date(current).getTime() ? candidate : current;
}

/** 患者ごとの最新状態をまとめる（O(記録数) で一度だけ走査する） */
export function buildPatientSnapshots(data: AppData): Map<string, PatientSnapshot> {
  const snapshots = new Map<string, PatientSnapshot>();
  for (const patient of data.patients) {
    snapshots.set(patient.id, {
      patient,
      latestVital: null,
      latestVitalFlags: [],
      vitalCount: 0,
      openHandovers: [],
      hasAllergy: hasRegisteredAllergy(patient.allergies),
      activeMedicationCount: 0,
      lastActivityAt: '',
    });
  }

  for (const vital of data.vitalSigns) {
    const snapshot = snapshots.get(vital.patientId);
    if (!snapshot) continue;
    snapshot.vitalCount += 1;
    if (
      snapshot.latestVital === null ||
      new Date(vital.measuredAt).getTime() > new Date(snapshot.latestVital.measuredAt).getTime()
    ) {
      snapshot.latestVital = vital;
    }
    snapshot.lastActivityAt = maxIso(snapshot.lastActivityAt, vital.measuredAt);
  }

  for (const note of data.nursingNotes) {
    const snapshot = snapshots.get(note.patientId);
    if (snapshot) snapshot.lastActivityAt = maxIso(snapshot.lastActivityAt, note.recordedAt);
  }
  for (const soap of data.soapRecords) {
    const snapshot = snapshots.get(soap.patientId);
    if (snapshot) snapshot.lastActivityAt = maxIso(snapshot.lastActivityAt, soap.recordedAt);
  }
  for (const handover of data.handovers) {
    const snapshot = snapshots.get(handover.patientId);
    if (!snapshot) continue;
    snapshot.lastActivityAt = maxIso(snapshot.lastActivityAt, handover.recordedAt);
    if (handover.status === 'open') snapshot.openHandovers.push(handover);
  }
  for (const medication of data.medications) {
    const snapshot = snapshots.get(medication.patientId);
    if (snapshot && medication.status === 'active') snapshot.activeMedicationCount += 1;
  }

  for (const snapshot of snapshots.values()) {
    if (snapshot.latestVital) snapshot.latestVitalFlags = getVitalFlags(snapshot.latestVital);
  }

  return snapshots;
}

export type AttentionKind = 'handover-high' | 'handover-open' | 'vital-flag' | 'no-vitals-today';

export interface AttentionItem {
  key: string;
  kind: AttentionKind;
  patient: Patient;
  english: string;
  japanese: string;
  detail: string;
  tab: PatientTab;
}

/** 表示順（業務上の確認順序を並べたもので、医学的な緊急度ではない） */
const ATTENTION_ORDER: Record<AttentionKind, number> = {
  'handover-high': 0,
  'vital-flag': 1,
  'handover-open': 2,
  'no-vitals-today': 3,
};

/** 「今日確認すべき情報」の一覧を組み立てる */
export function buildAttentionItems(
  snapshots: Map<string, PatientSnapshot>,
  now: Date = new Date(),
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const snapshot of snapshots.values()) {
    const { patient } = snapshot;
    const highHandovers = snapshot.openHandovers.filter((handover) => handover.priority === 'high');
    const otherHandovers = snapshot.openHandovers.length - highHandovers.length;

    if (highHandovers.length > 0) {
      items.push({
        key: `handover-high-${patient.id}`,
        kind: 'handover-high',
        patient,
        english: 'Priority Handover',
        japanese: '優先の申し送りが未確認',
        detail: `${highHandovers.length}件 — ${highHandovers[0].content.split('\n')[0]}`,
        tab: 'handover',
      });
    }
    if (snapshot.latestVitalFlags.length > 0) {
      items.push({
        key: `vital-flag-${patient.id}`,
        kind: 'vital-flag',
        patient,
        english: 'Outside Demo Range',
        japanese: '最新バイタルにデモ閾値外の項目',
        detail: snapshot.latestVitalFlags.map((flag) => flag.label).join(' / '),
        tab: 'vitals',
      });
    }
    if (otherHandovers > 0) {
      items.push({
        key: `handover-open-${patient.id}`,
        kind: 'handover-open',
        patient,
        english: 'Open Handover',
        japanese: '未確認の申し送り',
        detail: `${otherHandovers}件`,
        tab: 'handover',
      });
    }
    if (snapshot.latestVital === null || !isSameLocalDay(snapshot.latestVital.measuredAt, now)) {
      items.push({
        key: `no-vitals-${patient.id}`,
        kind: 'no-vitals-today',
        patient,
        english: 'No Vitals Today',
        japanese: '本日のバイタル記録なし',
        detail: snapshot.latestVital ? '前回測定から日付が変わっています' : 'バイタル未登録',
        tab: 'vitals',
      });
    }
  }

  return items.sort(
    (a, b) =>
      ATTENTION_ORDER[a.kind] - ATTENTION_ORDER[b.kind] ||
      a.patient.room.localeCompare(b.patient.room, 'ja', { numeric: true }),
  );
}

export interface TodayCounts {
  vitals: number;
  records: number;
  soap: number;
  handovers: number;
  total: number;
}

export function countTodayRecords(data: AppData, now: Date = new Date()): TodayCounts {
  const vitals = data.vitalSigns.filter((item) => isSameLocalDay(item.measuredAt, now)).length;
  const records = data.nursingNotes.filter((item) => isSameLocalDay(item.recordedAt, now)).length;
  const soap = data.soapRecords.filter((item) => isSameLocalDay(item.recordedAt, now)).length;
  const handovers = data.handovers.filter((item) => isSameLocalDay(item.recordedAt, now)).length;
  return { vitals, records, soap, handovers, total: vitals + records + soap + handovers };
}

export interface RoomGroup {
  room: string;
  snapshots: PatientSnapshot[];
}

/** 病室ごとに患者をまとめる（病室未登録は末尾） */
export function groupByRoom(snapshots: Iterable<PatientSnapshot>): RoomGroup[] {
  const groups = new Map<string, PatientSnapshot[]>();
  for (const snapshot of snapshots) {
    const room = snapshot.patient.room.trim();
    const list = groups.get(room) ?? [];
    list.push(snapshot);
    groups.set(room, list);
  }
  return [...groups.entries()]
    .map(([room, list]) => ({ room, snapshots: list }))
    .sort((a, b) => {
      if (a.room === '') return 1;
      if (b.room === '') return -1;
      return a.room.localeCompare(b.room, 'ja', { numeric: true });
    });
}

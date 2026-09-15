import { describe, expect, it } from 'vitest';
import type { AppData } from '../types';
import { createDemoData } from '../data/sampleData';
import { createEmptyAppData } from '../utils/storage';
import { buildAttentionItems, buildPatientSnapshots, countTodayRecords, groupByRoom } from './insights';

const now = new Date(2026, 8, 15, 12, 0);

function demoAppData(): AppData {
  return { ...createEmptyAppData(), ...createDemoData(10, 'DEMO', now), sampleDataLoaded: true };
}

describe('buildPatientSnapshots', () => {
  it('finds the latest vital and open handovers per patient', () => {
    const data = demoAppData();
    const snapshots = buildPatientSnapshots(data);
    const first = snapshots.get(data.patients[0].id);
    expect(first?.latestVital?.spo2).toBe(92);
    expect(first?.latestVitalFlags.map((flag) => flag.metric)).toContain('spo2');
    expect(first?.openHandovers).toHaveLength(1);
    expect(first?.hasAllergy).toBe(true);
  });
});

describe('buildAttentionItems', () => {
  it('orders items by operational check order', () => {
    const items = buildAttentionItems(buildPatientSnapshots(demoAppData()), now);
    const order = ['handover-high', 'vital-flag', 'handover-open', 'no-vitals-today'];
    const ranks = items.map((item) => order.indexOf(item.kind));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(items[0].kind).toBe('handover-high');
    expect(items.some((item) => item.kind === 'no-vitals-today' && item.patient.name === '葉月 ゆらら')).toBe(true);
  });
});

describe('countTodayRecords', () => {
  it('counts only records from the same local day', () => {
    const counts = countTodayRecords(demoAppData(), now);
    expect(counts.vitals).toBeGreaterThan(0);
    expect(counts.total).toBe(counts.vitals + counts.records + counts.soap + counts.handovers);
    expect(countTodayRecords(demoAppData(), new Date(2030, 0, 1)).total).toBe(0);
  });
});

describe('groupByRoom', () => {
  it('sorts rooms numerically and puts unassigned last', () => {
    const data = demoAppData();
    const [a, b, c] = data.patients;
    const patients = [{ ...a, room: '' }, { ...b, room: '1010' }, { ...c, room: '305' }];
    const groups = groupByRoom(buildPatientSnapshots({ ...data, patients }).values());
    expect(groups.map((group) => group.room)).toEqual(['305', '1010', '']);
  });
});

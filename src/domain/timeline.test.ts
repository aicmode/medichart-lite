import { describe, expect, it } from 'vitest';
import type { HandoverRecord, Medication, Patient } from '../types';
import { buildTimeline } from './timeline';

const patient: Patient = {
  id: 'p1', patientId: 'PT-0001', name: '架空 花子', avatarUrl: '', dateOfBirth: '', gender: 'female', room: '',
  bloodType: 'unknown', allergies: '', medicalHistory: '', chiefComplaint: '', diagnoses: [], notes: '',
  createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-10T00:00:00.000Z', profileUpdatedAt: '',
};

const medication: Medication = {
  id: 'm1', patientId: 'p1', category: 'regular', name: '薬A', dose: '1', unit: '錠', timing: '朝', indication: '',
  lastAdministeredAt: '', startDate: '', endDate: '', status: 'active', memo: '',
  createdAt: '2026-09-02T00:00:00.000Z', updatedAt: '2026-09-02T00:00:00.000Z',
};

const handover: HandoverRecord = {
  id: 'h1', patientId: 'p1', recordedAt: '2026-09-03T00:00:00.000Z', author: '', priority: 'high', content: '内容\n2行目',
  cautions: '', status: 'acknowledged', acknowledgedAt: '2026-09-03T02:00:00.000Z',
  createdAt: '2026-09-03T00:00:00.000Z', updatedAt: '2026-09-03T02:00:00.000Z',
};

const empty = { vitalSigns: [], nursingNotes: [], soapRecords: [], medications: [], handovers: [] };

describe('buildTimeline', () => {
  it('always includes the registration event', () => {
    const events = buildTimeline({ patient, ...empty });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ kind: 'patient-created', tab: 'overview' });
  });

  it('adds a medication update event only when edited after creation', () => {
    const unedited = buildTimeline({ patient, ...empty, medications: [medication] });
    expect(unedited.filter((event) => event.kind === 'medication-updated')).toHaveLength(0);

    const edited = buildTimeline({
      patient,
      ...empty,
      medications: [{ ...medication, status: 'paused', updatedAt: '2026-09-05T00:00:00.000Z' }],
    });
    expect(edited.find((event) => event.kind === 'medication-updated')?.detail).toContain('一時中止');
  });

  it('sorts events newest first and includes profile edits and acknowledgements', () => {
    const events = buildTimeline({
      patient: { ...patient, profileUpdatedAt: '2026-09-04T00:00:00.000Z' },
      ...empty,
      medications: [medication],
      handovers: [handover],
    });
    expect(events.map((event) => event.kind)).toEqual([
      'patient-updated',
      'handover-acknowledged',
      'handover',
      'medication-added',
      'patient-created',
    ]);
    expect(events.find((event) => event.kind === 'handover')?.detail).toBe('内容');
  });
});

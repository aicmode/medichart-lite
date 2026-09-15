import { describe, expect, it } from 'vitest';
import { DATA_VERSION, parseStoredData } from './storage';

const now = new Date('2026-09-15T03:00:00.000Z');

const basePatient = {
  id: 'p1',
  patientId: 'PT-0001',
  name: '架空 太郎',
  dateOfBirth: '1950-01-01',
  gender: 'male',
  room: '301',
  bloodType: 'A',
  allergies: '',
  medicalHistory: '',
  chiefComplaint: '',
  diagnoses: ['高血圧症'],
  notes: '',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
};

function parseOk(value: unknown) {
  const result = parseStoredData(JSON.stringify(value), now);
  if (result.status !== 'ok') throw new Error('expected ok');
  return result.result;
}

describe('parseStoredData', () => {
  it('reports broken JSON as corrupt without throwing', () => {
    expect(parseStoredData('{broken', now).status).toBe('corrupt');
  });

  it('reports non-object JSON as corrupt', () => {
    expect(parseStoredData('[]', now).status).toBe('corrupt');
    expect(parseStoredData('null', now).status).toBe('corrupt');
  });

  it('migrates v1 data by filling new collections and fields', () => {
    const { data, sourceVersion, droppedCount } = parseOk({
      version: 1,
      sampleDataLoaded: true,
      patients: [basePatient],
      vitalSigns: [
        {
          id: 'v1', patientId: 'p1', measuredAt: '2026-08-02T00:00:00.000Z', temperature: 36.5, systolic: 120,
          diastolic: 70, pulse: 70, respiration: 16, spo2: 98, consciousness: '清明', painScale: 0, memo: '',
          createdAt: '2026-08-02T00:00:00.000Z',
        },
      ],
      nursingNotes: [
        { id: 'n1', patientId: 'p1', recordedAt: '2026-08-02T01:00:00.000Z', author: 'A', recordType: 'soap', body: '記録', createdAt: '2026-08-02T01:00:00.000Z' },
      ],
    });

    expect(sourceVersion).toBe(1);
    expect(droppedCount).toBe(0);
    expect(data.version).toBe(DATA_VERSION);
    expect(data.sampleDataLoaded).toBe(true);
    expect(data.patients[0]).toMatchObject({ patientId: 'PT-0001', avatarUrl: '', profileUpdatedAt: '' });
    expect(data.vitalSigns[0].updatedAt).toBe('2026-08-02T00:00:00.000Z');
    expect(data.nursingNotes[0]).toMatchObject({ recordType: 'soap', tags: [], updatedAt: '2026-08-02T01:00:00.000Z' });
    expect(data.medications).toEqual([]);
    expect(data.soapRecords).toEqual([]);
    expect(data.handovers).toEqual([]);
  });

  it('infers medication status for v3 data from the end date', () => {
    const med = { patientId: 'p1', category: 'regular', name: '薬A', dose: '1', unit: '錠', startDate: '2026-08-01' };
    const { data } = parseOk({
      version: 3,
      patients: [basePatient],
      medications: [
        { ...med, id: 'm1', endDate: '2026-09-01' },
        { ...med, id: 'm2', endDate: '' },
        { ...med, id: 'm3', endDate: '2026-12-01' },
        { ...med, id: 'm4', endDate: '', status: 'paused' },
      ],
    });
    expect(data.medications.map((m) => m.status)).toEqual(['completed', 'active', 'active', 'paused']);
  });

  it('drops orphan and invalid records and reports the count', () => {
    const { data, droppedCount } = parseOk({
      version: 4,
      patients: [basePatient, { id: 'p2', patientId: '', name: '' }, 'not-an-object'],
      vitalSigns: [{ id: 'v1', patientId: 'missing' }],
      handovers: [{ id: 'h1', patientId: 'p1', content: '   ' }],
      soapRecords: [{ id: 's1', patientId: 'p1', subjective: '', objective: '', assessment: '', plan: '' }],
    });
    expect(data.patients).toHaveLength(1);
    expect(droppedCount).toBe(5);
  });

  it('normalizes unknown enum values and inconsistent handover state', () => {
    const { data } = parseOk({
      version: 4,
      patients: [{ ...basePatient, gender: 'x', bloodType: 'Z' }],
      handovers: [
        { id: 'h1', patientId: 'p1', content: '内容', priority: 'urgent', status: 'open', acknowledgedAt: '2026-09-01T00:00:00.000Z' },
      ],
      nursingNotes: [{ id: 'n1', patientId: 'p1', body: '記録', recordType: 'unknown' }],
    });
    expect(data.patients[0]).toMatchObject({ gender: 'undisclosed', bloodType: 'unknown' });
    expect(data.handovers[0]).toMatchObject({ priority: 'normal', status: 'open', acknowledgedAt: '' });
    expect(data.nursingNotes[0].recordType).toBe('other');
  });

  it('replaces invalid timestamps with safe fallbacks', () => {
    const { data } = parseOk({ version: 4, patients: [{ ...basePatient, createdAt: 'not-a-date', updatedAt: 42 }] });
    expect(data.patients[0].createdAt).toBe(now.toISOString());
    expect(data.patients[0].updatedAt).toBe(now.toISOString());
  });

  it('keeps the first patient when internal ids collide', () => {
    const { data, droppedCount } = parseOk({
      version: 4,
      patients: [basePatient, { ...basePatient, patientId: 'PT-0002', name: '重複' }],
    });
    expect(data.patients.map((p) => p.patientId)).toEqual(['PT-0001']);
    expect(droppedCount).toBe(1);
  });
});

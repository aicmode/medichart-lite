import { describe, expect, it } from 'vitest';
import { VITAL_RANGES } from '../utils/validation';
import { DATA_VERSION, parseStoredData } from '../utils/storage';
import { createDemoData, createSampleData, isDemoPatientId } from './sampleData';

const now = new Date(2026, 8, 15, 12, 0);

describe('createDemoData', () => {
  const demo = createDemoData(10, 'DEMO', now);
  const patientIds = new Set(demo.patients.map((patient) => patient.id));

  it('creates ten fictional patients with unique DEMO- ids', () => {
    expect(demo.patients).toHaveLength(10);
    expect(new Set(demo.patients.map((patient) => patient.patientId)).size).toBe(10);
    expect(demo.patients.every((patient) => isDemoPatientId(patient.patientId))).toBe(true);
    expect(demo.patients.every((patient) => patient.notes.includes('架空'))).toBe(true);
  });

  it('covers every v2 record type and links all records to patients', () => {
    const children = [...demo.vitalSigns, ...demo.nursingNotes, ...demo.soapRecords, ...demo.medications, ...demo.handovers];
    for (const collection of [demo.vitalSigns, demo.nursingNotes, demo.soapRecords, demo.medications, demo.handovers]) {
      expect(collection.length).toBeGreaterThan(0);
    }
    expect(children.every((record) => patientIds.has(record.patientId))).toBe(true);
  });

  it('keeps vital values inside the input validation ranges', () => {
    for (const vital of demo.vitalSigns) {
      for (const key of Object.keys(VITAL_RANGES) as (keyof typeof VITAL_RANGES)[]) {
        const value = vital[key];
        if (value !== null) {
          expect(value).toBeGreaterThanOrEqual(VITAL_RANGES[key].min);
          expect(value).toBeLessThanOrEqual(VITAL_RANGES[key].max);
        }
      }
    }
  });

  it('survives a storage round-trip without dropping records', () => {
    const stored = JSON.stringify({ version: DATA_VERSION, ...demo, sampleDataLoaded: true });
    const parsed = parseStoredData(stored, now);
    expect(parsed.status).toBe('ok');
    if (parsed.status === 'ok') expect(parsed.result.droppedCount).toBe(0);
  });

  it('limits the count safely', () => {
    expect(createDemoData(0, 'DEMO', now).patients).toHaveLength(0);
    expect(createDemoData(99, 'DEMO', now).patients).toHaveLength(10);
  });
});

describe('createSampleData', () => {
  it('creates two PT- patients that are not treated as demo data', () => {
    const sample = createSampleData(now);
    expect(sample.patients.map((patient) => patient.patientId)).toEqual(['PT-0001', 'PT-0002']);
    expect(sample.patients.some((patient) => isDemoPatientId(patient.patientId))).toBe(false);
  });
});

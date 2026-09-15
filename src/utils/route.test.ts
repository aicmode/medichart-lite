import { describe, expect, it } from 'vitest';
import type { PatientTab } from '../types';
import { PATIENT_TABS } from '../data/options';
import { parseHash, patientHash, routeToHash } from './route';

describe('parseHash', () => {
  it('maps top-level pages', () => {
    expect(parseHash('')).toEqual({ name: 'dashboard' });
    expect(parseHash('#/')).toEqual({ name: 'dashboard' });
    expect(parseHash('#/patients')).toEqual({ name: 'patients' });
    expect(parseHash('#/patients/')).toEqual({ name: 'patients' });
    expect(parseHash('#/patients/new')).toEqual({ name: 'new-patient' });
    expect(parseHash('#/data')).toEqual({ name: 'data' });
  });

  it('maps patient detail with default and explicit tabs', () => {
    expect(parseHash('#/patients/abc')).toEqual({ name: 'patient-detail', patientId: 'abc', tab: 'overview' });
    expect(parseHash('#/patients/abc/vitals')).toEqual({ name: 'patient-detail', patientId: 'abc', tab: 'vitals' });
  });

  it('returns not-found for unknown paths, tabs and broken encodings', () => {
    expect(parseHash('#/nope')).toEqual({ name: 'not-found', path: '/nope' });
    expect(parseHash('#/patients/abc/unknown')).toEqual({ name: 'not-found', path: '/patients/abc/unknown' });
    expect(parseHash('#/patients/abc/vitals/extra').name).toBe('not-found');
    expect(parseHash('#/patients/%E0%A4%A').name).toBe('not-found');
  });
});

describe('routeToHash', () => {
  it('round-trips every patient tab with an encoded id', () => {
    for (const { value } of PATIENT_TABS) {
      const tab: PatientTab = value;
      const route = { name: 'patient-detail' as const, patientId: 'a b/c', tab };
      expect(parseHash(routeToHash(route))).toEqual(route);
    }
  });

  it('omits the overview segment', () => {
    expect(patientHash('x')).toBe('#/patients/x');
    expect(routeToHash({ name: 'new-patient' })).toBe('#/patients/new');
  });
});

/** 患者単位の記録を取り出して新しい順に並べる */

import type { AppData, HandoverRecord, Medication, NursingNote, SoapRecord, VitalSign } from '../types';
import { compareIsoDesc } from '../utils/date';

export interface PatientRecords {
  vitalSigns: VitalSign[];
  nursingNotes: NursingNote[];
  soapRecords: SoapRecord[];
  medications: Medication[];
  handovers: HandoverRecord[];
}

export function selectPatientRecords(data: AppData, patientId: string): PatientRecords {
  const own = <T extends { patientId: string }>(items: T[]) => items.filter((item) => item.patientId === patientId);
  return {
    vitalSigns: own(data.vitalSigns).sort((a, b) => compareIsoDesc(a.measuredAt, b.measuredAt)),
    nursingNotes: own(data.nursingNotes).sort((a, b) => compareIsoDesc(a.recordedAt, b.recordedAt)),
    soapRecords: own(data.soapRecords).sort((a, b) => compareIsoDesc(a.recordedAt, b.recordedAt)),
    medications: own(data.medications).sort((a, b) => compareIsoDesc(a.updatedAt, b.updatedAt)),
    handovers: own(data.handovers).sort((a, b) => {
      // 未確認を先に、その中で新しい順
      if (a.status !== b.status) return a.status === 'open' ? -1 : 1;
      return compareIsoDesc(a.recordedAt, b.recordedAt);
    }),
  };
}

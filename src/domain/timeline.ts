/**
 * 患者タイムラインの生成。
 * イベント専用のデータは保存せず、各記録の timestamp から表示用に組み立てる。
 */

import type {
  HandoverRecord,
  Medication,
  NursingNote,
  Patient,
  PatientTab,
  SoapRecord,
  VitalSign,
} from '../types';
import { handoverPriorityLabel, medicationStatusLabel, recordTypeLabel } from '../data/options';
import { formatVitalSummary } from './vitalFormat';

export type TimelineEventKind =
  | 'patient-created'
  | 'patient-updated'
  | 'vital'
  | 'record'
  | 'soap'
  | 'medication-added'
  | 'medication-updated'
  | 'handover'
  | 'handover-acknowledged';

export interface TimelineEvent {
  id: string;
  kind: TimelineEventKind;
  at: string;
  english: string;
  japanese: string;
  detail: string;
  /** 詳細を確認できるタブ */
  tab: PatientTab;
}

export interface TimelineSource {
  patient: Patient;
  vitalSigns: VitalSign[];
  nursingNotes: NursingNote[];
  soapRecords: SoapRecord[];
  medications: Medication[];
  handovers: HandoverRecord[];
}

/** 作成直後の保存と区別するための最小差分（ミリ秒） */
const EDIT_THRESHOLD_MS = 1000;

function isEditedLater(createdAt: string, updatedAt: string): boolean {
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > EDIT_THRESHOLD_MS;
}

function firstLine(text: string, max = 80): string {
  const line = text.split('\n').find((item) => item.trim() !== '')?.trim() ?? '';
  return line.length > max ? `${line.slice(0, max)}…` : line;
}

export function buildTimeline(source: TimelineSource): TimelineEvent[] {
  const { patient } = source;
  const events: TimelineEvent[] = [
    {
      id: `patient-created-${patient.id}`,
      kind: 'patient-created',
      at: patient.createdAt,
      english: 'Registered',
      japanese: '患者登録',
      detail: `${patient.patientId} / ${patient.name}`,
      tab: 'overview',
    },
  ];

  if (patient.profileUpdatedAt !== '') {
    events.push({
      id: `patient-updated-${patient.id}`,
      kind: 'patient-updated',
      at: patient.profileUpdatedAt,
      english: 'Profile Updated',
      japanese: '基本情報・医療情報を更新（最終）',
      detail: '患者情報が編集されました。',
      tab: 'medical',
    });
  }

  for (const vital of source.vitalSigns) {
    events.push({
      id: `vital-${vital.id}`,
      kind: 'vital',
      at: vital.measuredAt,
      english: 'Vitals',
      japanese: 'バイタル記録',
      detail: formatVitalSummary(vital),
      tab: 'vitals',
    });
  }

  for (const note of source.nursingNotes) {
    events.push({
      id: `record-${note.id}`,
      kind: 'record',
      at: note.recordedAt,
      english: 'Record',
      japanese: recordTypeLabel(note.recordType),
      detail: firstLine(note.body),
      tab: 'records',
    });
  }

  for (const soap of source.soapRecords) {
    events.push({
      id: `soap-${soap.id}`,
      kind: 'soap',
      at: soap.recordedAt,
      english: 'SOAP',
      japanese: 'SOAP記録',
      detail: soap.problem || firstLine(soap.subjective || soap.objective),
      tab: 'soap',
    });
  }

  for (const medication of source.medications) {
    const label = `${medication.name} ${medication.dose}${medication.unit}`;
    events.push({
      id: `medication-added-${medication.id}`,
      kind: 'medication-added',
      at: medication.createdAt,
      english: 'Medication Added',
      japanese: '内服を登録',
      detail: label,
      tab: 'medications',
    });
    if (isEditedLater(medication.createdAt, medication.updatedAt)) {
      events.push({
        id: `medication-updated-${medication.id}`,
        kind: 'medication-updated',
        at: medication.updatedAt,
        english: 'Medication Updated',
        japanese: '内服を変更（最終）',
        detail: `${label}（${medicationStatusLabel(medication.status)}）`,
        tab: 'medications',
      });
    }
  }

  for (const handover of source.handovers) {
    events.push({
      id: `handover-${handover.id}`,
      kind: 'handover',
      at: handover.recordedAt,
      english: 'Handover',
      japanese: `申し送り（${handoverPriorityLabel(handover.priority)}）`,
      detail: firstLine(handover.content),
      tab: 'handover',
    });
    if (handover.status === 'acknowledged' && handover.acknowledgedAt !== '') {
      events.push({
        id: `handover-ack-${handover.id}`,
        kind: 'handover-acknowledged',
        at: handover.acknowledgedAt,
        english: 'Handover Acknowledged',
        japanese: '申し送りを確認',
        detail: firstLine(handover.content, 40),
        tab: 'handover',
      });
    }
  }

  return events
    .filter((event) => !Number.isNaN(new Date(event.at).getTime()))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

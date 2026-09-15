/**
 * ローカル規則ベースの記録支援 Provider（追加費用0円・外部送信なし）。
 *
 * 文章中の語句に基づいて「抜き出し・並べ替え・定型文への流し込み」を行うだけで、
 * 新しい臨床的内容（アセスメントや計画）を生成しない。
 */

import type {
  AssistContext,
  AssistResult,
  HandoverDraft,
  RecordAssistProvider,
  SoapDraft,
} from './types';
import { ASSIST_BASE_NOTICE } from './types';
import { calculateAge, formatDateTime } from '../utils/date';
import { genderLabel, recordTypeLabel } from '../data/options';
import { formatVitalSummary } from '../domain/vitalFormat';
import { getVitalFlags } from '../domain/vitalFlags';
import { parseAllergyItems } from '../domain/allergy';

const PROVIDER_LABEL = 'ローカル規則ベース（外部送信なし）';

/** 文単位に分割する（句点・感嘆符・疑問符・改行） */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[。！？!?])|\n/)
    .map((sentence) => sentence.replace(/^[・\-*●■\s]+/, '').trim())
    .filter((sentence) => sentence !== '');
}

const SUBJECTIVE_PATTERN = /「[^」]*」|訴え|と話す|と話され|との発言|本人より|患者より|と言う|痛い|つらい|辛い|眠れない|したい|不安/;
const OBJECTIVE_PATTERN = /\d|測定|観察|認め|摂取|実施|表情|皮膚|創部|排便|排尿|歩行|体温|血圧|脈拍|SpO|呼吸|発赤|腫脹|顔色|入眠|離床/;
const ASSESSMENT_PATTERN = /考えられる|と思われる|評価|示唆|可能性|と判断/;
const PLAN_PATTERN = /予定|継続する|継続し|観察する|実施する|検討|確認する|指導する|依頼|次回|引き続き/;

const KEY_PATTERN = /訴え|痛|転倒|食事|摂取|排泄|排便|排尿|睡眠|入眠|内服|家族|実施|測定|発熱|咳|呼吸|創部|不安|離床|歩行|「/;

function unique(list: string[]): string[] {
  return [...new Set(list)];
}

function done<T>(value: T, notices: string[]): Promise<AssistResult<T>> {
  return Promise.resolve({ value, notices: [ASSIST_BASE_NOTICE, ...notices], providerLabel: PROVIDER_LABEL });
}

function summarizeNoteText(text: string): { summary: string; notices: string[] } {
  const sentences = unique(splitSentences(text));
  if (sentences.length === 0) {
    return { summary: '', notices: ['要点を抽出できる文章がありません。'] };
  }
  const prioritized = sentences.filter((sentence) => KEY_PATTERN.test(sentence));
  const picked = (prioritized.length > 0 ? prioritized : sentences).slice(0, 6);
  const omitted = sentences.length - picked.length;
  const notices = ['キーワード規則による機械的な抜き出しです。重要な内容が漏れていないか原文と照合してください。'];
  if (omitted > 0) notices.push(`${omitted}文は要点に含めていません。`);
  return { summary: picked.map((sentence) => `・${sentence}`).join('\n'), notices };
}

/** 記録者の文章を S/O/A/P に振り分ける（新しい文は作らない） */
export function classifySoap(text: string): SoapDraft {
  const buckets: Record<keyof SoapDraft, string[]> = {
    subjective: [],
    objective: [],
    assessment: [],
    plan: [],
    unclassified: [],
  };
  for (const sentence of splitSentences(text)) {
    if (SUBJECTIVE_PATTERN.test(sentence)) buckets.subjective.push(sentence);
    else if (PLAN_PATTERN.test(sentence)) buckets.plan.push(sentence);
    else if (ASSESSMENT_PATTERN.test(sentence)) buckets.assessment.push(sentence);
    else if (OBJECTIVE_PATTERN.test(sentence)) buckets.objective.push(sentence);
    else buckets.unclassified.push(sentence);
  }
  return {
    subjective: buckets.subjective.join('\n'),
    objective: buckets.objective.join('\n'),
    assessment: buckets.assessment.join('\n'),
    plan: buckets.plan.join('\n'),
    unclassified: buckets.unclassified.join('\n'),
  };
}

function patientLine(context: AssistContext): string {
  const { patient } = context;
  const age = calculateAge(patient.dateOfBirth);
  const attributes = [age === null ? null : `${age}歳`, genderLabel(patient.gender), patient.room ? `病室 ${patient.room}` : null]
    .filter((item): item is string => item !== null)
    .join('・');
  return `${patient.patientId} ${patient.name}（${attributes}）`;
}

function latestBy<T>(items: T[], getAt: (item: T) => string): T | null {
  let latest: T | null = null;
  for (const item of items) {
    if (latest === null || new Date(getAt(item)).getTime() > new Date(getAt(latest)).getTime()) latest = item;
  }
  return latest;
}

function buildHandoverDraft(context: AssistContext): { draft: HandoverDraft; notices: string[] } {
  const { patient } = context;
  const latestVital = latestBy(context.vitalSigns, (vital) => vital.measuredAt);
  const latestNote = latestBy(context.nursingNotes, (note) => note.recordedAt);
  const latestSoap = latestBy(context.soapRecords, (soap) => soap.recordedAt);
  const activeMeds = context.medications.filter((medication) => medication.status === 'active');
  const openHandovers = context.handovers.filter((handover) => handover.status === 'open');

  const lines = [
    `【患者】${patientLine(context)}`,
    `【主要疾患】${patient.diagnoses.length > 0 ? patient.diagnoses.join('、') : '未登録'}`,
    latestVital
      ? `【最新バイタル】${formatDateTime(latestVital.measuredAt)} ${formatVitalSummary(latestVital)}`
      : '【最新バイタル】記録なし',
  ];
  if (latestNote) {
    lines.push(
      `【直近の記録】${formatDateTime(latestNote.recordedAt)}（${recordTypeLabel(latestNote.recordType)}）${splitSentences(latestNote.body)[0] ?? ''}`,
    );
  }
  if (latestSoap && latestSoap.plan.trim() !== '') {
    lines.push(`【SOAP記録のP（記録者記載）】${splitSentences(latestSoap.plan)[0] ?? ''}`);
  }
  lines.push(
    activeMeds.length > 0
      ? `【継続中の内服（登録内容）】${activeMeds.map((m) => `${m.name} ${m.dose}${m.unit}${m.timing ? ` ${m.timing}` : ''}`).join('、')}`
      : '【継続中の内服（登録内容）】なし',
  );
  lines.push(`【未確認の申し送り】${openHandovers.length}件`);
  lines.push('【伝達事項】（記録者が追記してください）');

  const cautions: string[] = [];
  const allergies = parseAllergyItems(patient.allergies);
  if (allergies.length > 0) cautions.push(`アレルギー登録あり: ${allergies.join('、')}`);
  if (latestVital) {
    const flags = getVitalFlags(latestVital);
    if (flags.length > 0) {
      cautions.push(`最新バイタルのデモ閾値外項目（参考表示・判定ではない）: ${flags.map((flag) => flag.label).join(' / ')}`);
    }
  }
  for (const handover of openHandovers) {
    if (handover.cautions.trim() !== '') cautions.push(`既存の申し送りの注意事項: ${handover.cautions.trim()}`);
  }

  return {
    draft: { content: lines.join('\n'), cautions: cautions.join('\n') },
    notices: ['保存済みデータを定型文へ並べただけの下書きです。伝達事項は記録者が記入してください。'],
  };
}

function buildPatientSummary(context: AssistContext): string {
  const { patient } = context;
  const latestVital = latestBy(context.vitalSigns, (vital) => vital.measuredAt);
  const allergies = parseAllergyItems(patient.allergies);
  const activeMeds = context.medications.filter((medication) => medication.status === 'active');
  const openHandovers = context.handovers.filter((handover) => handover.status === 'open');

  return [
    `${patientLine(context)}。`,
    `登録疾患: ${patient.diagnoses.length > 0 ? patient.diagnoses.join('、') : '未登録'}。`,
    `主訴（登録内容）: ${patient.chiefComplaint || '未登録'}。`,
    `アレルギー: ${allergies.length > 0 ? allergies.join('、') : '登録なし'}。`,
    latestVital ? `最新バイタル（${formatDateTime(latestVital.measuredAt)}）: ${formatVitalSummary(latestVital)}。` : '最新バイタル: 記録なし。',
    `継続中の内服: ${activeMeds.length}件、経過記録: ${context.nursingNotes.length}件、SOAP: ${context.soapRecords.length}件、未確認の申し送り: ${openHandovers.length}件。`,
  ].join('\n');
}

export const localRuleProvider: RecordAssistProvider = {
  id: 'local-rule',
  label: PROVIDER_LABEL,
  sendsDataExternally: false,

  summarizeNote(text) {
    const { summary, notices } = summarizeNoteText(text);
    return done(summary, notices);
  },

  draftSoap(text) {
    const draft = classifySoap(text);
    const notices = ['文章中の語句で S/O/A/P に振り分けただけです。A（アセスメント）と P（計画）は新たに生成しません。'];
    if (draft.assessment === '' || draft.plan === '') {
      notices.push('空欄の項目は記録者が記入してください。');
    }
    if (draft.unclassified !== '') notices.push('分類できなかった文は「未分類」に残しています。');
    return done(draft, notices);
  },

  draftHandover(context) {
    const { draft, notices } = buildHandoverDraft(context);
    return done(draft, notices);
  },

  summarizePatient(context) {
    return done(buildPatientSummary(context), ['登録済みデータの事実のみを並べたサマリーです。']);
  },
};

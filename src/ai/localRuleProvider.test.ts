import { describe, expect, it } from 'vitest';
import { createDemoData } from '../data/sampleData';
import { selectPatientRecords } from '../domain/selectors';
import { createEmptyAppData } from '../utils/storage';
import { ASSIST_BASE_NOTICE } from './types';
import { classifySoap, localRuleProvider, splitSentences } from './localRuleProvider';

describe('splitSentences', () => {
  it('splits on Japanese punctuation and new lines and strips bullets', () => {
    expect(splitSentences('朝食を摂取。歩行した\n・排便あり')).toEqual(['朝食を摂取。', '歩行した', '排便あり']);
  });
});

describe('classifySoap', () => {
  it('only redistributes the writer’s sentences and never invents A/P content', () => {
    const draft = classifySoap('「夜眠れなかった」と訴えあり。BT 36.9℃。今夜も入眠状況を観察する予定。家族の面会あり。');
    expect(draft.subjective).toContain('夜眠れなかった');
    expect(draft.objective).toBe('BT 36.9℃。');
    expect(draft.plan).toBe('今夜も入眠状況を観察する予定。');
    expect(draft.assessment).toBe('');
    expect(draft.unclassified).toBe('家族の面会あり。');
  });
});

describe('localRuleProvider', () => {
  it('declares that it does not send data externally', () => {
    expect(localRuleProvider.sendsDataExternally).toBe(false);
  });

  it('returns an empty summary with notices for empty input', async () => {
    const result = await localRuleProvider.summarizeNote('   ');
    expect(result.value).toBe('');
    expect(result.notices[0]).toBe(ASSIST_BASE_NOTICE);
  });

  it('builds a handover draft from stored facts with safety notices', async () => {
    const now = new Date(2026, 8, 15, 12, 0);
    const data = { ...createEmptyAppData(), ...createDemoData(1, 'DEMO', now) };
    const patient = data.patients[0];
    const result = await localRuleProvider.draftHandover({ patient, ...selectPatientRecords(data, patient.id) });

    expect(result.value.content).toContain(patient.patientId);
    expect(result.value.content).toContain('【最新バイタル】');
    expect(result.value.content).toContain('（記録者が追記してください）');
    expect(result.value.cautions).toContain('アレルギー登録あり');
    expect(result.value.cautions).toContain('判定ではない');
    expect(result.notices).toContain(ASSIST_BASE_NOTICE);
  });
});

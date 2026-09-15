/**
 * 架空患者と関連記録をまとめて生成するデモデータファクトリー。
 *
 * - 氏名は実在人物と誤認しにくい創作名を使用し、備考にも架空データである旨を明記する。
 * - 日時は生成時刻からの相対値で作るため、いつ生成しても「今日の記録」が確認できる。
 * - バイタルの一部はデモ閾値外の表示を確認できるように意図的に設定している（医学的な意味はない）。
 */
import type {
  AppData,
  BloodType,
  Gender,
  HandoverPriority,
  HandoverRecord,
  Medication,
  MedicationCategory,
  MedicationStatus,
  Patient,
  RecordType,
  SoapRecord,
  VitalSign,
} from '../types';
import { generateId } from '../utils/id';
import { todayDateValue } from '../utils/date';

export type DemoData = Pick<
  AppData,
  'patients' | 'vitalSigns' | 'nursingNotes' | 'soapRecords' | 'medications' | 'handovers'
>;

/** Demo Data の患者IDプレフィックス（利用者の登録では使用不可） */
export const DEMO_PREFIX = 'DEMO';

type VitalOverride = Partial<Pick<VitalSign, 'temperature' | 'systolic' | 'diastolic' | 'pulse' | 'respiration' | 'spo2' | 'painScale'>>;

interface DemoMedication {
  category: MedicationCategory;
  name: string;
  dose: string;
  unit: string;
  timing: string;
  indication: string;
  status: MedicationStatus;
  /** 開始日（生成日からの日数、過去方向） */
  startDaysAgo: number;
  endDaysAgo?: number;
}

interface DemoHandover {
  priority: HandoverPriority;
  content: string;
  cautions: string;
  acknowledged: boolean;
  hoursAgo: number;
}

interface DemoProfile {
  name: string;
  dateOfBirth: string;
  gender: Gender;
  room: string;
  bloodType: BloodType;
  diagnoses: string[];
  allergies: string;
  medicalHistory: string;
  chiefComplaint: string;
  base: { temperature: number; systolic: number; diastolic: number; pulse: number; respiration: number; spo2: number };
  /** 最新測定の上書き値（デモ閾値外の表示確認用） */
  latestOverride?: VitalOverride;
  /** 最新測定が何時間前か */
  latestVitalHoursAgo: number;
  consciousness: string;
  notes: { type: RecordType; body: string; tags: string[] }[];
  soap: Pick<SoapRecord, 'problem' | 'subjective' | 'objective' | 'assessment' | 'plan'>[];
  medications: DemoMedication[];
  handovers: DemoHandover[];
}

const PROFILES: DemoProfile[] = [
  {
    name: '月見 里子', dateOfBirth: '1946-03-18', gender: 'female', room: '301', bloodType: 'A',
    diagnoses: ['心不全', '高血圧症'], allergies: 'ペニシリン系',
    medicalHistory: '心不全にて入院歴あり（架空）', chiefComplaint: '労作時の息切れ',
    base: { temperature: 36.6, systolic: 128, diastolic: 74, pulse: 84, respiration: 20, spo2: 95 },
    latestOverride: { spo2: 92, respiration: 22 }, latestVitalHoursAgo: 1, consciousness: '清明',
    notes: [
      { type: 'observation', body: '「トイレまで歩くと息が切れる」と訴えあり。歩行後に休憩をとり、呼吸が落ち着くことを確認。', tags: ['排泄', '転倒予防'] },
      { type: 'care', body: '朝食は5割摂取。水分摂取量を記録表に記入した。', tags: ['食事'] },
      { type: 'progress', body: '日中は臥床して過ごす時間が多い。家族の面会あり。', tags: ['家族対応'] },
    ],
    soap: [{
      problem: '#1 労作時の息切れ（デモ記録）',
      subjective: '「歩くと息が苦しい」',
      objective: 'トイレ歩行後に呼吸数増加。休憩後に落ち着く。',
      assessment: '労作に伴う息切れの訴えが続いている（デモ用の記載例）。',
      plan: '歩行時は付き添い、休憩をはさむ。訴えの変化を記録する。',
    }],
    medications: [
      { category: 'regular', name: 'フロセミド', dose: '20', unit: 'mg', timing: '朝', indication: '登録例（架空）', status: 'active', startDaysAgo: 6 },
      { category: 'regular', name: 'アムロジピン', dose: '5', unit: 'mg', timing: '朝', indication: '登録例（架空）', status: 'active', startDaysAgo: 30 },
    ],
    handovers: [
      { priority: 'high', content: '夜間に息切れの訴えが2回あり。日勤帯でも訴えの有無を確認してください。', cautions: '歩行時は付き添い', acknowledged: false, hoursAgo: 2 },
    ],
  },
  {
    name: '星川 陽向', dateOfBirth: '1958-07-02', gender: 'male', room: '302', bloodType: 'O',
    diagnoses: ['2型糖尿病', '脂質異常症'], allergies: 'なし',
    medicalHistory: '外来にて血糖管理中（架空）', chiefComplaint: '教育入院目的',
    base: { temperature: 36.4, systolic: 132, diastolic: 80, pulse: 72, respiration: 16, spo2: 98 },
    latestVitalHoursAgo: 1.5, consciousness: '清明',
    notes: [
      { type: 'care', body: '食事療法のパンフレットを用いて説明を実施。「間食を減らしたい」と話す。', tags: ['食事'] },
      { type: 'observation', body: '足部の観察を実施。皮膚の発赤なし。', tags: ['清潔'] },
    ],
    soap: [{
      problem: '#1 生活習慣の見直し（デモ記録）',
      subjective: '「甘いものがやめられない」',
      objective: '説明中は質問が多く、メモをとっている。',
      assessment: '学習意欲がみられる（デモ用の記載例）。',
      plan: '明日も食事内容の振り返りを一緒に行う予定。',
    }],
    medications: [
      { category: 'regular', name: 'メトホルミン', dose: '500', unit: 'mg', timing: '朝・夕', indication: '登録例（架空）', status: 'active', startDaysAgo: 90 },
      { category: 'regular', name: 'アトルバスタチン', dose: '10', unit: 'mg', timing: '夕', indication: '登録例（架空）', status: 'paused', startDaysAgo: 120 },
    ],
    handovers: [
      { priority: 'normal', content: '栄養指導は明日14時の予定（デモ）。', cautions: '', acknowledged: true, hoursAgo: 20 },
    ],
  },
  {
    name: '雲井 蒼', dateOfBirth: '1941-11-25', gender: 'male', room: '303', bloodType: 'B',
    diagnoses: ['COPD', '肺炎'], allergies: '造影剤',
    medicalHistory: 'COPDにて在宅酸素の既往（架空）', chiefComplaint: '咳嗽と痰',
    base: { temperature: 37.2, systolic: 118, diastolic: 68, pulse: 92, respiration: 22, spo2: 94 },
    latestOverride: { temperature: 38.2, pulse: 112 }, latestVitalHoursAgo: 0.5, consciousness: '清明',
    notes: [
      { type: 'observation', body: '湿性咳嗽あり。黄色痰を少量認める。「痰が切れにくい」と訴え。', tags: ['疼痛'] },
      { type: 'care', body: '体位変換と口腔ケアを実施した。', tags: ['清潔'] },
      { type: 'progress', body: '午後から発熱あり。担当医へ報告済み（架空の記録）。', tags: [] },
    ],
    soap: [{
      problem: '#1 痰の喀出（デモ記録）',
      subjective: '「痰が絡んで苦しい」',
      objective: '湿性咳嗽あり。黄色痰少量。BT 38.2℃（デモ値）。',
      assessment: '痰の喀出に困難さを感じている（デモ用の記載例）。',
      plan: '体位の工夫と水分摂取の声かけを継続する。',
    }],
    medications: [
      { category: 'regular', name: 'カルボシステイン', dose: '500', unit: 'mg', timing: '毎食後', indication: '登録例（架空）', status: 'active', startDaysAgo: 4 },
      { category: 'prn', name: 'アセトアミノフェン', dose: '400', unit: 'mg', timing: '', indication: '発熱時', status: 'active', startDaysAgo: 4 },
    ],
    handovers: [
      { priority: 'high', content: '午後から発熱あり、担当医へ報告済み。夜間の体温記録を継続してください。', cautions: '造影剤アレルギー登録あり', acknowledged: false, hoursAgo: 0.5 },
      { priority: 'low', content: '家族から着替えの差し入れ予定の連絡あり。', cautions: '', acknowledged: false, hoursAgo: 5 },
    ],
  },
  {
    name: '花房 こより', dateOfBirth: '1972-05-09', gender: 'female', room: '305', bloodType: 'AB',
    diagnoses: ['気管支喘息'], allergies: 'ラテックス、卵',
    medicalHistory: '小児期より喘息（架空）', chiefComplaint: '夜間の咳',
    base: { temperature: 36.5, systolic: 112, diastolic: 70, pulse: 76, respiration: 18, spo2: 97 },
    latestVitalHoursAgo: 2, consciousness: '清明',
    notes: [
      { type: 'progress', body: '夜間の咳は昨日より減ったと本人より。入眠は良好。', tags: ['睡眠'] },
      { type: 'care', body: '吸入手技を確認し、手順どおり実施できていた。', tags: ['内服'] },
    ],
    soap: [],
    medications: [
      { category: 'regular', name: '吸入ステロイド（登録例）', dose: '1', unit: '吸入', timing: '朝・夕', indication: '登録例（架空）', status: 'active', startDaysAgo: 200 },
    ],
    handovers: [],
  },
  {
    name: '朝凪 湊', dateOfBirth: '1939-01-30', gender: 'male', room: '306', bloodType: 'A',
    diagnoses: ['大腿骨頸部骨折', '認知症'], allergies: '特記事項なし',
    medicalHistory: '術後リハビリ中（架空）', chiefComplaint: '右股関節の痛み',
    base: { temperature: 36.8, systolic: 138, diastolic: 76, pulse: 80, respiration: 17, spo2: 96 },
    latestOverride: { painScale: 6 }, latestVitalHoursAgo: 3, consciousness: '清明',
    notes: [
      { type: 'care', body: '理学療法士と平行棒内歩行を実施。「右足が痛い」と訴えあり。', tags: ['リハビリ', '疼痛'] },
      { type: 'observation', body: '夜間に起き上がろうとする様子あり。ナースコールの位置を再度説明した。', tags: ['転倒予防', '睡眠'] },
      { type: 'progress', body: '昼食は全量摂取。排便あり。', tags: ['食事', '排泄'] },
    ],
    soap: [{
      problem: '#1 転倒リスク（デモ記録）',
      subjective: '「トイレに自分で行きたい」',
      objective: '夜間に起き上がる動作あり。歩行はふらつきがみられる。',
      assessment: '自力での移動を希望している（デモ用の記載例）。',
      plan: '訪室の間隔を短くし、排泄の声かけを定時で行う。',
    }],
    medications: [
      { category: 'prn', name: 'ロキソプロフェン', dose: '60', unit: 'mg', timing: '', indication: '疼痛時', status: 'active', startDaysAgo: 10 },
      { category: 'regular', name: 'セファゾリン（登録例）', dose: '1', unit: 'g', timing: '1日2回', indication: '登録例（架空）', status: 'completed', startDaysAgo: 12, endDaysAgo: 8 },
    ],
    handovers: [
      { priority: 'normal', content: '離床時は2名で介助しています。', cautions: '夜間の起き上がりに注意', acknowledged: false, hoursAgo: 8 },
    ],
  },
  {
    name: '野分 しずく', dateOfBirth: '1963-12-01', gender: 'female', room: '307', bloodType: 'O',
    diagnoses: ['慢性腎臓病', '高血圧症'], allergies: '',
    medicalHistory: '外来で腎機能フォロー中（架空）', chiefComplaint: '下肢のむくみ',
    base: { temperature: 36.3, systolic: 150, diastolic: 88, pulse: 70, respiration: 16, spo2: 97 },
    latestOverride: { systolic: 166 }, latestVitalHoursAgo: 4, consciousness: '清明',
    notes: [
      { type: 'observation', body: '両下肢に浮腫あり。体重は前日比 +0.4kg（デモ値）。', tags: [] },
      { type: 'care', body: '塩分を控えた食事について説明。「味が薄い」と話す。', tags: ['食事'] },
    ],
    soap: [],
    medications: [
      { category: 'regular', name: 'オルメサルタン', dose: '20', unit: 'mg', timing: '朝', indication: '登録例（架空）', status: 'active', startDaysAgo: 60 },
    ],
    handovers: [],
  },
  {
    name: '灯野 迅', dateOfBirth: '1977-04-21', gender: 'male', room: '308', bloodType: 'B',
    diagnoses: ['尿路感染症'], allergies: 'セフェム系',
    medicalHistory: '特記事項なし（架空）', chiefComplaint: '排尿時の痛み',
    base: { temperature: 37.4, systolic: 124, diastolic: 78, pulse: 88, respiration: 18, spo2: 98 },
    latestVitalHoursAgo: 5, consciousness: '清明',
    notes: [
      { type: 'observation', body: '「排尿時にしみる」と訴えあり。尿の色調は淡黄色。', tags: ['排泄'] },
    ],
    soap: [],
    medications: [
      { category: 'regular', name: 'レボフロキサシン', dose: '500', unit: 'mg', timing: '1日1回', indication: '登録例（架空）', status: 'active', startDaysAgo: 2 },
    ],
    handovers: [
      { priority: 'normal', content: '水分摂取量の記録表を開始しました。', cautions: 'セフェム系アレルギー登録あり', acknowledged: true, hoursAgo: 26 },
    ],
  },
  {
    name: '葉月 ゆらら', dateOfBirth: '1990-08-08', gender: 'female', room: '310', bloodType: 'unknown',
    diagnoses: ['急性胃腸炎'], allergies: '',
    medicalHistory: '特記事項なし（架空）', chiefComplaint: '嘔気',
    base: { temperature: 37.0, systolic: 108, diastolic: 64, pulse: 90, respiration: 18, spo2: 98 },
    latestVitalHoursAgo: 30, consciousness: '清明',
    notes: [
      { type: 'progress', body: '嘔気は軽減したと本人より。少量ずつ水分摂取できている。', tags: ['食事'] },
    ],
    soap: [],
    medications: [
      { category: 'prn', name: 'メトクロプラミド', dose: '5', unit: 'mg', timing: '', indication: '嘔気時', status: 'active', startDaysAgo: 2 },
    ],
    handovers: [],
  },
  {
    name: '柚木 真砂', dateOfBirth: '1951-02-14', gender: 'other', room: '311', bloodType: 'A',
    diagnoses: ['脳梗塞', '心房細動'], allergies: 'なし',
    medicalHistory: '左片麻痺あり（架空）', chiefComplaint: 'リハビリ目的',
    base: { temperature: 36.5, systolic: 134, diastolic: 82, pulse: 78, respiration: 16, spo2: 97 },
    latestVitalHoursAgo: 6, consciousness: '清明',
    notes: [
      { type: 'care', body: '作業療法で更衣動作の練習を実施。上衣は見守りで着脱できた。', tags: ['リハビリ', '清潔'] },
      { type: 'progress', body: '「早く家に帰りたい」と話す。退院後の生活について家族と相談予定。', tags: ['家族対応'] },
    ],
    soap: [{
      problem: '#1 退院に向けたADL（デモ記録）',
      subjective: '「自分で着替えられるようになりたい」',
      objective: '上衣の着脱は見守りで可能。下衣は一部介助。',
      assessment: '更衣動作の自立に向けて意欲がある（デモ用の記載例）。',
      plan: '毎朝の更衣を本人主体で行い、介助量を記録する。',
    }],
    medications: [
      { category: 'regular', name: 'アピキサバン', dose: '5', unit: 'mg', timing: '朝・夕', indication: '登録例（架空）', status: 'active', startDaysAgo: 40 },
    ],
    handovers: [
      { priority: 'low', content: '家族との退院相談は金曜日の予定（デモ）。', cautions: '', acknowledged: false, hoursAgo: 12 },
    ],
  },
  {
    name: '鈴懸 岳', dateOfBirth: '1968-10-10', gender: 'undisclosed', room: '312', bloodType: 'O',
    diagnoses: ['虚血性心疾患'], allergies: 'ヨード',
    medicalHistory: '心臓カテーテル検査の既往（架空）', chiefComplaint: '胸部の違和感',
    base: { temperature: 36.4, systolic: 122, diastolic: 76, pulse: 66, respiration: 16, spo2: 98 },
    latestVitalHoursAgo: 7, consciousness: '清明',
    notes: [
      { type: 'observation', body: '胸部の違和感の訴えなし。病棟内を歩行して過ごす。', tags: ['リハビリ'] },
    ],
    soap: [],
    medications: [
      { category: 'regular', name: 'アスピリン', dose: '100', unit: 'mg', timing: '朝', indication: '登録例（架空）', status: 'active', startDaysAgo: 365 },
      { category: 'prn', name: 'ニトログリセリン（登録例）', dose: '0.3', unit: 'mg', timing: '', indication: 'その他（登録例）', status: 'active', startDaysAgo: 365 },
    ],
    handovers: [],
  },
];

const AUTHORS = ['デモ 看護師A', 'デモ 看護師B', 'デモ 看護師C'];

/** 決定的な小さな揺らぎ（-range〜+range） */
function wobble(seed: number, range: number): number {
  return ((seed * 37) % (range * 2 + 1)) - range;
}

/** prefix ごとに重複しない、関連記録入りの架空データを生成する。 */
export function createDemoData(count = PROFILES.length, prefix = DEMO_PREFIX, now: Date = new Date()): DemoData {
  const nowMs = now.getTime();
  const hoursAgo = (hours: number) => new Date(nowMs - hours * 60 * 60 * 1000).toISOString();
  const daysAgoDate = (days: number) => todayDateValue(new Date(nowMs - days * 24 * 60 * 60 * 1000));

  const data: DemoData = { patients: [], vitalSigns: [], nursingNotes: [], soapRecords: [], medications: [], handovers: [] };

  PROFILES.slice(0, Math.max(0, Math.min(count, PROFILES.length))).forEach((profile, index) => {
    const id = generateId();
    const createdAt = hoursAgo(24 * (index + 3));
    const activity: string[] = [];

    // バイタル: 8時間おきに6回分
    const vitalPoints = 6;
    for (let point = 0; point < vitalPoints; point += 1) {
      const isLatest = point === vitalPoints - 1;
      const measuredAt = hoursAgo(profile.latestVitalHoursAgo + (vitalPoints - 1 - point) * 8);
      const seed = index * 7 + point;
      const override = isLatest ? (profile.latestOverride ?? {}) : {};
      data.vitalSigns.push({
        id: generateId(),
        patientId: id,
        measuredAt,
        temperature: override.temperature ?? Number((profile.base.temperature + wobble(seed, 2) / 10).toFixed(1)),
        systolic: override.systolic ?? profile.base.systolic + wobble(seed, 6),
        diastolic: override.diastolic ?? profile.base.diastolic + wobble(seed + 1, 4),
        pulse: override.pulse ?? profile.base.pulse + wobble(seed + 2, 5),
        respiration: override.respiration ?? profile.base.respiration + wobble(seed, 1),
        spo2: override.spo2 ?? Math.min(100, profile.base.spo2 + wobble(seed + 3, 1)),
        consciousness: profile.consciousness,
        painScale: override.painScale ?? (point % 3 === 0 ? 1 : 0),
        memo: isLatest ? 'デモ用定時測定（最新）' : 'デモ用定時測定',
        createdAt: measuredAt,
        updatedAt: measuredAt,
      });
      activity.push(measuredAt);
    }

    profile.notes.forEach((note, noteIndex) => {
      const recordedAt = hoursAgo(profile.latestVitalHoursAgo + 0.5 + noteIndex * 3);
      data.nursingNotes.push({
        id: generateId(), patientId: id, recordedAt, author: AUTHORS[noteIndex % AUTHORS.length],
        recordType: note.type, body: `${note.body}（架空データ）`, tags: note.tags,
        createdAt: recordedAt, updatedAt: recordedAt,
      });
      activity.push(recordedAt);
    });

    profile.soap.forEach((soap, soapIndex) => {
      const recordedAt = hoursAgo(profile.latestVitalHoursAgo + 1 + soapIndex * 12);
      data.soapRecords.push({
        id: generateId(), patientId: id, recordedAt, author: AUTHORS[(index + soapIndex) % AUTHORS.length],
        ...soap, createdAt: recordedAt, updatedAt: recordedAt,
      });
      activity.push(recordedAt);
    });

    profile.medications.forEach((medication, medicationIndex) => {
      const medCreatedAt = hoursAgo(24 * Math.min(medication.startDaysAgo, index + 3) - medicationIndex);
      const edited = medication.status !== 'active';
      const medUpdatedAt = edited ? hoursAgo(24 + medicationIndex) : medCreatedAt;
      const record: Medication = {
        id: generateId(), patientId: id, category: medication.category, name: medication.name,
        dose: medication.dose, unit: medication.unit, timing: medication.timing, indication: medication.indication,
        lastAdministeredAt: medication.category === 'prn' ? hoursAgo(10 + index) : '',
        startDate: daysAgoDate(medication.startDaysAgo),
        endDate: medication.endDaysAgo === undefined ? '' : daysAgoDate(medication.endDaysAgo),
        status: medication.status, memo: 'デモ用の登録内容です（処方・投薬判断ではありません）',
        createdAt: medCreatedAt, updatedAt: medUpdatedAt,
      };
      data.medications.push(record);
      activity.push(medUpdatedAt);
    });

    profile.handovers.forEach((handover, handoverIndex) => {
      const recordedAt = hoursAgo(handover.hoursAgo);
      const acknowledgedAt = handover.acknowledged ? hoursAgo(Math.max(0.1, handover.hoursAgo - 1)) : '';
      const record: HandoverRecord = {
        id: generateId(), patientId: id, recordedAt, author: AUTHORS[(index + handoverIndex + 1) % AUTHORS.length],
        priority: handover.priority, content: `${handover.content}（架空データ）`, cautions: handover.cautions,
        status: handover.acknowledged ? 'acknowledged' : 'open', acknowledgedAt,
        createdAt: recordedAt, updatedAt: acknowledgedAt || recordedAt,
      };
      data.handovers.push(record);
      activity.push(record.updatedAt);
    });

    const updatedAt = activity.reduce(
      (latest, at) => (new Date(at).getTime() > new Date(latest).getTime() ? at : latest),
      createdAt,
    );

    const patient: Patient = {
      id,
      patientId: `${prefix}-${String(index + 1).padStart(4, '0')}`,
      name: profile.name,
      avatarUrl: '',
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      room: profile.room,
      bloodType: profile.bloodType,
      allergies: profile.allergies,
      medicalHistory: profile.medicalHistory,
      chiefComplaint: profile.chiefComplaint,
      diagnoses: profile.diagnoses,
      notes: 'ポートフォリオ表示専用の架空患者です。実在の人物・医療機関とは関係ありません。',
      createdAt,
      updatedAt,
      profileUpdatedAt: index % 3 === 0 ? hoursAgo(24 * (index + 1)) : '',
    };
    data.patients.push(patient);
  });

  return data;
}

/** 初回サンプルは Demo Data と同名にならないよう、氏名・病室を差し替える */
const SAMPLE_OVERRIDES = [
  { name: '白鷺 ことは', room: '401' },
  { name: '青葉 周', room: '402' },
];

/** 初回起動時の軽量サンプル（2名）。 */
export function createSampleData(now: Date = new Date()): DemoData {
  const sample = createDemoData(SAMPLE_OVERRIDES.length, 'PT', now);
  return {
    ...sample,
    patients: sample.patients.map((patient, index) => ({ ...patient, ...SAMPLE_OVERRIDES[index] })),
  };
}

export function isDemoPatientId(patientId: string): boolean {
  return patientId.toUpperCase().startsWith(`${DEMO_PREFIX}-`);
}

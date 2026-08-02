/** 架空患者と関連記録をまとめて生成するデモデータファクトリー。 */
import type { AppData, Medication, NursingNote, Patient, VitalSign } from '../types';
import { generateId } from '../utils/id';

type DemoData = Pick<AppData, 'patients' | 'vitalSigns' | 'nursingNotes' | 'medications'>;

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

const PEOPLE = [
  ['山田 太郎', '1952-04-12', 'male', '高血圧症', '心不全'],
  ['佐藤 花子', '1968-11-03', 'female', '2型糖尿病', '脂質異常症'],
  ['鈴木 一郎', '1946-02-20', 'male', '慢性閉塞性肺疾患', '高血圧症'],
  ['高橋 美咲', '1975-07-18', 'female', '気管支喘息', 'アレルギー性鼻炎'],
  ['田中 健', '1981-09-05', 'male', '腰痛症', '高尿酸血症'],
  ['伊藤 京子', '1959-12-22', 'female', '変形性膝関節症', '骨粗鬆症'],
  ['渡辺 誠', '1963-05-30', 'male', '狭心症', '高血圧症'],
  ['山本 恵', '1988-01-14', 'female', '片頭痛', '鉄欠乏性貧血'],
  ['中村 修', '1949-08-08', 'male', '脳梗塞後遺症', '脂質異常症'],
  ['小林 直子', '1972-03-27', 'female', '甲状腺機能低下症', '高血圧症'],
] as const;

const NOTE_BODIES = ['バイタル測定を実施。表情穏やか。', '朝食8割摂取。水分摂取を確認。', '病棟内で歩行訓練を実施。', '定時内服を確認し実施。'] as const;

/** prefix ごとに重複しない、関連記録入りの架空データを生成する。 */
export function createDemoData(count = 10, prefix = 'DEMO'): DemoData {
  const patients: Patient[] = [];
  const vitalSigns: VitalSign[] = [];
  const nursingNotes: NursingNote[] = [];
  const medications: Medication[] = [];

  for (let index = 0; index < Math.min(count, PEOPLE.length); index += 1) {
    const [name, dateOfBirth, gender, primaryDiagnosis, secondaryDiagnosis] = PEOPLE[index];
    const patientId = generateId();
    const updatedOffset = index + 1;
    const patient: Patient = {
      id: patientId,
      patientId: `${prefix}-${String(index + 1).padStart(4, '0')}`,
      name,
      // アバターは氏名のイニシャルから描画するため、画像は保持しない
      avatarUrl: '',
      dateOfBirth,
      gender,
      room: `${3 + Math.floor(index / 4)}${String((index % 4) + 1).padStart(2, '0')}`,
      bloodType: (['A', 'O', 'B', 'AB'] as const)[index % 4],
      allergies: index % 4 === 1 ? 'Penicillin' : index % 4 === 2 ? 'Latex' : '',
      medicalHistory: `${primaryDiagnosis}にて通院歴あり（架空データ）`,
      chiefComplaint: index % 2 === 0 ? '労作時の倦怠感' : '経過観察目的',
      diagnoses: [primaryDiagnosis, secondaryDiagnosis],
      notes: 'ポートフォリオ表示専用の架空患者です。',
      createdAt: hoursAgo(24 * (index + 2)),
      updatedAt: hoursAgo(updatedOffset),
    };
    patients.push(patient);

    for (let point = 0; point < 5; point += 1) {
      const at = hoursAgo(updatedOffset + (4 - point) * 8);
      vitalSigns.push({
        id: generateId(), patientId, measuredAt: at,
        temperature: Number((36.3 + ((index + point) % 6) * 0.1).toFixed(1)),
        systolic: 116 + index + point * 2, diastolic: 68 + (index % 5) + point,
        pulse: 66 + index + point * 2, respiration: 15 + (point % 3),
        spo2: 95 + ((index + point) % 4), consciousness: '清明', painScale: point % 2,
        memo: 'デモ用定時測定', createdAt: at,
      });
    }

    NOTE_BODIES.forEach((body, noteIndex) => {
      const at = hoursAgo(updatedOffset + (3 - noteIndex) * 1.5);
      nursingNotes.push({
        id: generateId(), patientId, recordedAt: at,
        author: `デモ 看護師${noteIndex % 2 === 0 ? 'A' : 'B'}`,
        recordType: (['observation', 'progress', 'care', 'care'] as const)[noteIndex],
        body: `${body}（架空データ）`, createdAt: at,
      });
    });

    const medicationBase: Omit<Medication, 'id' | 'name' | 'dose' | 'unit' | 'category' | 'timing' | 'indication'> = {
      patientId, lastAdministeredAt: '', startDate: '2026-07-01', endDate: '',
      memo: 'デモ用薬剤情報', createdAt: hoursAgo(24), updatedAt: hoursAgo(updatedOffset),
    };
    medications.push(
      { ...medicationBase, id: generateId(), category: 'regular', name: 'アムロジピン', dose: '5', unit: 'mg', timing: '朝', indication: '血圧管理' },
      { ...medicationBase, id: generateId(), category: 'prn', name: 'ロキソニン', dose: '60', unit: 'mg', timing: '', indication: '疼痛時', lastAdministeredAt: hoursAgo(18) },
    );
  }

  return { patients, vitalSigns, nursingNotes, medications };
}

/** 初回起動時の軽量サンプル（2名）。 */
export function createSampleData(): DemoData {
  return createDemoData(2, 'PT');
}

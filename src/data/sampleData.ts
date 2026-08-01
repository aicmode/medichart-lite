/**
 * 初回起動時にのみ投入する架空のサンプルデータ。
 *
 * 実在の人物・医療機関とは一切関係のない、デモ表示専用の完全な架空情報。
 */

import type { AppData, NursingNote, Patient, VitalSign } from '../types';
import { generateId } from '../utils/id';

/** 現在時刻から指定時間だけ前のISO文字列を作る */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

/** 架空患者2名分のサンプルデータを生成する */
export function createSampleData(): Pick<AppData, 'patients' | 'vitalSigns' | 'nursingNotes'> {
  const now = new Date().toISOString();

  const taro: Patient = {
    id: generateId(),
    patientId: 'PT-0001',
    name: '山田 太郎',
    dateOfBirth: '1952-04-12',
    gender: 'male',
    room: '301',
    bloodType: 'A',
    allergies: '特記事項なし（架空データ）',
    medicalHistory: '高血圧症にて外来通院中（架空データ）',
    chiefComplaint: '労作時の息切れ',
    diagnoses: ['高血圧症', '心不全'],
    notes: 'デモ表示用の架空患者です。実在の人物ではありません。',
    createdAt: hoursAgo(72),
    updatedAt: hoursAgo(3),
  };

  const hanako: Patient = {
    id: generateId(),
    patientId: 'PT-0002',
    name: '佐藤 花子',
    dateOfBirth: '1968-11-03',
    gender: 'female',
    room: '305',
    bloodType: 'O',
    allergies: '花粉（架空データ）',
    medicalHistory: '2型糖尿病にて内服加療中（架空データ）',
    chiefComplaint: '倦怠感',
    diagnoses: ['2型糖尿病', '脂質異常症'],
    notes: 'デモ表示用の架空患者です。実在の人物ではありません。',
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(1),
  };

  const vitalSigns: VitalSign[] = [
    {
      id: generateId(),
      patientId: taro.id,
      measuredAt: hoursAgo(27),
      temperature: 36.4,
      systolic: 132,
      diastolic: 78,
      pulse: 74,
      respiration: 16,
      spo2: 97,
      consciousness: '清明',
      painScale: 0,
      memo: '朝の定時測定（架空データ）',
      createdAt: hoursAgo(27),
    },
    {
      id: generateId(),
      patientId: taro.id,
      measuredAt: hoursAgo(3),
      temperature: 36.8,
      systolic: 128,
      diastolic: 76,
      pulse: 80,
      respiration: 18,
      spo2: 96,
      consciousness: '清明',
      painScale: 1,
      memo: '離床後に測定（架空データ）',
      createdAt: hoursAgo(3),
    },
    {
      id: generateId(),
      patientId: hanako.id,
      measuredAt: hoursAgo(1),
      temperature: 36.6,
      systolic: 118,
      diastolic: 70,
      pulse: 68,
      respiration: 15,
      spo2: 98,
      consciousness: '清明',
      painScale: 0,
      memo: '定時測定（架空データ）',
      createdAt: hoursAgo(1),
    },
  ];

  const nursingNotes: NursingNote[] = [
    {
      id: generateId(),
      patientId: taro.id,
      recordedAt: hoursAgo(26),
      author: 'デモ 看護師A',
      recordType: 'observation',
      body: '本日朝の観察。歩行時に息切れの訴えあり。食事は全量摂取された。（架空の記録例）',
      createdAt: hoursAgo(26),
    },
    {
      id: generateId(),
      patientId: taro.id,
      recordedAt: hoursAgo(3),
      author: 'デモ 看護師B',
      recordType: 'care',
      body: '清拭を実施。皮膚トラブルの訴えなし。実施中の表情は穏やかであった。（架空の記録例）',
      createdAt: hoursAgo(3),
    },
    {
      id: generateId(),
      patientId: hanako.id,
      recordedAt: hoursAgo(1),
      author: 'デモ 看護師A',
      recordType: 'progress',
      body: '日中の経過記録。倦怠感の訴えは軽減しているとの発言あり。水分摂取は約1200mL。（架空の記録例）',
      createdAt: hoursAgo(1),
    },
  ];

  return {
    patients: [
      { ...taro, updatedAt: taro.updatedAt || now },
      { ...hanako, updatedAt: hanako.updatedAt || now },
    ],
    vitalSigns,
    nursingNotes,
  };
}

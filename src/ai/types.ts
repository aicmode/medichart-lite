/**
 * 記録支援（AI Provider）の共通インターフェース。
 *
 * 責務:
 * - 記録者が書いた文章や保存済みデータを「整理・下書き化」するだけ。
 * - 診断、治療提案、投薬判断、医学的な緊急度判定は行わない（どの Provider でも同じ）。
 * - 出力は必ず下書きとして表示し、記録者が確認・編集してから保存する。
 *
 * 既定はネットワークを使わないローカル規則ベース実装。将来、外部 LLM を接続する場合も
 * このインターフェースを実装し、秘密情報はサーバー側に置く（クライアントへ API キーを渡さない）。
 */

import type {
  HandoverRecord,
  Medication,
  NursingNote,
  Patient,
  SoapRecord,
  VitalSign,
} from '../types';

export interface AssistContext {
  patient: Patient;
  vitalSigns: VitalSign[];
  nursingNotes: NursingNote[];
  soapRecords: SoapRecord[];
  medications: Medication[];
  handovers: HandoverRecord[];
}

export interface SoapDraft {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  /** どの項目にも分類できなかった文 */
  unclassified: string;
}

export interface HandoverDraft {
  content: string;
  cautions: string;
}

export interface AssistResult<T> {
  value: T;
  /** 利用者へ必ず表示する注意事項 */
  notices: string[];
  providerLabel: string;
}

export interface RecordAssistProvider {
  readonly id: string;
  readonly label: string;
  /** 外部へデータを送信するか */
  readonly sendsDataExternally: boolean;
  summarizeNote(text: string): Promise<AssistResult<string>>;
  draftSoap(text: string): Promise<AssistResult<SoapDraft>>;
  draftHandover(context: AssistContext): Promise<AssistResult<HandoverDraft>>;
  summarizePatient(context: AssistContext): Promise<AssistResult<string>>;
}

export const ASSIST_BASE_NOTICE =
  '下書きです。診断・治療提案・投薬判断・緊急度判定は行いません。内容は必ず記録者が確認・編集してください。';

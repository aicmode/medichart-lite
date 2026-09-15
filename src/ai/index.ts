import type { RecordAssistProvider } from './types';
import { localRuleProvider } from './localRuleProvider';

export type { AssistContext, AssistResult, HandoverDraft, RecordAssistProvider, SoapDraft } from './types';
export { ASSIST_BASE_NOTICE } from './types';

/**
 * 利用する記録支援 Provider を返す。
 * 現在は追加費用0円・外部送信なしのローカル実装のみ。外部 Provider を追加する場合はここで切り替える。
 */
export function getAssistProvider(): RecordAssistProvider {
  return localRuleProvider;
}

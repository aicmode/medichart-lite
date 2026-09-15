import { useCallback, useState } from 'react';
import type { AssistResult } from '../ai';

export type AssistStatus<T> =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'done'; result: AssistResult<T> }
  | { kind: 'error'; message: string };

/** 非同期の記録支援処理を実行し、状態（実行中・完了・エラー）を管理する */
export function useAssistRunner<T>() {
  const [status, setStatus] = useState<AssistStatus<T>>({ kind: 'idle' });

  const run = useCallback(async (task: () => Promise<AssistResult<T>>) => {
    setStatus({ kind: 'running' });
    try {
      setStatus({ kind: 'done', result: await task() });
    } catch {
      setStatus({ kind: 'error', message: '下書きを作成できませんでした。もう一度お試しください。' });
    }
  }, []);

  const reset = useCallback(() => setStatus({ kind: 'idle' }), []);

  return { status, run, reset };
}

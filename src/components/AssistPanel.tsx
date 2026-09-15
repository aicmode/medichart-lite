import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import type { AssistResult } from '../ai';
import { getAssistProvider } from '../ai';
import { BilingualText } from './BilingualText';
import { useAssistRunner } from '../hooks/useAssistRunner';

/** 記録支援の出力に必ず添える注意表示 */
export function AssistNotices({ result }: { result: AssistResult<unknown> }) {
  return (
    <div className="assist-notice" role="note">
      <p className="assist-notice__provider">
        Draft / 下書き — {result.providerLabel}
      </p>
      <ul>
        {result.notices.map((notice) => (
          <li key={notice}>{notice}</li>
        ))}
      </ul>
    </div>
  );
}

interface AssistShellProps {
  english: string;
  japanese: string;
  description: string;
  children: ReactNode;
}

/** 記録支援パネルの共通枠（折りたたみ） */
export function AssistShell({ english, japanese, description, children }: AssistShellProps) {
  const provider = getAssistProvider();
  return (
    <details className="assist-panel no-print">
      <summary className="assist-panel__summary">
        <span className="assist-panel__icon" aria-hidden="true">✎</span>
        <BilingualText english={english} japanese={japanese} mode="inline" />
        <span className="assist-panel__badge">{provider.sendsDataExternally ? '外部送信あり' : '外部送信なし'}</span>
      </summary>
      <div className="assist-panel__body">
        <p className="assist-panel__description">{description}</p>
        {children}
      </div>
    </details>
  );
}

interface TextAssistProps {
  english: string;
  japanese: string;
  description: string;
  inputLabel: string;
  placeholder: string;
  runLabel: string;
  applyLabel: string;
  task: (text: string) => Promise<AssistResult<string>>;
  onApply: (output: string) => void;
}

/** 文章を入力して要点整理などの下書きを得る支援パネル */
export function TextAssist({
  english,
  japanese,
  description,
  inputLabel,
  placeholder,
  runLabel,
  applyLabel,
  task,
  onApply,
}: TextAssistProps) {
  const [input, setInput] = useState('');
  const { status, run } = useAssistRunner<string>();
  const inputId = useId();

  return (
    <AssistShell english={english} japanese={japanese} description={description}>
      <div className="field">
        <label className="field__label" htmlFor={inputId}>
          {inputLabel}
        </label>
        <textarea
          id={inputId}
          className="input textarea"
          rows={4}
          value={input}
          placeholder={placeholder}
          onChange={(event) => setInput(event.target.value)}
        />
      </div>
      <div className="form-actions form-actions--start">
        <button
          type="button"
          className="button button--secondary"
          disabled={input.trim() === '' || status.kind === 'running'}
          onClick={() => void run(() => task(input))}
        >
          {status.kind === 'running' ? '作成中…' : runLabel}
        </button>
      </div>
      <div aria-live="polite">
        {status.kind === 'error' ? <p className="field__error">{status.message}</p> : null}
        {status.kind === 'done' ? (
          <div className="assist-panel__output">
            <AssistNotices result={status.result} />
            {status.result.value === '' ? (
              <p className="muted-text">出力できる内容がありませんでした。</p>
            ) : (
              <>
                <p className="field__label">下書き（反映後にフォームで編集できます）</p>
                <pre className="assist-panel__text">
                  {status.result.value}
                </pre>
                <div className="form-actions form-actions--start">
                  <button type="button" className="button button--primary button--small" onClick={() => onApply(status.result.value)}>
                    {applyLabel}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </AssistShell>
  );
}

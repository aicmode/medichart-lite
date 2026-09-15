import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { SoapRecord } from '../types';
import type { SoapInput } from '../hooks/useAppData';
import type { SoapDraft } from '../ai';
import { getAssistProvider } from '../ai';
import { formatDateTime, toDateTimeLocalValue } from '../utils/date';
import { MAX_LENGTH, validateRecordDateTime } from '../utils/validation';
import { BilingualText } from './BilingualText';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import { AssistNotices, AssistShell } from './AssistPanel';
import { useAssistRunner } from '../hooks/useAssistRunner';
import { useRevealWhen } from '../hooks/useRevealWhen';

const SOAP_FIELDS = [
  { key: 'subjective', letter: 'S', english: 'Subjective', japanese: '主観的情報（本人の訴え）', placeholder: '例：「夜あまり眠れなかった」' },
  { key: 'objective', letter: 'O', english: 'Objective', japanese: '客観的情報（観察・測定）', placeholder: '例：日中の臥床時間が長い。BT 36.8℃。' },
  { key: 'assessment', letter: 'A', english: 'Assessment', japanese: 'アセスメント（記録者の記載）', placeholder: '記録者が記入します（デモ記録）。' },
  { key: 'plan', letter: 'P', english: 'Plan', japanese: '計画（記録者の記載）', placeholder: '記録者が記入します（デモ記録）。' },
] as const;

type SoapKey = (typeof SOAP_FIELDS)[number]['key'];

interface SoapFormProps {
  initialRecord?: SoapRecord;
  draft?: SoapDraft;
  onSubmit: (input: SoapInput) => void;
  onCancel: () => void;
}

type SoapErrors = Partial<Record<'recordedAt' | 'form', string>>;

function SoapForm({ initialRecord, draft, onSubmit, onCancel }: SoapFormProps) {
  const [recordedAt, setRecordedAt] = useState(() =>
    toDateTimeLocalValue(initialRecord ? new Date(initialRecord.recordedAt) : new Date()),
  );
  const [author, setAuthor] = useState(initialRecord?.author ?? '');
  const [problem, setProblem] = useState(initialRecord?.problem ?? '');
  const [values, setValues] = useState<Record<SoapKey, string>>({
    subjective: initialRecord?.subjective ?? draft?.subjective ?? '',
    objective: initialRecord?.objective ?? draft?.objective ?? '',
    assessment: initialRecord?.assessment ?? draft?.assessment ?? '',
    plan: initialRecord?.plan ?? draft?.plan ?? '',
  });
  const [errors, setErrors] = useState<SoapErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitGuard = useRef(false);
  const resetTimer = useRef<number | null>(null);
  const formId = useId();
  const fieldId = (key: string) => `${formId}-${key}`;

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitGuard.current) return;

    const nextErrors: SoapErrors = {};
    const dateResult = validateRecordDateTime(recordedAt, '記録日時');
    if (dateResult.error) nextErrors.recordedAt = dateResult.error;
    if (SOAP_FIELDS.every((field) => values[field.key].trim() === '')) {
      nextErrors.form = 'S・O・A・P のうち少なくとも1項目を入力してください。';
    }
    setErrors(nextErrors);
    if (nextErrors.recordedAt) {
      document.getElementById(fieldId('recordedAt'))?.focus();
      return;
    }
    if (nextErrors.form) {
      document.getElementById(fieldId('subjective'))?.focus();
      return;
    }

    submitGuard.current = true;
    setIsSubmitting(true);
    onSubmit({
      recordedAt: dateResult.iso ?? new Date().toISOString(),
      author: author.trim(),
      problem: problem.trim(),
      subjective: values.subjective.trim(),
      objective: values.objective.trim(),
      assessment: values.assessment.trim(),
      plan: values.plan.trim(),
    });
    resetTimer.current = window.setTimeout(() => {
      submitGuard.current = false;
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <form className="panel-form" onSubmit={handleSubmit} noValidate aria-label={initialRecord ? 'SOAP記録の編集' : 'SOAP記録の新規作成'}>
      <h3 className="panel-form__title">
        <BilingualText english={initialRecord ? 'Edit SOAP' : 'New SOAP'} japanese={initialRecord ? 'SOAPを編集' : 'SOAPを記録'} mode="inline" />
      </h3>
      {draft && !initialRecord ? (
        <p className="assist-applied">記録支援の下書きを反映しました。内容を確認・編集してから保存してください。</p>
      ) : null}
      {errors.form ? <p className="field__error" role="alert">{errors.form}</p> : null}

      <div className="form-grid form-grid--compact">
        <div className="field">
          <label className="field__label" htmlFor={fieldId('recordedAt')}>
            <BilingualText english="Recorded At" japanese="記録日時" mode="inline" />
            <span className="field__required">必須</span>
          </label>
          <input
            id={fieldId('recordedAt')}
            type="datetime-local"
            className={`input${errors.recordedAt ? ' input--error' : ''}`}
            value={recordedAt}
            aria-invalid={errors.recordedAt !== undefined}
            aria-describedby={errors.recordedAt ? fieldId('recordedAt-error') : undefined}
            onChange={(event) => setRecordedAt(event.target.value)}
          />
          {errors.recordedAt ? (
            <p className="field__error" id={fieldId('recordedAt-error')} role="alert">{errors.recordedAt}</p>
          ) : null}
        </div>
        <div className="field">
          <label className="field__label" htmlFor={fieldId('author')}>
            <BilingualText english="Recorder" japanese="記録者（架空）" mode="inline" />
          </label>
          <input id={fieldId('author')} className="input" value={author} maxLength={MAX_LENGTH.shortText} placeholder="例：デモ 看護師A" onChange={(event) => setAuthor(event.target.value)} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={fieldId('problem')}>
            <BilingualText english="Problem" japanese="テーマ・問題" mode="inline" />
          </label>
          <input id={fieldId('problem')} className="input" value={problem} maxLength={MAX_LENGTH.shortText} placeholder="例：#1 睡眠" onChange={(event) => setProblem(event.target.value)} />
        </div>
      </div>

      <div className="soap-form-grid">
        {SOAP_FIELDS.map((field) => (
          <div className="field soap-field" key={field.key}>
            <label className="field__label" htmlFor={fieldId(field.key)}>
              <span className={`soap-letter soap-letter--${field.key}`} aria-hidden="true">{field.letter}</span>
              <BilingualText english={field.english} japanese={field.japanese} mode="inline" />
            </label>
            <textarea
              id={fieldId(field.key)}
              className="input textarea"
              rows={4}
              maxLength={MAX_LENGTH.longText}
              value={values[field.key]}
              placeholder={field.placeholder}
              onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
            />
          </div>
        ))}
      </div>
      <p className="field__hint">A（アセスメント）・P（計画）は架空患者に対するデモ記録です。本アプリが診断や治療方針を作成することはありません。</p>

      <div className="form-actions">
        <button type="button" className="button button--ghost" onClick={onCancel}>
          <BilingualText english="Cancel" japanese="キャンセル" mode="compact" />
        </button>
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          <BilingualText
            english={isSubmitting ? 'Saving...' : initialRecord ? 'Save Changes' : 'Save SOAP'}
            japanese={isSubmitting ? '保存中' : initialRecord ? '変更を保存' : 'SOAPを保存'}
            mode="compact"
          />
        </button>
      </div>
    </form>
  );
}

function SoapDraftAssist({ onApply }: { onApply: (draft: SoapDraft) => void }) {
  const [input, setInput] = useState('');
  const { status, run } = useAssistRunner<SoapDraft>();
  const inputId = useId();
  const provider = getAssistProvider();

  return (
    <AssistShell
      english="SOAP Draft Assist"
      japanese="文章からSOAP下書き"
      description="記録者が書いた文章を、語句の規則で S / O / A / P に振り分けます。新しい臨床内容は生成しません。"
    >
      <div className="field">
        <label className="field__label" htmlFor={inputId}>振り分ける文章（架空の内容のみ）</label>
        <textarea
          id={inputId}
          className="input textarea"
          rows={4}
          value={input}
          placeholder="例：「夜眠れなかった」と訴えあり。日中は臥床して過ごす。BT 36.9℃。今夜も入眠状況を観察する予定。"
          onChange={(event) => setInput(event.target.value)}
        />
      </div>
      <div className="form-actions form-actions--start">
        <button
          type="button"
          className="button button--secondary"
          disabled={input.trim() === '' || status.kind === 'running'}
          onClick={() => void run(() => provider.draftSoap(input))}
        >
          {status.kind === 'running' ? '作成中…' : 'S/O/A/Pに振り分け'}
        </button>
      </div>
      <div aria-live="polite">
        {status.kind === 'error' ? <p className="field__error">{status.message}</p> : null}
        {status.kind === 'done' ? (
          <div className="assist-panel__output">
            <AssistNotices result={status.result} />
            <dl className="soap-card__grid">
              {SOAP_FIELDS.map((field) => (
                <div className="soap-card__section" key={field.key}>
                  <dt><span className={`soap-letter soap-letter--${field.key}`} aria-hidden="true">{field.letter}</span>{field.english}</dt>
                  <dd>{status.result.value[field.key] || '（空欄：記録者が記入）'}</dd>
                </div>
              ))}
            </dl>
            {status.result.value.unclassified ? (
              <p className="muted-text">未分類：{status.result.value.unclassified}</p>
            ) : null}
            <div className="form-actions form-actions--start">
              <button type="button" className="button button--primary button--small" onClick={() => onApply(status.result.value)}>
                SOAPフォームに反映
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </AssistShell>
  );
}

interface SoapSectionProps {
  records: SoapRecord[];
  onAdd: (input: SoapInput) => void;
  onUpdate: (id: string, input: SoapInput) => void;
  onDelete: (id: string) => void;
}

type Editor = { mode: 'new'; draft?: SoapDraft; key: number } | { mode: 'edit'; record: SoapRecord };

/** SOAP タブ: 一覧・作成・編集・削除 */
export function SoapSection({ records, onAdd, onUpdate, onDelete }: SoapSectionProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SoapRecord | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  useRevealWhen(formRef, editor ? (editor.mode === 'edit' ? editor.record.id : String(editor.key)) : null);

  return (
    <section className="card" aria-labelledby="soap-title">
      <div className="card__header">
        <h2 className="card__title" id="soap-title">
          <BilingualText english="SOAP Notes" japanese="SOAP記録" mode="inline" />
        </h2>
        <div className="card__header-actions">
          <span className="card__meta">{records.length} 件</span>
          {editor === null ? (
            <button type="button" className="button button--primary button--small" onClick={() => setEditor({ mode: 'new', key: Date.now() })}>
              <BilingualText english="New SOAP" japanese="新規作成" mode="compact" />
            </button>
          ) : null}
        </div>
      </div>
      <p className="card__description">
        S（主観）・O（客観）・A（アセスメント）・P（計画）を項目ごとに記録します。A・P は記録者によるデモ記載であり、診断・治療判断の機能ではありません。
      </p>

      <SoapDraftAssist onApply={(draft) => setEditor({ mode: 'new', draft, key: Date.now() })} />

      {editor ? (
        <div ref={formRef} className="reveal-anchor">
          <SoapForm
            key={editor.mode === 'edit' ? editor.record.id : editor.key}
            initialRecord={editor.mode === 'edit' ? editor.record : undefined}
            draft={editor.mode === 'new' ? editor.draft : undefined}
            onSubmit={(input) => {
              if (editor.mode === 'edit') onUpdate(editor.record.id, input);
              else onAdd(input);
              setEditor(null);
            }}
            onCancel={() => setEditor(null)}
          />
        </div>
      ) : null}

      {records.length === 0 ? (
        <EmptyState
          title="No SOAP Notes / SOAP記録なし"
          description="この患者の SOAP 記録はまだありません。「新規作成」から記録できます。"
        />
      ) : (
        <ol className="soap-list">
          {records.map((record) => (
            <li className="soap-card" key={record.id}>
              <div className="soap-card__header">
                <div className="note-item__meta">
                  <time className="note-item__time" dateTime={record.recordedAt}>{formatDateTime(record.recordedAt)}</time>
                  <span className="note-item__author">記録者：{record.author || '未記入'}</span>
                </div>
                <div className="item-actions">
                  <button type="button" className="button button--secondary button--small" onClick={() => setEditor({ mode: 'edit', record })}>
                    <BilingualText english="Edit" japanese="編集" mode="compact" />
                  </button>
                  <button type="button" className="button button--danger-ghost button--small" onClick={() => setPendingDelete(record)}>
                    <BilingualText english="Delete" japanese="削除" mode="compact" />
                  </button>
                </div>
              </div>
              {record.problem ? <h3 className="soap-card__problem">{record.problem}</h3> : null}
              <dl className="soap-card__grid">
                {SOAP_FIELDS.map((field) => (
                  <div className="soap-card__section" key={field.key}>
                    <dt>
                      <span className={`soap-letter soap-letter--${field.key}`} aria-hidden="true">{field.letter}</span>
                      {field.english}
                    </dt>
                    <dd>{record[field.key] || '—'}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete SOAP / SOAP記録を削除"
        message="この SOAP 記録を削除します。元に戻せません。"
        detail={pendingDelete ? `記録日時：${formatDateTime(pendingDelete.recordedAt)}${pendingDelete.problem ? ` / ${pendingDelete.problem}` : ''}` : undefined}
        confirmLabel="Delete / 削除"
        cancelLabel="Cancel / キャンセル"
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}

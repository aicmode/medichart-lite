import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { HandoverPriority, HandoverRecord, HandoverStatus } from '../types';
import type { HandoverInput } from '../hooks/useAppData';
import type { AssistContext, HandoverDraft } from '../ai';
import { getAssistProvider } from '../ai';
import { HANDOVER_PRIORITY_OPTIONS, handoverPriorityLabel, handoverStatusLabel } from '../data/options';
import { formatDateTime, toDateTimeLocalValue } from '../utils/date';
import { MAX_LENGTH, isBlank, validateRecordDateTime } from '../utils/validation';
import { BilingualText } from './BilingualText';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import { AssistNotices } from './AssistPanel';
import { useAssistRunner } from '../hooks/useAssistRunner';
import { useRevealWhen } from '../hooks/useRevealWhen';

interface HandoverFormProps {
  initialRecord?: HandoverRecord;
  draft?: HandoverDraft;
  onSubmit: (input: HandoverInput) => void;
  onCancel: () => void;
}

type HandoverErrors = Partial<Record<'recordedAt' | 'content', string>>;

function HandoverForm({ initialRecord, draft, onSubmit, onCancel }: HandoverFormProps) {
  const [recordedAt, setRecordedAt] = useState(() =>
    toDateTimeLocalValue(initialRecord ? new Date(initialRecord.recordedAt) : new Date()),
  );
  const [author, setAuthor] = useState(initialRecord?.author ?? '');
  const [priority, setPriority] = useState<HandoverPriority>(initialRecord?.priority ?? 'normal');
  const [content, setContent] = useState(initialRecord?.content ?? draft?.content ?? '');
  const [cautions, setCautions] = useState(initialRecord?.cautions ?? draft?.cautions ?? '');
  const [errors, setErrors] = useState<HandoverErrors>({});
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
    const nextErrors: HandoverErrors = {};
    const dateResult = validateRecordDateTime(recordedAt, '申し送り日時');
    if (dateResult.error) nextErrors.recordedAt = dateResult.error;
    if (isBlank(content)) nextErrors.content = '申し送り内容は必須です。空白のみでは保存できません。';
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError !== undefined) {
      document.getElementById(fieldId(firstError))?.focus();
      return;
    }

    submitGuard.current = true;
    setIsSubmitting(true);
    onSubmit({
      recordedAt: dateResult.iso ?? new Date().toISOString(),
      author: author.trim(),
      priority,
      content: content.trim(),
      cautions: cautions.trim(),
    });
    resetTimer.current = window.setTimeout(() => {
      submitGuard.current = false;
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <form className="panel-form" onSubmit={handleSubmit} noValidate aria-label={initialRecord ? '申し送りの編集' : '申し送りの新規作成'}>
      <h3 className="panel-form__title">
        <BilingualText english={initialRecord ? 'Edit Handover' : 'New Handover'} japanese={initialRecord ? '申し送りを編集' : '申し送りを作成'} mode="inline" />
      </h3>
      {draft && !initialRecord ? (
        <p className="assist-applied">記録支援の下書きを反映しました。伝達事項を追記し、内容を確認してから保存してください。</p>
      ) : null}
      <div className="form-grid form-grid--compact">
        <div className="field">
          <label className="field__label" htmlFor={fieldId('recordedAt')}>
            <BilingualText english="Date & Time" japanese="申し送り日時" mode="inline" />
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
          {errors.recordedAt ? <p className="field__error" id={fieldId('recordedAt-error')} role="alert">{errors.recordedAt}</p> : null}
        </div>
        <div className="field">
          <label className="field__label" htmlFor={fieldId('author')}>
            <BilingualText english="From" japanese="記録者（架空）" mode="inline" />
          </label>
          <input id={fieldId('author')} className="input" value={author} maxLength={MAX_LENGTH.shortText} placeholder="例：デモ 看護師B" onChange={(event) => setAuthor(event.target.value)} />
        </div>
        <fieldset className="field fieldset">
          <legend className="field__label">
            <BilingualText english="Priority" japanese="優先度（業務整理用）" mode="inline" />
          </legend>
          <div className="segmented">
            {HANDOVER_PRIORITY_OPTIONS.map((option) => (
              <label className={`segmented__item segmented__item--${option.value}`} key={option.value}>
                <input
                  type="radio"
                  name={fieldId('priority')}
                  value={option.value}
                  checked={priority === option.value}
                  onChange={() => setPriority(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="field">
        <label className="field__label" htmlFor={fieldId('content')}>
          <BilingualText english="Content" japanese="申し送り内容" mode="inline" />
          <span className="field__required">必須</span>
        </label>
        <textarea
          id={fieldId('content')}
          className={`input textarea textarea--tall${errors.content ? ' input--error' : ''}`}
          rows={6}
          maxLength={MAX_LENGTH.longText}
          value={content}
          aria-invalid={errors.content !== undefined}
          aria-describedby={errors.content ? fieldId('content-error') : undefined}
          onChange={(event) => setContent(event.target.value)}
        />
        {errors.content ? <p className="field__error" id={fieldId('content-error')} role="alert">{errors.content}</p> : null}
      </div>
      <div className="field">
        <label className="field__label" htmlFor={fieldId('cautions')}>
          <BilingualText english="Cautions" japanese="注意事項" mode="inline" />
        </label>
        <textarea id={fieldId('cautions')} className="input textarea" rows={3} maxLength={MAX_LENGTH.longText} value={cautions} onChange={(event) => setCautions(event.target.value)} />
      </div>
      <p className="field__hint">優先度は申し送りを整理するための業務ラベルです。医学的な緊急度の判定ではありません。</p>
      <div className="form-actions">
        <button type="button" className="button button--ghost" onClick={onCancel}>
          <BilingualText english="Cancel" japanese="キャンセル" mode="compact" />
        </button>
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          <BilingualText
            english={isSubmitting ? 'Saving...' : initialRecord ? 'Save Changes' : 'Save Handover'}
            japanese={isSubmitting ? '保存中' : initialRecord ? '変更を保存' : '申し送りを保存'}
            mode="compact"
          />
        </button>
      </div>
    </form>
  );
}

interface HandoverSectionProps {
  records: HandoverRecord[];
  assistContext: AssistContext;
  onAdd: (input: HandoverInput) => void;
  onUpdate: (id: string, input: HandoverInput) => void;
  onSetStatus: (id: string, status: HandoverStatus) => void;
  onDelete: (id: string) => void;
}

type Editor = { mode: 'new'; draft?: HandoverDraft; key: number } | { mode: 'edit'; record: HandoverRecord };

/** Handover タブ: 申し送りの作成・確認状態の管理 */
export function HandoverSection({ records, assistContext, onAdd, onUpdate, onSetStatus, onDelete }: HandoverSectionProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [showAcknowledged, setShowAcknowledged] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<HandoverRecord | null>(null);
  const { status: assistStatus, run: runAssist, reset: resetAssist } = useAssistRunner<HandoverDraft>();
  const toggleId = useId();
  const formRef = useRef<HTMLDivElement>(null);
  useRevealWhen(formRef, editor ? (editor.mode === 'edit' ? editor.record.id : String(editor.key)) : null);

  const openCount = records.filter((record) => record.status === 'open').length;
  const visible = showAcknowledged ? records : records.filter((record) => record.status === 'open');

  return (
    <section className="card" aria-labelledby="handover-title">
      <div className="card__header">
        <h2 className="card__title" id="handover-title">
          <BilingualText english="Handover" japanese="申し送り" mode="inline" />
        </h2>
        <div className="card__header-actions">
          <span className="card__meta">未確認 {openCount} / 全 {records.length} 件</span>
          {editor === null ? (
            <button type="button" className="button button--primary button--small" onClick={() => setEditor({ mode: 'new', key: Date.now() })}>
              <BilingualText english="New Handover" japanese="新規作成" mode="compact" />
            </button>
          ) : null}
        </div>
      </div>
      <p className="card__description">看護業務での情報共有を想定した申し送り記録です。診療判断を行う機能ではありません。</p>

      <div className="assist-inline no-print">
        <div>
          <p className="assist-inline__title">
            <span aria-hidden="true">✎ </span>
            <BilingualText english="Draft from Records" japanese="保存データから下書き" mode="inline" />
          </p>
          <p className="assist-inline__description">患者情報・最新バイタル・直近の記録・内服を定型文に並べます（外部送信なし）。</p>
        </div>
        <button
          type="button"
          className="button button--secondary button--small"
          disabled={assistStatus.kind === 'running'}
          onClick={() => void runAssist(() => getAssistProvider().draftHandover(assistContext))}
        >
          {assistStatus.kind === 'running' ? '作成中…' : '下書きを作成'}
        </button>
      </div>
      <div aria-live="polite">
        {assistStatus.kind === 'error' ? <p className="field__error">{assistStatus.message}</p> : null}
        {assistStatus.kind === 'done' ? (
          <div className="assist-panel__output">
            <AssistNotices result={assistStatus.result} />
            <pre className="assist-panel__text">{assistStatus.result.value.content}</pre>
            {assistStatus.result.value.cautions ? (
              <pre className="assist-panel__text assist-panel__text--caution">{assistStatus.result.value.cautions}</pre>
            ) : null}
            <div className="form-actions form-actions--start">
              <button
                type="button"
                className="button button--primary button--small"
                onClick={() => {
                  setEditor({ mode: 'new', draft: assistStatus.result.value, key: Date.now() });
                  resetAssist();
                }}
              >
                フォームに反映
              </button>
              <button type="button" className="button button--ghost button--small" onClick={resetAssist}>
                閉じる
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {editor ? (
        <div ref={formRef} className="reveal-anchor">
          <HandoverForm
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

      {records.length > 0 ? (
        <div className="section-toolbar">
          <label className="checkbox" htmlFor={toggleId}>
            <input id={toggleId} type="checkbox" checked={showAcknowledged} onChange={(event) => setShowAcknowledged(event.target.checked)} />
            確認済みも表示
          </label>
        </div>
      ) : null}

      {records.length === 0 ? (
        <EmptyState title="No Handovers / 申し送りなし" description="この患者の申し送りはまだありません。「新規作成」から記録できます。" />
      ) : visible.length === 0 ? (
        <EmptyState title="All Acknowledged / すべて確認済み" description="未確認の申し送りはありません。" />
      ) : (
        <ol className="handover-list">
          {visible.map((record) => (
            <li className={`handover-card handover-card--${record.priority} handover-card--${record.status}`} key={record.id}>
              <div className="soap-card__header">
                <div className="note-item__meta">
                  <span className={`status-badge status-badge--${record.priority}`}>{handoverPriorityLabel(record.priority)}</span>
                  <span className={`status-badge status-badge--${record.status}`}>{handoverStatusLabel(record.status)}</span>
                  <time className="note-item__time" dateTime={record.recordedAt}>{formatDateTime(record.recordedAt)}</time>
                  <span className="note-item__author">記録者：{record.author || '未記入'}</span>
                </div>
                <div className="item-actions">
                  {record.status === 'open' ? (
                    <button type="button" className="button button--primary button--small" onClick={() => onSetStatus(record.id, 'acknowledged')}>
                      <BilingualText english="Acknowledge" japanese="確認済みにする" mode="compact" />
                    </button>
                  ) : (
                    <button type="button" className="button button--ghost button--small" onClick={() => onSetStatus(record.id, 'open')}>
                      <BilingualText english="Reopen" japanese="未確認に戻す" mode="compact" />
                    </button>
                  )}
                  <button type="button" className="button button--secondary button--small" onClick={() => setEditor({ mode: 'edit', record })}>
                    <BilingualText english="Edit" japanese="編集" mode="compact" />
                  </button>
                  <button type="button" className="button button--danger-ghost button--small" onClick={() => setPendingDelete(record)}>
                    <BilingualText english="Delete" japanese="削除" mode="compact" />
                  </button>
                </div>
              </div>
              <p className="note-item__body">{record.content}</p>
              {record.cautions ? (
                <p className="handover-card__cautions">
                  <strong>注意事項：</strong>
                  {record.cautions}
                </p>
              ) : null}
              {record.status === 'acknowledged' && record.acknowledgedAt ? (
                <p className="note-item__edited">確認日時：{formatDateTime(record.acknowledgedAt)}</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete Handover / 申し送りを削除"
        message="この申し送りを削除します。元に戻せません。"
        detail={pendingDelete ? `申し送り日時：${formatDateTime(pendingDelete.recordedAt)}` : undefined}
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

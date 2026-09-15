import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { NursingNote, RecordType } from '../types';
import type { NursingNoteInput } from '../hooks/useAppData';
import { NOTE_RECORD_TYPE_OPTIONS, RECORD_TAG_SUGGESTIONS, recordTypeLabel } from '../data/options';
import { toDateTimeLocalValue } from '../utils/date';
import { MAX_LENGTH, isBlank, parseTags, validateRecordDateTime } from '../utils/validation';
import { BilingualText } from './BilingualText';

interface NursingNoteFormProps {
  initialNote?: NursingNote;
  /** 記録支援から本文を差し込むための初期本文（新規時のみ） */
  initialBody?: string;
  onSubmit: (input: NursingNoteInput) => void;
  onCancel?: () => void;
}

type NoteErrors = Partial<Record<'recordedAt' | 'body', string>>;

/** 経過・看護記録の入力フォーム */
export function NursingNoteForm({ initialNote, initialBody = '', onSubmit, onCancel }: NursingNoteFormProps) {
  const [recordedAt, setRecordedAt] = useState(() =>
    toDateTimeLocalValue(initialNote ? new Date(initialNote.recordedAt) : new Date()),
  );
  const [author, setAuthor] = useState(initialNote?.author ?? '');
  const [recordType, setRecordType] = useState<RecordType>(initialNote?.recordType ?? 'progress');
  const [body, setBody] = useState(initialNote?.body ?? initialBody);
  const [tagsText, setTagsText] = useState(initialNote?.tags.join('、') ?? '');
  const [errors, setErrors] = useState<NoteErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitGuard = useRef(false);
  const resetTimer = useRef<number | null>(null);

  const formId = useId();
  const fieldId = (key: string) => `${formId}-${key}`;
  const isEditing = initialNote !== undefined;

  // 旧形式（SOAP / 申し送り種別）の記録を編集する場合は、その種別も選択肢に残す
  const typeOptions = NOTE_RECORD_TYPE_OPTIONS.some((option) => option.value === recordType)
    ? NOTE_RECORD_TYPE_OPTIONS
    : [...NOTE_RECORD_TYPE_OPTIONS, { value: recordType, label: recordTypeLabel(recordType) }];

  const currentTags = parseTags(tagsText);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  const toggleSuggestedTag = (tag: string) => {
    const exists = currentTags.includes(tag);
    const next = exists ? currentTags.filter((item) => item !== tag) : [...currentTags, tag];
    setTagsText(next.join('、'));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitGuard.current) return;

    const nextErrors: NoteErrors = {};
    const dateResult = validateRecordDateTime(recordedAt, '記録日時');
    if (dateResult.error) nextErrors.recordedAt = dateResult.error;
    if (isBlank(body)) nextErrors.body = '記録本文は必須です。空白のみでは保存できません。';

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
      recordType,
      body: body.trim(),
      tags: currentTags,
    });

    if (!isEditing) {
      setRecordedAt(toDateTimeLocalValue());
      setBody('');
      setTagsText('');
      setErrors({});
    }

    resetTimer.current = window.setTimeout(() => {
      submitGuard.current = false;
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <form className="form form--inline" onSubmit={handleSubmit} noValidate>
      <div className="form-grid form-grid--compact">
        <div className="field">
          <label className="field__label" htmlFor={fieldId('recordedAt')}>
            <BilingualText english="Recorded At" japanese="記録日時" mode="inline" />
            <span className="field__required">必須</span>
          </label>
          <input
            id={fieldId('recordedAt')}
            className={`input${errors.recordedAt ? ' input--error' : ''}`}
            type="datetime-local"
            value={recordedAt}
            aria-invalid={errors.recordedAt !== undefined}
            aria-describedby={errors.recordedAt ? `${fieldId('recordedAt')}-error` : undefined}
            onChange={(event) => setRecordedAt(event.target.value)}
          />
          {errors.recordedAt ? (
            <p className="field__error" id={`${fieldId('recordedAt')}-error`} role="alert">
              {errors.recordedAt}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fieldId('author')}>
            <BilingualText english="Recorder" japanese="記録者（架空）" mode="inline" />
          </label>
          <input
            id={fieldId('author')}
            className="input"
            type="text"
            value={author}
            maxLength={MAX_LENGTH.shortText}
            placeholder="例：デモ 看護師A"
            autoComplete="off"
            onChange={(event) => setAuthor(event.target.value)}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fieldId('recordType')}>
            <BilingualText english="Record Type" japanese="記録種別" mode="inline" />
          </label>
          <select
            id={fieldId('recordType')}
            className="input"
            value={recordType}
            onChange={(event) => setRecordType(event.target.value as RecordType)}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={fieldId('body')}>
          <BilingualText english="Note" japanese="記録本文" mode="inline" />
          <span className="field__required">必須</span>
        </label>
        <textarea
          id={fieldId('body')}
          className={`input textarea textarea--tall${errors.body ? ' input--error' : ''}`}
          rows={6}
          maxLength={MAX_LENGTH.longText}
          value={body}
          placeholder="観察した事実や実施したケアを記入します（架空の内容のみ）。"
          aria-invalid={errors.body !== undefined}
          aria-describedby={`${fieldId('body')}-count${errors.body ? ` ${fieldId('body')}-error` : ''}`}
          onChange={(event) => setBody(event.target.value)}
        />
        <p className="field__hint" id={`${fieldId('body')}-count`}>
          {body.length} / {MAX_LENGTH.longText} 文字
        </p>
        {errors.body ? (
          <p className="field__error" id={`${fieldId('body')}-error`} role="alert">
            {errors.body}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={fieldId('tags')}>
          <BilingualText english="Tags" japanese="タグ（読点・カンマ区切り）" mode="inline" />
        </label>
        <input
          id={fieldId('tags')}
          className="input"
          type="text"
          value={tagsText}
          placeholder="例：食事、排泄"
          autoComplete="off"
          aria-describedby={`${fieldId('tags')}-suggest`}
          onChange={(event) => setTagsText(event.target.value)}
        />
        <div className="chip-grid chip-grid--small" role="group" aria-label="タグ候補" id={`${fieldId('tags')}-suggest`}>
          {RECORD_TAG_SUGGESTIONS.map((tag) => {
            const selected = currentTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                className={`chip chip--toggle${selected ? ' chip--on' : ''}`}
                aria-pressed={selected}
                onClick={() => toggleSuggestedTag(tag)}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-actions form-actions--start">
        {onCancel ? (
          <button type="button" className="button button--ghost" onClick={onCancel}>
            <BilingualText english="Cancel" japanese="キャンセル" mode="compact" />
          </button>
        ) : null}
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          <BilingualText
            english={isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Record'}
            japanese={isSubmitting ? '保存中' : isEditing ? '変更を保存' : '記録を登録'}
            mode="compact"
          />
        </button>
      </div>
    </form>
  );
}

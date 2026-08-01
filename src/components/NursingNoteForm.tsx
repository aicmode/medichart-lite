import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { RecordType } from '../types';
import type { NursingNoteInput } from '../hooks/useAppData';
import { RECORD_TYPE_OPTIONS } from '../data/options';
import { dateTimeLocalToISO, toDateTimeLocalValue } from '../utils/date';
import { isBlank } from '../utils/validation';
import { BilingualText } from './BilingualText';

interface NursingNoteFormProps {
  onSubmit: (input: NursingNoteInput) => void;
}

type NoteErrors = Partial<Record<'recordedAt' | 'body', string>>;

/** 看護記録の入力フォーム */
export function NursingNoteForm({ onSubmit }: NursingNoteFormProps) {
  const [recordedAt, setRecordedAt] = useState(() => toDateTimeLocalValue());
  const [author, setAuthor] = useState('');
  const [recordType, setRecordType] = useState<RecordType>('progress');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<NoteErrors>({});
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

    const nextErrors: NoteErrors = {};
    const recordedAtISO = dateTimeLocalToISO(recordedAt);

    if (recordedAtISO === null) {
      nextErrors.recordedAt = '記録日時を正しく入力してください。';
    }
    if (isBlank(body)) {
      nextErrors.body = '記録本文は必須です。空白のみでは保存できません。';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.body) document.getElementById(fieldId('body'))?.focus();
      return;
    }

    submitGuard.current = true;
    setIsSubmitting(true);

    onSubmit({
      recordedAt: recordedAtISO ?? new Date().toISOString(),
      author: author.trim(),
      recordType,
      body: body.trim(),
    });

    // 保存後にフォームを初期化する
    setRecordedAt(toDateTimeLocalValue());
    setBody('');
    setErrors({});

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
            <BilingualText english="Recorder" japanese="記録者名" mode="inline" />
          </label>
          <input
            id={fieldId('author')}
            className="input"
            type="text"
            value={author}
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
            {RECORD_TYPE_OPTIONS.map((option) => (
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
          value={body}
          placeholder="観察した事実や実施したケアを記入します（架空の内容のみ）。"
          aria-invalid={errors.body !== undefined}
          aria-describedby={errors.body ? `${fieldId('body')}-error` : undefined}
          onChange={(event) => setBody(event.target.value)}
        />
        {errors.body ? (
          <p className="field__error" id={`${fieldId('body')}-error`} role="alert">
            {errors.body}
          </p>
        ) : null}
      </div>

      <div className="form-actions form-actions--start">
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          <BilingualText
            english={isSubmitting ? 'Saving...' : 'Add Note'}
            japanese={isSubmitting ? '保存中' : '看護記録を登録'}
            mode="compact"
          />
        </button>
      </div>
    </form>
  );
}

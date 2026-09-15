import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { VitalSign } from '../types';
import type { VitalSignInput } from '../hooks/useAppData';
import { CONSCIOUSNESS_OPTIONS } from '../data/options';
import { MAX_LENGTH, VITAL_RANGES, parseNumericField, validateRecordDateTime } from '../utils/validation';
import type { VitalFieldKey } from '../utils/validation';
import { toDateTimeLocalValue } from '../utils/date';
import { BilingualText } from './BilingualText';

interface VitalSignFormProps {
  /** 編集時の初期値 */
  initialVital?: VitalSign;
  onSubmit: (input: VitalSignInput) => void;
  onCancel?: () => void;
}

type NumericFormState = Record<VitalFieldKey, string>;

type VitalErrors = Partial<Record<VitalFieldKey | 'measuredAt' | 'form', string>>;

/** 数値入力欄の表示順と設定 */
const NUMERIC_FIELDS: { key: VitalFieldKey; english: string; japanese: string }[] = [
  { key: 'temperature', english: 'BT', japanese: '体温' },
  { key: 'systolic', english: 'SBP', japanese: '収縮期血圧' },
  { key: 'diastolic', english: 'DBP', japanese: '拡張期血圧' },
  { key: 'pulse', english: 'HR', japanese: '脈拍' },
  { key: 'respiration', english: 'RR', japanese: '呼吸数' },
  { key: 'spo2', english: 'SpO₂', japanese: '酸素飽和度' },
  { key: 'painScale', english: 'Pain', japanese: '疼痛スケール' },
];

function toNumericState(vital?: VitalSign): NumericFormState {
  const text = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value));
  return {
    temperature: text(vital?.temperature),
    systolic: text(vital?.systolic),
    diastolic: text(vital?.diastolic),
    pulse: text(vital?.pulse),
    respiration: text(vital?.respiration),
    spo2: text(vital?.spo2),
    painScale: text(vital?.painScale),
  };
}

/** バイタルサインの登録・編集フォーム */
export function VitalSignForm({ initialVital, onSubmit, onCancel }: VitalSignFormProps) {
  const [measuredAt, setMeasuredAt] = useState(() =>
    toDateTimeLocalValue(initialVital ? new Date(initialVital.measuredAt) : new Date()),
  );
  const [numbers, setNumbers] = useState<NumericFormState>(() => toNumericState(initialVital));
  const [consciousness, setConsciousness] = useState(initialVital?.consciousness || CONSCIOUSNESS_OPTIONS[0]);
  const [memo, setMemo] = useState(initialVital?.memo ?? '');
  const [errors, setErrors] = useState<VitalErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitGuard = useRef(false);
  const resetTimer = useRef<number | null>(null);

  const formId = useId();
  const fieldId = (key: string) => `${formId}-${key}`;
  const isEditing = initialVital !== undefined;

  // 既存の選択肢にない文言で保存された旧データも選択肢として表示する
  const consciousnessOptions = CONSCIOUSNESS_OPTIONS.includes(consciousness)
    ? CONSCIOUSNESS_OPTIONS
    : [...CONSCIOUSNESS_OPTIONS, consciousness];

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitGuard.current) return;

    const nextErrors: VitalErrors = {};
    const parsedValues: Record<VitalFieldKey, number | null> = {
      temperature: null,
      systolic: null,
      diastolic: null,
      pulse: null,
      respiration: null,
      spo2: null,
      painScale: null,
    };

    const dateResult = validateRecordDateTime(measuredAt, '測定日時');
    if (dateResult.error) nextErrors.measuredAt = dateResult.error;

    for (const field of NUMERIC_FIELDS) {
      const result = parseNumericField(numbers[field.key], VITAL_RANGES[field.key]);
      if (result.error) nextErrors[field.key] = result.error;
      parsedValues[field.key] = result.value;
    }

    if (
      parsedValues.systolic !== null &&
      parsedValues.diastolic !== null &&
      parsedValues.diastolic >= parsedValues.systolic
    ) {
      nextErrors.diastolic = '拡張期血圧は収縮期血圧より小さい値を入力してください。';
    }

    const hasAnyValue = NUMERIC_FIELDS.some((field) => numbers[field.key].trim() !== '');
    if (!hasAnyValue && consciousness === CONSCIOUSNESS_OPTIONS[0] && memo.trim() === '') {
      nextErrors.form = '少なくとも1項目（数値・意識状態・備考のいずれか）を入力してください。';
    }

    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError !== undefined) {
      document.getElementById(fieldId(firstError === 'form' ? 'temperature' : firstError))?.focus();
      return;
    }

    submitGuard.current = true;
    setIsSubmitting(true);

    onSubmit({
      measuredAt: dateResult.iso ?? new Date().toISOString(),
      ...parsedValues,
      consciousness,
      memo: memo.trim(),
    });

    if (!isEditing) {
      // 保存後はフォームを初期化する
      setMeasuredAt(toDateTimeLocalValue());
      setNumbers(toNumericState());
      setConsciousness(CONSCIOUSNESS_OPTIONS[0]);
      setMemo('');
    }

    resetTimer.current = window.setTimeout(() => {
      submitGuard.current = false;
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <form className="form form--inline" onSubmit={handleSubmit} noValidate>
      {errors.form ? (
        <p className="field__error" role="alert">
          {errors.form}
        </p>
      ) : null}
      <div className="form-grid form-grid--compact">
        <div className="field">
          <label className="field__label" htmlFor={fieldId('measuredAt')}>
            <BilingualText english="Measured At" japanese="測定日時" mode="inline" />
            <span className="field__required">必須</span>
          </label>
          <input
            id={fieldId('measuredAt')}
            className={`input${errors.measuredAt ? ' input--error' : ''}`}
            type="datetime-local"
            value={measuredAt}
            aria-invalid={errors.measuredAt !== undefined}
            aria-describedby={errors.measuredAt ? `${fieldId('measuredAt')}-error` : undefined}
            onChange={(event) => setMeasuredAt(event.target.value)}
          />
          {errors.measuredAt ? (
            <p className="field__error" id={`${fieldId('measuredAt')}-error`} role="alert">
              {errors.measuredAt}
            </p>
          ) : null}
        </div>

        {NUMERIC_FIELDS.map((field) => {
          const range = VITAL_RANGES[field.key];
          const error = errors[field.key];
          return (
            <div className="field" key={field.key}>
              <label className="field__label" htmlFor={fieldId(field.key)}>
                <BilingualText english={field.english} japanese={field.japanese} mode="inline" />
                <span className="field__unit">
                  {range.min}〜{range.max}
                  {range.unit ? ` ${range.unit}` : ''}
                </span>
              </label>
              <input
                id={fieldId(field.key)}
                className={`input${error ? ' input--error' : ''}`}
                type="number"
                inputMode="decimal"
                step={range.step}
                min={range.min}
                max={range.max}
                value={numbers[field.key]}
                aria-invalid={error !== undefined}
                aria-describedby={error ? `${fieldId(field.key)}-error` : undefined}
                onChange={(event) => setNumbers((current) => ({ ...current, [field.key]: event.target.value }))}
              />
              {error ? (
                <p className="field__error" id={`${fieldId(field.key)}-error`} role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}

        <div className="field">
          <label className="field__label" htmlFor={fieldId('consciousness')}>
            <BilingualText english="Consciousness" japanese="意識状態" mode="inline" />
          </label>
          <select
            id={fieldId('consciousness')}
            className="input"
            value={consciousness}
            onChange={(event) => setConsciousness(event.target.value)}
          >
            {consciousnessOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={fieldId('memo')}>
          <BilingualText english="Memo" japanese="備考" mode="inline" />
        </label>
        <textarea
          id={fieldId('memo')}
          className="input textarea"
          rows={2}
          maxLength={MAX_LENGTH.longText}
          value={memo}
          placeholder="例：離床後に測定"
          onChange={(event) => setMemo(event.target.value)}
        />
      </div>

      <p className="field__hint">
        入力値の範囲チェック（明らかな入力ミスの防止）のみを行います。未入力の項目は空欄のまま保存されます。
      </p>

      <div className="form-actions form-actions--start">
        {onCancel ? (
          <button type="button" className="button button--ghost" onClick={onCancel}>
            <BilingualText english="Cancel" japanese="キャンセル" mode="compact" />
          </button>
        ) : null}
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          <BilingualText
            english={isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Vitals'}
            japanese={isSubmitting ? '保存中' : isEditing ? '変更を保存' : 'バイタルを登録'}
            mode="compact"
          />
        </button>
      </div>
    </form>
  );
}

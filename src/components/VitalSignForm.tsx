import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { VitalSignInput } from '../hooks/useAppData';
import { CONSCIOUSNESS_OPTIONS } from '../data/options';
import { VITAL_RANGES, parseNumericField } from '../utils/validation';
import type { VitalFieldKey } from '../utils/validation';
import { dateTimeLocalToISO, toDateTimeLocalValue } from '../utils/date';

interface VitalSignFormProps {
  onSubmit: (input: VitalSignInput) => void;
}

type NumericFormState = Record<VitalFieldKey, string>;

type VitalErrors = Partial<Record<VitalFieldKey | 'measuredAt', string>>;

/** 数値入力欄の表示順と設定 */
const NUMERIC_FIELDS: { key: VitalFieldKey; english: string }[] = [
  { key: 'temperature', english: 'Temperature' },
  { key: 'systolic', english: 'Systolic BP' },
  { key: 'diastolic', english: 'Diastolic BP' },
  { key: 'pulse', english: 'Pulse' },
  { key: 'respiration', english: 'Respiration' },
  { key: 'spo2', english: 'SpO₂' },
  { key: 'painScale', english: 'Pain Scale' },
];

function createEmptyNumericState(): NumericFormState {
  return {
    temperature: '',
    systolic: '',
    diastolic: '',
    pulse: '',
    respiration: '',
    spo2: '',
    painScale: '',
  };
}

/** バイタルサインの登録フォーム */
export function VitalSignForm({ onSubmit }: VitalSignFormProps) {
  const [measuredAt, setMeasuredAt] = useState(() => toDateTimeLocalValue());
  const [numbers, setNumbers] = useState<NumericFormState>(createEmptyNumericState);
  const [consciousness, setConsciousness] = useState(CONSCIOUSNESS_OPTIONS[0]);
  const [memo, setMemo] = useState('');
  const [errors, setErrors] = useState<VitalErrors>({});
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

    const measuredAtISO = dateTimeLocalToISO(measuredAt);
    if (measuredAtISO === null) {
      nextErrors.measuredAt = '測定日時を正しく入力してください。';
    }

    for (const field of NUMERIC_FIELDS) {
      const result = parseNumericField(numbers[field.key], VITAL_RANGES[field.key]);
      if (result.error) {
        nextErrors[field.key] = result.error;
      }
      parsedValues[field.key] = result.value;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    submitGuard.current = true;
    setIsSubmitting(true);

    onSubmit({
      measuredAt: measuredAtISO ?? new Date().toISOString(),
      temperature: parsedValues.temperature,
      systolic: parsedValues.systolic,
      diastolic: parsedValues.diastolic,
      pulse: parsedValues.pulse,
      respiration: parsedValues.respiration,
      spo2: parsedValues.spo2,
      consciousness,
      painScale: parsedValues.painScale,
      memo: memo.trim(),
    });

    // 保存後はフォームを初期化する
    setMeasuredAt(toDateTimeLocalValue());
    setNumbers(createEmptyNumericState());
    setConsciousness(CONSCIOUSNESS_OPTIONS[0]);
    setMemo('');

    resetTimer.current = window.setTimeout(() => {
      submitGuard.current = false;
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <form className="form form--inline" onSubmit={handleSubmit} noValidate>
      <div className="form-grid form-grid--compact">
        <div className="field">
          <label className="field__label" htmlFor={fieldId('measuredAt')}>
            測定日時
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
                {field.english}
                <span className="field__unit">
                  {range.label}
                  {range.unit ? ` / ${range.unit}` : ''}
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
                placeholder={`${range.min}〜${range.max}`}
                aria-invalid={error !== undefined}
                aria-describedby={error ? `${fieldId(field.key)}-error` : undefined}
                onChange={(event) =>
                  setNumbers((current) => ({ ...current, [field.key]: event.target.value }))
                }
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
            意識レベル
          </label>
          <select
            id={fieldId('consciousness')}
            className="input"
            value={consciousness}
            onChange={(event) => setConsciousness(event.target.value)}
          >
            {CONSCIOUSNESS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={fieldId('memo')}>
          メモ
        </label>
        <textarea
          id={fieldId('memo')}
          className="input textarea"
          rows={2}
          value={memo}
          placeholder="例：離床後に測定"
          onChange={(event) => setMemo(event.target.value)}
        />
      </div>

      <p className="field__hint">
        入力値の範囲チェックのみを行います。数値の評価や医療的な判断は行いません。未入力の項目は空欄のまま保存されます。
      </p>

      <div className="form-actions form-actions--start">
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Add Vital Signs'}
        </button>
      </div>
    </form>
  );
}

import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { BloodType, Gender, Patient } from '../types';
import type { PatientInput } from '../hooks/useAppData';
import { BLOOD_TYPE_OPTIONS, GENDER_OPTIONS } from '../data/options';
import { DiagnosisSelector } from './DiagnosisSelector';
import { calculateAge, todayDateValue } from '../utils/date';
import { isBlank, isFutureDate, normalizeText } from '../utils/validation';

interface PatientFormProps {
  /** 編集時の初期値。未指定なら新規登録フォームとして動作する */
  initialPatient?: Patient;
  /** 患者IDの重複判定（編集中の患者自身は除外済みで渡す） */
  isPatientIdTaken: (patientId: string) => boolean;
  submitLabel: string;
  onSubmit: (input: PatientInput) => void;
  onCancel?: () => void;
}

/** フォームの入力状態（すべて文字列で保持する） */
interface FormState {
  patientId: string;
  name: string;
  dateOfBirth: string;
  gender: Gender;
  room: string;
  bloodType: BloodType;
  allergies: string;
  medicalHistory: string;
  chiefComplaint: string;
  diagnoses: string[];
  notes: string;
}

type FieldErrors = Partial<Record<'patientId' | 'name' | 'dateOfBirth', string>>;

function toFormState(patient?: Patient): FormState {
  return {
    patientId: patient?.patientId ?? '',
    name: patient?.name ?? '',
    dateOfBirth: patient?.dateOfBirth ?? '',
    gender: patient?.gender ?? 'undisclosed',
    room: patient?.room ?? '',
    bloodType: patient?.bloodType ?? 'unknown',
    allergies: patient?.allergies ?? '',
    medicalHistory: patient?.medicalHistory ?? '',
    chiefComplaint: patient?.chiefComplaint ?? '',
    diagnoses: patient?.diagnoses ? [...patient.diagnoses] : [],
    notes: patient?.notes ?? '',
  };
}

/** 患者情報の登録・編集フォーム */
export function PatientForm({
  initialPatient,
  isPatientIdTaken,
  submitLabel,
  onSubmit,
  onCancel,
}: PatientFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialPatient));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitGuard = useRef(false);
  const resetTimer = useRef<number | null>(null);

  const ids = {
    patientId: useId(),
    name: useId(),
    dateOfBirth: useId(),
    gender: useId(),
    room: useId(),
    bloodType: useId(),
    allergies: useId(),
    medicalHistory: useId(),
    chiefComplaint: useId(),
    notes: useId(),
  };

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = (): FieldErrors => {
    const nextErrors: FieldErrors = {};

    if (isBlank(form.patientId)) {
      nextErrors.patientId = '患者IDは必須です。空白のみでは登録できません。';
    } else if (isPatientIdTaken(normalizeText(form.patientId))) {
      nextErrors.patientId = `患者ID「${normalizeText(form.patientId)}」は既に登録されています。別のIDを入力してください。`;
    }

    if (isBlank(form.name)) {
      nextErrors.name = '氏名は必須です。空白のみでは登録できません。';
    }

    if (form.dateOfBirth && isFutureDate(form.dateOfBirth)) {
      nextErrors.dateOfBirth = '生年月日に未来の日付は指定できません。';
    }

    return nextErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // ボタン連打による二重保存を防ぐ
    if (submitGuard.current) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(ids[firstKey as keyof typeof ids])?.focus();
      return;
    }

    submitGuard.current = true;
    setIsSubmitting(true);

    onSubmit({
      patientId: normalizeText(form.patientId),
      name: normalizeText(form.name),
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      room: normalizeText(form.room),
      bloodType: form.bloodType,
      allergies: form.allergies.trim(),
      medicalHistory: form.medicalHistory.trim(),
      chiefComplaint: form.chiefComplaint.trim(),
      diagnoses: form.diagnoses,
      notes: form.notes.trim(),
    });

    // 画面が残る場合に備え、少し待ってから再送信を許可する
    resetTimer.current = window.setTimeout(() => {
      submitGuard.current = false;
      setIsSubmitting(false);
    }, 500);
  };

  const age = calculateAge(form.dateOfBirth);

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <section className="card">
        <h2 className="card__title">Basic Information</h2>
        <div className="form-grid">
          <div className="field">
            <label className="field__label" htmlFor={ids.patientId}>
              Patient ID <span className="field__required">必須</span>
            </label>
            <input
              id={ids.patientId}
              className={`input${errors.patientId ? ' input--error' : ''}`}
              type="text"
              value={form.patientId}
              placeholder="例：PT-0003"
              autoComplete="off"
              aria-invalid={errors.patientId !== undefined}
              aria-describedby={errors.patientId ? `${ids.patientId}-error` : undefined}
              onChange={(event) => updateField('patientId', event.target.value)}
            />
            <p className="field__hint">院内で使う任意の患者IDを入力します（重複不可）。</p>
            {errors.patientId ? (
              <p className="field__error" id={`${ids.patientId}-error`} role="alert">
                {errors.patientId}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label className="field__label" htmlFor={ids.name}>
              Name <span className="field__required">必須</span>
            </label>
            <input
              id={ids.name}
              className={`input${errors.name ? ' input--error' : ''}`}
              type="text"
              value={form.name}
              placeholder="例：架空 太郎"
              autoComplete="off"
              aria-invalid={errors.name !== undefined}
              aria-describedby={errors.name ? `${ids.name}-error` : undefined}
              onChange={(event) => updateField('name', event.target.value)}
            />
            <p className="field__hint">架空の氏名を入力してください。</p>
            {errors.name ? (
              <p className="field__error" id={`${ids.name}-error`} role="alert">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label className="field__label" htmlFor={ids.dateOfBirth}>
              Date of Birth
            </label>
            <input
              id={ids.dateOfBirth}
              className={`input${errors.dateOfBirth ? ' input--error' : ''}`}
              type="date"
              value={form.dateOfBirth}
              max={todayDateValue()}
              aria-invalid={errors.dateOfBirth !== undefined}
              aria-describedby={errors.dateOfBirth ? `${ids.dateOfBirth}-error` : undefined}
              onChange={(event) => updateField('dateOfBirth', event.target.value)}
            />
            <p className="field__hint">
              現在年齢：{age === null ? '生年月日を入力すると自動計算されます' : `${age}歳`}
            </p>
            {errors.dateOfBirth ? (
              <p className="field__error" id={`${ids.dateOfBirth}-error`} role="alert">
                {errors.dateOfBirth}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label className="field__label" htmlFor={ids.gender}>
              Gender
            </label>
            <select
              id={ids.gender}
              className="input"
              value={form.gender}
              onChange={(event) => updateField('gender', event.target.value as Gender)}
            >
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="field__hint">選択がない場合は「未回答」のままで登録できます。</p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor={ids.room}>
              Room
            </label>
            <input
              id={ids.room}
              className="input"
              type="text"
              value={form.room}
              placeholder="例：301"
              autoComplete="off"
              onChange={(event) => updateField('room', event.target.value)}
            />
            <p className="field__hint">病室番号や病棟名を入力します。</p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor={ids.bloodType}>
              Blood Type
            </label>
            <select
              id={ids.bloodType}
              className="input"
              value={form.bloodType}
              onChange={(event) => updateField('bloodType', event.target.value as BloodType)}
            >
              {BLOOD_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="field__hint">不明な場合は「不明」を選択します。</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">Diagnoses</h2>
        <p className="card__description">
          疾患名をテンプレートから選ぶか、自由入力で追加できます。入力補助のための一覧であり、診断を行う機能ではありません。
        </p>
        <DiagnosisSelector
          value={form.diagnoses}
          onChange={(update) =>
            setForm((current) => ({ ...current, diagnoses: update(current.diagnoses) }))
          }
        />
      </section>

      <section className="card">
        <h2 className="card__title">Medical Information</h2>
        <div className="form-grid">
          <div className="field">
            <label className="field__label" htmlFor={ids.allergies}>
              Allergies
            </label>
            <textarea
              id={ids.allergies}
              className="input textarea"
              rows={3}
              value={form.allergies}
              placeholder="例：特記事項なし"
              onChange={(event) => updateField('allergies', event.target.value)}
            />
            <p className="field__hint">アレルギーに関する申告内容を記入します。</p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor={ids.medicalHistory}>
              Medical History
            </label>
            <textarea
              id={ids.medicalHistory}
              className="input textarea"
              rows={3}
              value={form.medicalHistory}
              placeholder="例：高血圧症にて外来通院中"
              onChange={(event) => updateField('medicalHistory', event.target.value)}
            />
            <p className="field__hint">既往歴を記入します。</p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor={ids.chiefComplaint}>
              Chief Complaint
            </label>
            <textarea
              id={ids.chiefComplaint}
              className="input textarea"
              rows={3}
              value={form.chiefComplaint}
              placeholder="例：労作時の息切れ"
              onChange={(event) => updateField('chiefComplaint', event.target.value)}
            />
            <p className="field__hint">本人の訴えをそのまま記入します。</p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor={ids.notes}>
              Notes
            </label>
            <textarea
              id={ids.notes}
              className="input textarea"
              rows={3}
              value={form.notes}
              placeholder="例：デモ用の架空患者データ"
              onChange={(event) => updateField('notes', event.target.value)}
            />
            <p className="field__hint">その他の備考を記入します。</p>
          </div>
        </div>
      </section>

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="button button--ghost" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

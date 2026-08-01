import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Medication, MedicationCategory } from '../types';
import type { MedicationInput } from '../hooks/useAppData';
import { dateTimeLocalToISO, formatDateTime, toDateTimeLocalValue } from '../utils/date';
import { isBlank } from '../utils/validation';
import { BilingualText } from './BilingualText';
import { ConfirmDialog } from './ConfirmDialog';

const TIMING_OPTIONS = [
  '朝',
  '昼',
  '夕',
  '就寝前',
  '朝・夕',
  '朝・昼・夕',
  '毎食後',
  '1日1回',
  '1日2回',
  '1日3回',
] as const;

const PRN_OPTIONS = [
  '疼痛時',
  '発熱時',
  '不眠時',
  '不穏時',
  '嘔気時',
  '便秘時',
  '呼吸苦時',
] as const;

interface MedicationSectionProps {
  medications: Medication[];
  onAdd: (input: MedicationInput) => void;
  onUpdate: (id: string, input: MedicationInput) => void;
  onDelete: (id: string) => void;
}

interface MedicationFormProps {
  category: MedicationCategory;
  initialMedication?: Medication;
  onSubmit: (input: MedicationInput) => void;
  onCancel: () => void;
}

interface FormState {
  name: string;
  dose: string;
  unit: string;
  timingChoice: string;
  customTiming: string;
  indication: string;
  prnChoice: string;
  customPrn: string;
  lastAdministeredAt: string;
  memo: string;
}

type FormErrors = Partial<Record<'name' | 'dose', string>>;

function containsOption(options: readonly string[], value: string): boolean {
  return options.includes(value);
}

function initialState(medication?: Medication): FormState {
  const timing = medication?.timing ?? '';
  const prnIndication = medication?.category === 'prn' ? medication.indication : '';
  return {
    name: medication?.name ?? '',
    dose: medication?.dose ?? '',
    unit: medication?.unit ?? '',
    timingChoice: timing === '' ? '' : containsOption(TIMING_OPTIONS, timing) ? timing : 'その他',
    customTiming: timing !== '' && !containsOption(TIMING_OPTIONS, timing) ? timing : '',
    indication: medication?.category === 'regular' ? medication.indication : '',
    prnChoice:
      prnIndication === ''
        ? ''
        : containsOption(PRN_OPTIONS, prnIndication)
          ? prnIndication
          : 'その他',
    customPrn:
      prnIndication !== '' && !containsOption(PRN_OPTIONS, prnIndication) ? prnIndication : '',
    lastAdministeredAt: medication?.lastAdministeredAt
      ? toDateTimeLocalValue(new Date(medication.lastAdministeredAt))
      : '',
    memo: medication?.memo ?? '',
  };
}

function MedicationForm({
  category,
  initialMedication,
  onSubmit,
  onCancel,
}: MedicationFormProps) {
  const [form, setForm] = useState<FormState>(() => initialState(initialMedication));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitGuard = useRef(false);
  const resetTimer = useRef<number | null>(null);
  const formId = useId();
  const fieldId = (name: string) => `${formId}-${name}`;

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitGuard.current) return;

    const nextErrors: FormErrors = {};
    if (isBlank(form.name)) nextErrors.name = '薬剤名は必須です。空白のみでは保存できません。';
    if (isBlank(form.dose)) nextErrors.dose = '用量は必須です。空白のみでは保存できません。';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      document.getElementById(fieldId(nextErrors.name ? 'name' : 'dose'))?.focus();
      return;
    }

    submitGuard.current = true;
    setIsSubmitting(true);
    const timing =
      category === 'regular'
        ? form.timingChoice === 'その他'
          ? form.customTiming.trim()
          : form.timingChoice
        : '';
    const indication =
      category === 'regular'
        ? form.indication.trim()
        : form.prnChoice === 'その他'
          ? form.customPrn.trim()
          : form.prnChoice;

    onSubmit({
      category,
      name: form.name.trim(),
      dose: form.dose.trim(),
      unit: form.unit.trim(),
      timing,
      indication,
      lastAdministeredAt:
        category === 'prn' && form.lastAdministeredAt
          ? (dateTimeLocalToISO(form.lastAdministeredAt) ?? '')
          : '',
      memo: form.memo.trim(),
    });

    resetTimer.current = window.setTimeout(() => {
      submitGuard.current = false;
      setIsSubmitting(false);
    }, 500);
  };

  const categoryLabel = category === 'regular' ? '定期薬' : '臨時薬';

  return (
    <form className="medication-form" onSubmit={handleSubmit} noValidate>
      <div className="medication-form__header">
        <h4>
          <BilingualText
            english={initialMedication ? 'Edit Medication' : 'Add Medication'}
            japanese={`${categoryLabel}${initialMedication ? 'を編集' : 'を追加'}`}
            mode="inline"
          />
        </h4>
      </div>

      <div className="form-grid form-grid--compact">
        <div className="field">
          <label className="field__label" htmlFor={fieldId('name')}>
            <BilingualText english="Medication Name" japanese="薬剤名" mode="inline" />
            <span className="field__required">必須</span>
          </label>
          <input
            id={fieldId('name')}
            className={`input${errors.name ? ' input--error' : ''}`}
            value={form.name}
            autoComplete="off"
            aria-invalid={errors.name !== undefined}
            aria-describedby={errors.name ? fieldId('name-error') : undefined}
            onChange={(event) => update('name', event.target.value)}
          />
          {errors.name ? (
            <p className="field__error" id={fieldId('name-error')} role="alert">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fieldId('dose')}>
            <BilingualText english="Dose" japanese="用量" mode="inline" />
            <span className="field__required">必須</span>
          </label>
          <input
            id={fieldId('dose')}
            className={`input${errors.dose ? ' input--error' : ''}`}
            value={form.dose}
            inputMode="decimal"
            placeholder="例：1"
            aria-invalid={errors.dose !== undefined}
            aria-describedby={errors.dose ? fieldId('dose-error') : undefined}
            onChange={(event) => update('dose', event.target.value)}
          />
          {errors.dose ? (
            <p className="field__error" id={fieldId('dose-error')} role="alert">
              {errors.dose}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fieldId('unit')}>
            <BilingualText english="Unit" japanese="単位" mode="inline" />
          </label>
          <input
            id={fieldId('unit')}
            className="input"
            value={form.unit}
            placeholder="例：錠、mg、mL"
            onChange={(event) => update('unit', event.target.value)}
          />
        </div>

        {category === 'regular' ? (
          <>
            <div className="field">
              <label className="field__label" htmlFor={fieldId('timing')}>
                <BilingualText english="Timing" japanese="服用タイミング" mode="inline" />
              </label>
              <select
                id={fieldId('timing')}
                className="input"
                value={form.timingChoice}
                onChange={(event) => update('timingChoice', event.target.value)}
              >
                <option value="">未選択</option>
                {TIMING_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value="その他">その他（自由入力）</option>
              </select>
            </div>
            {form.timingChoice === 'その他' ? (
              <div className="field">
                <label className="field__label" htmlFor={fieldId('customTiming')}>
                  <BilingualText english="Custom Timing" japanese="タイミングを入力" mode="inline" />
                </label>
                <input
                  id={fieldId('customTiming')}
                  className="input"
                  value={form.customTiming}
                  onChange={(event) => update('customTiming', event.target.value)}
                />
              </div>
            ) : null}
            <div className="field">
              <label className="field__label" htmlFor={fieldId('indication')}>
                <BilingualText english="Indication" japanese="使用目的" mode="inline" />
              </label>
              <input
                id={fieldId('indication')}
                className="input"
                value={form.indication}
                onChange={(event) => update('indication', event.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label className="field__label" htmlFor={fieldId('prnCondition')}>
                <BilingualText english="Indication" japanese="使用条件" mode="inline" />
              </label>
              <select
                id={fieldId('prnCondition')}
                className="input"
                value={form.prnChoice}
                onChange={(event) => update('prnChoice', event.target.value)}
              >
                <option value="">未選択</option>
                {PRN_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value="その他">その他（自由入力）</option>
              </select>
            </div>
            {form.prnChoice === 'その他' ? (
              <div className="field">
                <label className="field__label" htmlFor={fieldId('customPrn')}>
                  <BilingualText english="Custom Indication" japanese="使用条件を入力" mode="inline" />
                </label>
                <input
                  id={fieldId('customPrn')}
                  className="input"
                  value={form.customPrn}
                  onChange={(event) => update('customPrn', event.target.value)}
                />
              </div>
            ) : null}
            <div className="field">
              <label className="field__label" htmlFor={fieldId('lastAdministeredAt')}>
                <BilingualText
                  english="Last Administered"
                  japanese="前回使用日時"
                  mode="inline"
                />
              </label>
              <input
                id={fieldId('lastAdministeredAt')}
                className="input"
                type="datetime-local"
                value={form.lastAdministeredAt}
                onChange={(event) => update('lastAdministeredAt', event.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={fieldId('memo')}>
          <BilingualText english="Memo" japanese="メモ" mode="inline" />
        </label>
        <textarea
          id={fieldId('memo')}
          className="input textarea"
          rows={2}
          value={form.memo}
          onChange={(event) => update('memo', event.target.value)}
        />
      </div>

      <div className="form-actions">
        <button type="button" className="button button--ghost" onClick={onCancel}>
          <BilingualText english="Cancel" japanese="キャンセル" mode="compact" />
        </button>
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          <BilingualText
            english={isSubmitting ? 'Saving...' : initialMedication ? 'Save' : 'Add Medication'}
            japanese={isSubmitting ? '保存中' : initialMedication ? '保存' : '薬剤を追加'}
            mode="compact"
          />
        </button>
      </div>
    </form>
  );
}

interface MedicationListProps {
  category: MedicationCategory;
  medications: Medication[];
  onEdit: (medication: Medication) => void;
  onDelete: (medication: Medication) => void;
  onAdd: () => void;
}

function MedicationList({ category, medications, onEdit, onDelete, onAdd }: MedicationListProps) {
  const regular = category === 'regular';
  return (
    <section className="medication-group">
      <div className="medication-group__header">
        <div>
          <h3>
            <BilingualText
              english={regular ? 'Regular Medications' : 'PRN Medications'}
              japanese={regular ? '定期薬' : '臨時薬'}
              mode="inline"
            />
          </h3>
          <p>{medications.length} 件</p>
        </div>
        <button type="button" className="button button--secondary button--small" onClick={onAdd}>
          <BilingualText english="Add Medication" japanese="薬剤を追加" mode="compact" />
        </button>
      </div>

      {medications.length === 0 ? (
        <p className="medication-empty">
          <BilingualText
            english="No Medications"
            japanese="登録された薬剤はありません"
            mode="inline"
          />
        </p>
      ) : (
        <ul className="medication-list">
          {medications.map((medication) => (
            <li className="medication-item" key={medication.id}>
              <div className="medication-item__main">
                <strong>{medication.name}</strong>
                <span className="medication-item__dose">
                  {medication.dose} {medication.unit}
                </span>
              </div>
              <dl className="medication-item__details">
                {regular ? (
                  <div>
                    <dt>Timing / 服用タイミング</dt>
                    <dd>{medication.timing || '—'}</dd>
                  </div>
                ) : (
                  <>
                    <div>
                      <dt>Indication / 使用条件</dt>
                      <dd>{medication.indication || '—'}</dd>
                    </div>
                    <div>
                      <dt>Last Administered / 前回使用日時</dt>
                      <dd>{formatDateTime(medication.lastAdministeredAt)}</dd>
                    </div>
                  </>
                )}
                {regular ? (
                  <div>
                    <dt>Indication / 使用目的</dt>
                    <dd>{medication.indication || '—'}</dd>
                  </div>
                ) : null}
                {medication.memo ? (
                  <div>
                    <dt>Memo / メモ</dt>
                    <dd>{medication.memo}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="medication-item__actions">
                <button
                  type="button"
                  className="button button--secondary button--small"
                  onClick={() => onEdit(medication)}
                >
                  <BilingualText english="Edit" japanese="編集" mode="compact" />
                </button>
                <button
                  type="button"
                  className="button button--danger-ghost button--small"
                  onClick={() => onDelete(medication)}
                >
                  <BilingualText english="Delete" japanese="削除" mode="compact" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function MedicationSection({
  medications,
  onAdd,
  onUpdate,
  onDelete,
}: MedicationSectionProps) {
  const [editor, setEditor] = useState<{
    category: MedicationCategory;
    medication?: Medication;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Medication | null>(null);

  const regular = medications.filter((medication) => medication.category === 'regular');
  const prn = medications.filter((medication) => medication.category === 'prn');

  return (
    <>
      <section className="card" id="medications">
        <div className="card__header">
          <h2 className="card__title">
            <BilingualText english="Medications" japanese="薬剤情報" mode="inline" />
          </h2>
          <span className="card__meta">{medications.length} 件</span>
        </div>
        <p className="medication-safety">
          薬剤情報を登録・表示するためのデモ機能です。投与可否、用量、投与間隔などの医療判断は行いません。
        </p>

        {editor ? (
          <MedicationForm
            key={editor.medication?.id ?? editor.category}
            category={editor.category}
            initialMedication={editor.medication}
            onSubmit={(input) => {
              if (editor.medication) onUpdate(editor.medication.id, input);
              else onAdd(input);
              setEditor(null);
            }}
            onCancel={() => setEditor(null)}
          />
        ) : null}

        <div className="medication-groups">
          <MedicationList
            category="regular"
            medications={regular}
            onAdd={() => setEditor({ category: 'regular' })}
            onEdit={(medication) => setEditor({ category: 'regular', medication })}
            onDelete={setPendingDelete}
          />
          <MedicationList
            category="prn"
            medications={prn}
            onAdd={() => setEditor({ category: 'prn' })}
            onEdit={(medication) => setEditor({ category: 'prn', medication })}
            onDelete={setPendingDelete}
          />
        </div>
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete Medication / 薬剤を削除"
        message="この薬剤情報を削除します。元に戻せません。"
        detail={pendingDelete ? `${pendingDelete.name} / ${pendingDelete.dose} ${pendingDelete.unit}` : undefined}
        confirmLabel="Delete / 削除"
        cancelLabel="Cancel / キャンセル"
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

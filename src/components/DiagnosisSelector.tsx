import { useId, useState } from 'react';
import { DIAGNOSIS_TEMPLATES } from '../data/diagnosisTemplates';
import { normalizeText } from '../utils/validation';
import { BilingualText } from './BilingualText';

interface DiagnosisSelectorProps {
  /** 選択済みの疾患名 */
  value: string[];
  /**
   * 選択内容の更新。
   * 連続操作で更新が取りこぼされないよう、現在値を受け取る関数形式で通知する。
   */
  onChange: (update: (current: string[]) => string[]) => void;
}

/** 大文字小文字を無視した重複判定 */
function containsDiagnosis(list: string[], candidate: string): boolean {
  const target = candidate.toLowerCase();
  return list.some((item) => item.toLowerCase() === target);
}

/**
 * 疾患名の選択・追加コンポーネント。
 * テンプレートからの選択と自由入力の両方に対応し、重複と空文字を防止する。
 */
export function DiagnosisSelector({ value, onChange }: DiagnosisSelectorProps) {
  const [customInput, setCustomInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  const addDiagnosis = (raw: string) => {
    const name = normalizeText(raw);
    if (name === '') {
      setError('疾患名を入力してください。');
      return false;
    }
    if (containsDiagnosis(value, name)) {
      setError(`「${name}」は既に追加されています。`);
      return false;
    }
    // 更新直前の値でも重複を確認し、二重追加を確実に防ぐ
    onChange((current) => (containsDiagnosis(current, name) ? current : [...current, name]));
    setError(null);
    return true;
  };

  const handleAddCustom = () => {
    if (addDiagnosis(customInput)) {
      setCustomInput('');
    }
  };

  const handleRemove = (name: string) => {
    onChange((current) => current.filter((item) => item !== name));
    setError(null);
  };

  return (
    <div className="diagnosis-selector">
      <div className="diagnosis-selector__templates">
        <p className="field__label" id={`${inputId}-templates`}>
          <BilingualText
            english="Diagnosis Templates"
            japanese="疾患テンプレート（複数選択できます）"
            mode="inline"
          />
        </p>
        <div className="chip-grid" role="group" aria-labelledby={`${inputId}-templates`}>
          {DIAGNOSIS_TEMPLATES.map((template) => {
            const selected = containsDiagnosis(value, template);
            return (
              <button
                key={template}
                type="button"
                className={`chip${selected ? ' chip--selected' : ''}`}
                aria-pressed={selected}
                disabled={selected}
                onClick={() => addDiagnosis(template)}
              >
                {template}
              </button>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={inputId}>
          <BilingualText
            english="Custom Diagnosis"
            japanese="疾患名を自由入力"
            mode="inline"
          />
        </label>
        <div className="input-row">
          <input
            id={inputId}
            type="text"
            className="input"
            value={customInput}
            placeholder="例：慢性心不全"
            aria-invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => {
              setCustomInput(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              // フォーム全体の送信を防ぎ、Enter で疾患を追加する
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddCustom();
              }
            }}
          />
          <button type="button" className="button button--secondary" onClick={handleAddCustom}>
            <BilingualText english="Add Diagnosis" japanese="疾患を追加" mode="compact" />
          </button>
        </div>
        {error ? (
          <p className="field__error" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="diagnosis-selector__selected">
        <p className="field__label">選択中の疾患</p>
        {value.length === 0 ? (
          <p className="muted-text">まだ疾患が選択されていません。</p>
        ) : (
          <ul className="tag-list">
            {value.map((name) => (
              <li key={name} className="tag">
                <span className="tag__text">{name}</span>
                <button
                  type="button"
                  className="tag__remove"
                  onClick={() => handleRemove(name)}
                  aria-label={`${name} を削除`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

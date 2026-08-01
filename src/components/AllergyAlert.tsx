import { BilingualText } from './BilingualText';

interface AllergyAlertProps {
  allergies: string;
  compact?: boolean;
}

/** 「なし」と明記された値だけを中立表示にする（危険度の解析は行わない） */
function hasRecordedAllergy(value: string): boolean {
  const normalized = value
    .trim()
    .replace(/\s/g, '')
    .replace(/（[^）]*）|\([^)]*\)/g, '');
  if (normalized === '') return false;
  return !['なし', '特記事項なし', '登録なし', '未登録'].includes(normalized);
}

export function AllergyAlert({ allergies, compact = false }: AllergyAlertProps) {
  const warning = hasRecordedAllergy(allergies);
  const display = allergies.trim() || '未登録';

  return (
    <div
      className={`allergy-alert${warning ? ' allergy-alert--warning' : ''}${
        compact ? ' allergy-alert--compact' : ''
      }`}
      role={warning ? 'alert' : 'status'}
    >
      <span className="allergy-alert__icon" aria-hidden="true">
        {warning ? '!' : '—'}
      </span>
      <span className="allergy-alert__content">
        <strong className="allergy-alert__title">
          <BilingualText english="ALLERGIES" japanese="アレルギー" mode="inline" />
        </strong>
        <span className="allergy-alert__value">{display}</span>
      </span>
    </div>
  );
}

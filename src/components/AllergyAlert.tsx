import { BilingualText } from './BilingualText';

interface AllergyAlertProps { allergies: string; compact?: boolean }

function allergyItems(value: string): string[] {
  const normalized = value.trim().replace(/（[^）]*）|\([^)]*\)/g, '');
  if (!normalized || ['なし', '特記事項なし', '登録なし', '未登録'].includes(normalized)) return [];
  return value.split(/[,、\n]/).map((item) => item.trim()).filter(Boolean);
}

export function AllergyAlert({ allergies, compact = false }: AllergyAlertProps) {
  const items = allergyItems(allergies);
  return (
    <div className={`allergy-alert${items.length ? ' allergy-alert--warning' : ' allergy-alert--safe'}${compact ? ' allergy-alert--compact' : ''}`} role={items.length ? 'alert' : 'status'}>
      <span className="allergy-alert__icon" aria-hidden="true">{items.length ? '!' : '✓'}</span>
      <span className="allergy-alert__content">
        <strong className="allergy-alert__title"><BilingualText english="ALLERGIES" japanese="アレルギー" mode="inline" /></strong>
        {items.length ? (
          <span className="allergy-badges">
            {items.map((item) => <span className={`allergy-badge${/latex/i.test(item) ? ' allergy-badge--caution' : ''}`} key={item}><span aria-hidden="true">●</span>{item}</span>)}
          </span>
        ) : <span className="allergy-badge allergy-badge--safe"><span aria-hidden="true">●</span>No Known Allergies</span>}
      </span>
    </div>
  );
}

import { BilingualText } from './BilingualText';
import { parseAllergyItems } from '../domain/allergy';

interface AllergyAlertProps {
  allergies: string;
  compact?: boolean;
}

/** アレルギーの重要表示（登録ありは赤系、なし・未登録は中立表示） */
export function AllergyAlert({ allergies, compact = false }: AllergyAlertProps) {
  const items = parseAllergyItems(allergies);
  const hasItems = items.length > 0;
  const isUnregistered = allergies.trim() === '';

  return (
    <div
      className={`allergy-alert${hasItems ? ' allergy-alert--warning' : ' allergy-alert--safe'}${compact ? ' allergy-alert--compact' : ''}`}
    >
      <span className="allergy-alert__icon" aria-hidden="true">{hasItems ? '!' : '✓'}</span>
      <span className="allergy-alert__content">
        <strong className="allergy-alert__title">
          <BilingualText english="ALLERGIES" japanese="アレルギー" mode="inline" />
        </strong>
        {hasItems ? (
          <span className="allergy-badges">
            <span className="visually-hidden">登録あり:</span>
            {items.map((item) => (
              <span className="allergy-badge" key={item}>
                <span aria-hidden="true">●</span>
                {item}
              </span>
            ))}
          </span>
        ) : (
          <span className="allergy-badge allergy-badge--safe">
            <span aria-hidden="true">●</span>
            {isUnregistered ? 'Not Recorded / 未登録' : 'No Known Allergies / 登録なし'}
          </span>
        )}
      </span>
    </div>
  );
}

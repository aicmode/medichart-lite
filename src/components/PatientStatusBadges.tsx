import type { PatientSnapshot } from '../domain/insights';
import { isSameLocalDay } from '../utils/date';

interface PatientStatusBadgesProps {
  snapshot: PatientSnapshot;
  /** true の場合「本日バイタル未記録」を省略する */
  compact?: boolean;
}

/** 一覧用の状態バッジ（保存データの機械的な集計。医学的な評価ではない） */
export function PatientStatusBadges({ snapshot, compact = false }: PatientStatusBadgesProps) {
  const high = snapshot.openHandovers.filter((handover) => handover.priority === 'high').length;
  const other = snapshot.openHandovers.length - high;
  const noVitalsToday = snapshot.latestVital === null || !isSameLocalDay(snapshot.latestVital.measuredAt);

  const badges: { key: string; modifier: string; label: string }[] = [];
  if (high > 0) badges.push({ key: 'high', modifier: 'high', label: `優先申し送り ${high}` });
  if (other > 0) badges.push({ key: 'open', modifier: 'open', label: `申し送り ${other}` });
  if (snapshot.latestVitalFlags.length > 0) badges.push({ key: 'flag', modifier: 'flag', label: 'デモ閾値外' });
  if (snapshot.hasAllergy) badges.push({ key: 'allergy', modifier: 'allergy', label: 'アレルギー' });
  if (!compact && noVitalsToday) badges.push({ key: 'no-vitals', modifier: 'muted', label: '本日バイタル未記録' });

  if (badges.length === 0) return <span className="status-badge status-badge--ok">表示事項なし</span>;

  return (
    <span className="status-badges">
      {badges.map((badge) => (
        <span key={badge.key} className={`status-badge status-badge--${badge.modifier}`}>
          {badge.label}
        </span>
      ))}
    </span>
  );
}

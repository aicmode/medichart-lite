import type { VitalSign } from '../types';
import { formatDateTime } from '../utils/date';
import { BilingualText } from './BilingualText';

interface VitalTrendProps {
  vitalSigns: VitalSign[];
}

interface Metric {
  key: string;
  english: string;
  japanese: string;
  unit: string;
  value: (vital: VitalSign) => number | null;
}

const METRICS: Metric[] = [
  { key: 'temperature', english: 'Temperature', japanese: '体温', unit: '℃', value: (v) => v.temperature },
  { key: 'systolic', english: 'Systolic BP', japanese: '収縮期血圧', unit: 'mmHg', value: (v) => v.systolic },
  { key: 'diastolic', english: 'Diastolic BP', japanese: '拡張期血圧', unit: 'mmHg', value: (v) => v.diastolic },
  { key: 'pulse', english: 'Pulse', japanese: '脈拍', unit: '回/分', value: (v) => v.pulse },
  { key: 'spo2', english: 'SpO₂', japanese: '酸素飽和度', unit: '%', value: (v) => v.spo2 },
];

/** 追加ライブラリを使わない、数値と日時だけの簡易トレンド */
export function VitalTrend({ vitalSigns }: VitalTrendProps) {
  const chronological = [...vitalSigns]
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
    .slice(-8);

  const series = METRICS.map((metric) => ({
    metric,
    points: chronological
      .map((vital) => ({ value: metric.value(vital), measuredAt: vital.measuredAt }))
      .filter((point): point is { value: number; measuredAt: string } => point.value !== null),
  })).filter((item) => item.points.length >= 2);

  if (series.length === 0) return null;

  return (
    <section className="vital-trends" aria-labelledby="vital-trends-title">
      <div className="vital-trends__header">
        <h3 id="vital-trends-title">
          <BilingualText english="Vital Trends" japanese="バイタル推移" mode="inline" />
        </h3>
        <p>2件以上ある測定項目のみ、日時順に表示しています。</p>
      </div>
      <div className="vital-trends__grid">
        {series.map(({ metric, points }) => {
          const values = points.map((point) => point.value);
          const min = Math.min(...values);
          const max = Math.max(...values);
          const range = max - min;
          const polyline = points
            .map((point, index) => {
              const x = points.length === 1 ? 130 : 12 + (index * 236) / (points.length - 1);
              const y = range === 0 ? 36 : 62 - ((point.value - min) / range) * 48;
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <article className="trend-card" key={metric.key}>
              <h4>
                <BilingualText
                  english={metric.english}
                  japanese={metric.japanese}
                  mode="inline"
                />
              </h4>
              <svg
                className="trend-card__chart"
                viewBox="0 0 260 74"
                role="img"
                aria-label={`${metric.japanese}の推移グラフ`}
              >
                <line x1="12" y1="62" x2="248" y2="62" className="trend-card__axis" />
                <polyline points={polyline} className="trend-card__line" />
                {polyline.split(' ').map((point, index) => {
                  const [cx, cy] = point.split(',');
                  return <circle key={`${cx}-${index}`} cx={cx} cy={cy} r="3.5" />;
                })}
              </svg>
              <ol className="trend-card__values">
                {points.map((point) => (
                  <li key={`${point.measuredAt}-${point.value}`}>
                    <time dateTime={point.measuredAt}>{formatDateTime(point.measuredAt)}</time>
                    <strong>
                      {point.value} {metric.unit}
                    </strong>
                  </li>
                ))}
              </ol>
            </article>
          );
        })}
      </div>
    </section>
  );
}

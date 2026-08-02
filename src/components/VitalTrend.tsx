import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { VitalSign } from '../types';
import { BilingualText } from './BilingualText';

interface VitalTrendProps { vitalSigns: VitalSign[] }

const METRICS = [
  { key: 'temperature', english: 'Temperature', japanese: '体温', unit: '℃', color: '#e05d5d' },
  { key: 'pulse', english: 'Pulse', japanese: '脈拍', unit: '回/分', color: '#8b5cf6' },
  { key: 'spo2', english: 'SpO₂', japanese: '酸素飽和度', unit: '%', color: '#0ea5a8' },
  { key: 'systolic', english: 'Systolic BP', japanese: '収縮期血圧', unit: 'mmHg', color: '#3d90d6' },
  { key: 'diastolic', english: 'Diastolic BP', japanese: '拡張期血圧', unit: 'mmHg', color: '#c9760a' },
] as const;

export function VitalTrend({ vitalSigns }: VitalTrendProps) {
  const chronological = [...vitalSigns]
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
    .slice(-10)
    .map((vital) => ({
      ...vital,
      label: new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(vital.measuredAt)),
    }));

  return (
    <section className="card vital-trends" aria-labelledby="vital-trends-title">
      <div className="card__header">
        <h2 className="card__title" id="vital-trends-title">
          <BilingualText english="Vital Trends" japanese="バイタル推移" mode="inline" />
        </h2>
        <span className="card__meta">直近 {chronological.length} 件</span>
      </div>
      {chronological.length === 0 ? (
        <p className="muted-text">バイタルを登録すると時系列グラフが表示されます。</p>
      ) : (
        <div className="vital-trends__grid">
          {METRICS.map((metric) => (
            <article className="trend-card" key={metric.key}>
              <h3>{metric.english} <span>/ {metric.japanese}</span></h3>
              <div className="trend-card__rechart" aria-label={`${metric.japanese}の折れ線グラフ`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chronological} margin={{ top: 12, right: 8, bottom: 2, left: -20 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} minTickGap={28} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} allowDecimals={metric.key === 'temperature'} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <Tooltip
                      formatter={(value) => [`${String(value)} ${metric.unit}`, metric.japanese]}
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
                    />
                    <Line type="monotone" dataKey={metric.key} stroke={metric.color} strokeWidth={2.5} dot={{ r: 3, fill: metric.color }} activeDot={{ r: 5 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

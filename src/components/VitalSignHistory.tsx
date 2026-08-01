import type { VitalSign } from '../types';
import { EmptyState } from './EmptyState';
import { formatDateTime } from '../utils/date';
import { VITAL_RANGES } from '../utils/validation';

interface VitalSignHistoryProps {
  vitalSigns: VitalSign[];
  onRequestDelete: (vital: VitalSign) => void;
}

/** 数値を単位付きで表示する（未入力は「—」） */
function formatValue(value: number | null, unit: string): string {
  if (value === null) return '—';
  return unit ? `${value} ${unit}` : `${value}`;
}

/** 血圧はまとめて表示する */
function formatBloodPressure(vital: VitalSign): string {
  if (vital.systolic === null && vital.diastolic === null) return '—';
  const systolic = vital.systolic === null ? '—' : vital.systolic;
  const diastolic = vital.diastolic === null ? '—' : vital.diastolic;
  return `${systolic} / ${diastolic} mmHg`;
}

/** 最新バイタルの要約カード */
function LatestVitalCard({ vital }: { vital: VitalSign }) {
  const items = [
    { label: 'Temp', value: formatValue(vital.temperature, VITAL_RANGES.temperature.unit) },
    { label: 'BP', value: formatBloodPressure(vital) },
    { label: 'Pulse', value: formatValue(vital.pulse, VITAL_RANGES.pulse.unit) },
    { label: 'Resp', value: formatValue(vital.respiration, VITAL_RANGES.respiration.unit) },
    { label: 'SpO₂', value: formatValue(vital.spo2, VITAL_RANGES.spo2.unit) },
    { label: 'Pain', value: vital.painScale === null ? '—' : `${vital.painScale} / 10` },
  ];

  return (
    <div className="latest-vital">
      <div className="latest-vital__header">
        <span className="latest-vital__label">Latest Measurement</span>
        <span className="latest-vital__time">{formatDateTime(vital.measuredAt)}</span>
      </div>
      <dl className="latest-vital__grid">
        {items.map((item) => (
          <div className="latest-vital__item" key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      <p className="latest-vital__meta">
        意識レベル：{vital.consciousness || '—'}
        {vital.memo ? ` / メモ：${vital.memo}` : ''}
      </p>
    </div>
  );
}

/** 最新バイタルと履歴の一覧 */
export function VitalSignHistory({ vitalSigns, onRequestDelete }: VitalSignHistoryProps) {
  if (vitalSigns.length === 0) {
    return (
      <EmptyState
        title="No Vital Signs"
        description="この患者のバイタルはまだ登録されていません。上のフォームから追加できます。"
      />
    );
  }

  const [latest, ...history] = vitalSigns;

  return (
    <div className="vital-history">
      <LatestVitalCard vital={latest} />

      <div className="table-scroll">
        <table className="data-table">
          <caption className="data-table__caption">
            測定日時の新しい順に表示しています（{vitalSigns.length}件）。
          </caption>
          <thead>
            <tr>
              <th scope="col">Measured At</th>
              <th scope="col">Temp</th>
              <th scope="col">BP</th>
              <th scope="col">Pulse</th>
              <th scope="col">Resp</th>
              <th scope="col">SpO₂</th>
              <th scope="col">Pain</th>
              <th scope="col">Consciousness</th>
              <th scope="col">Memo</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {vitalSigns.map((vital) => (
              <tr key={vital.id}>
                <td data-label="Measured At">{formatDateTime(vital.measuredAt)}</td>
                <td data-label="Temp">{formatValue(vital.temperature, '℃')}</td>
                <td data-label="BP">{formatBloodPressure(vital)}</td>
                <td data-label="Pulse">{formatValue(vital.pulse, '')}</td>
                <td data-label="Resp">{formatValue(vital.respiration, '')}</td>
                <td data-label="SpO₂">{formatValue(vital.spo2, '%')}</td>
                <td data-label="Pain">{vital.painScale === null ? '—' : vital.painScale}</td>
                <td data-label="Consciousness">{vital.consciousness || '—'}</td>
                <td data-label="Memo">{vital.memo || '—'}</td>
                <td data-label="Actions">
                  <button
                    type="button"
                    className="button button--danger-ghost button--small"
                    onClick={() => onRequestDelete(vital)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {history.length === 0 ? (
        <p className="muted-text">過去の記録は、2件目以降を登録すると履歴として蓄積されます。</p>
      ) : null}
    </div>
  );
}

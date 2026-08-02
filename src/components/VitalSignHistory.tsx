import type { VitalSign } from '../types';
import { EmptyState } from './EmptyState';
import { formatDateTime } from '../utils/date';
import { VITAL_RANGES } from '../utils/validation';
import { BilingualText } from './BilingualText';

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
    { label: 'Temp / 体温', value: formatValue(vital.temperature, VITAL_RANGES.temperature.unit) },
    { label: 'BP / 血圧', value: formatBloodPressure(vital) },
    { label: 'Pulse / 脈拍', value: formatValue(vital.pulse, VITAL_RANGES.pulse.unit) },
    { label: 'Resp / 呼吸数', value: formatValue(vital.respiration, VITAL_RANGES.respiration.unit) },
    { label: 'SpO₂ / 酸素飽和度', value: formatValue(vital.spo2, VITAL_RANGES.spo2.unit) },
    { label: 'Pain / 疼痛', value: vital.painScale === null ? '—' : `${vital.painScale} / 10` },
  ];

  return (
    <div className="latest-vital">
      <div className="latest-vital__header">
        <span className="latest-vital__label">
          <BilingualText english="Latest Measurement" japanese="最新測定" mode="inline" />
        </span>
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
        title="No Vital Signs / バイタル未登録"
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
              <th scope="col">Measured At / 測定日時</th>
              <th scope="col">Temp / 体温</th>
              <th scope="col">BP / 血圧</th>
              <th scope="col">Pulse / 脈拍</th>
              <th scope="col">Resp / 呼吸数</th>
              <th scope="col">SpO₂ / 酸素飽和度</th>
              <th scope="col">Pain / 疼痛</th>
              <th scope="col">Consciousness / 意識</th>
              <th scope="col">Memo / メモ</th>
              <th scope="col">
                <span className="visually-hidden">Actions / 操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {vitalSigns.map((vital) => (
              <tr key={vital.id}>
                <td data-label="Measured At / 測定日時">{formatDateTime(vital.measuredAt)}</td>
                <td data-label="Temp / 体温">{formatValue(vital.temperature, '℃')}</td>
                <td data-label="BP / 血圧">{formatBloodPressure(vital)}</td>
                <td data-label="Pulse / 脈拍">{formatValue(vital.pulse, '')}</td>
                <td data-label="Resp / 呼吸数">{formatValue(vital.respiration, '')}</td>
                <td data-label="SpO₂ / 酸素飽和度">{formatValue(vital.spo2, '%')}</td>
                <td data-label="Pain / 疼痛">{vital.painScale === null ? '—' : vital.painScale}</td>
                <td data-label="Consciousness / 意識">{vital.consciousness || '—'}</td>
                <td data-label="Memo / メモ">{vital.memo || '—'}</td>
                <td data-label="Actions / 操作">
                  <button
                    type="button"
                    className="button button--danger-ghost button--small"
                    onClick={() => onRequestDelete(vital)}
                  >
                    <BilingualText english="Delete" japanese="削除" mode="compact" />
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

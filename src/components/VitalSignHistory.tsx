import type { VitalSign } from '../types';
import { formatDateTime } from '../utils/date';
import { BilingualText } from './BilingualText';
import { compareWithDemoThreshold, getVitalFlags } from '../domain/vitalFlags';
import type { FlaggableVital } from '../domain/vitalFlags';
import { formatBloodPressure, formatVitalValue } from '../domain/vitalFormat';

interface VitalSignHistoryProps {
  /** 測定日時の新しい順 */
  vitalSigns: VitalSign[];
  onRequestEdit: (vital: VitalSign) => void;
  onRequestDelete: (vital: VitalSign) => void;
}

/** デモ閾値外の値に矢印と読み上げ用の補足を付ける */
function FlaggedValue({ metric, value, text }: { metric: FlaggableVital; value: number | null; text: string }) {
  const direction = compareWithDemoThreshold(metric, value);
  if (direction === null) return <>{text}</>;
  return (
    <span className={`vital-value vital-value--${direction}`}>
      {text}
      <span aria-hidden="true"> {direction === 'high' ? '↑' : '↓'}</span>
      <span className="visually-hidden">（デモ閾値外）</span>
    </span>
  );
}

function BloodPressureValue({ vital }: { vital: VitalSign }) {
  const flagged =
    compareWithDemoThreshold('systolic', vital.systolic) ?? compareWithDemoThreshold('diastolic', vital.diastolic);
  const text = formatBloodPressure(vital);
  if (flagged === null) return <>{text}</>;
  return (
    <span className={`vital-value vital-value--${flagged}`}>
      {text}
      <span aria-hidden="true"> {flagged === 'high' ? '↑' : '↓'}</span>
      <span className="visually-hidden">（デモ閾値外）</span>
    </span>
  );
}

/** 最新バイタルの要約カード（Overview でも再利用する） */
export function LatestVitalCard({ vital }: { vital: VitalSign }) {
  const flags = getVitalFlags(vital);
  const items = [
    { label: 'BT', ja: '体温', node: <FlaggedValue metric="temperature" value={vital.temperature} text={formatVitalValue(vital.temperature, '℃')} /> },
    { label: 'BP', ja: '血圧', node: <><BloodPressureValue vital={vital} /><small> mmHg</small></> },
    { label: 'HR', ja: '脈拍', node: <FlaggedValue metric="pulse" value={vital.pulse} text={formatVitalValue(vital.pulse, '/min')} /> },
    { label: 'RR', ja: '呼吸数', node: <FlaggedValue metric="respiration" value={vital.respiration} text={formatVitalValue(vital.respiration, '/min')} /> },
    { label: 'SpO₂', ja: '酸素飽和度', node: <FlaggedValue metric="spo2" value={vital.spo2} text={formatVitalValue(vital.spo2, '%')} /> },
    { label: 'Pain', ja: '疼痛', node: <>{vital.painScale === null ? '—' : `${vital.painScale} / 10`}</> },
  ];

  return (
    <div className="latest-vital">
      <div className="latest-vital__header">
        <span className="latest-vital__label">
          <BilingualText english="Latest Measurement" japanese="最新測定" mode="inline" />
        </span>
        <time className="latest-vital__time" dateTime={vital.measuredAt}>
          {formatDateTime(vital.measuredAt)}
        </time>
      </div>
      <dl className="latest-vital__grid">
        {items.map((item) => (
          <div className="latest-vital__item" key={item.label}>
            <dt>
              {item.label} <span>{item.ja}</span>
            </dt>
            <dd>{item.node}</dd>
          </div>
        ))}
      </dl>
      <p className="latest-vital__meta">
        意識状態：{vital.consciousness || '—'}
        {vital.memo ? ` / 備考：${vital.memo}` : ''}
      </p>
      {flags.length > 0 ? (
        <p className="demo-flag-line">
          <span className="demo-flag-line__label">デモ閾値外（参考表示・判定ではありません）</span>
          {flags.map((flag) => (
            <span className={`vital-flag vital-flag--${flag.direction}`} key={flag.metric}>
              {flag.label}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

/** バイタル履歴の一覧（新しい順） */
export function VitalSignHistory({ vitalSigns, onRequestEdit, onRequestDelete }: VitalSignHistoryProps) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <caption className="data-table__caption">
          測定日時の新しい順に表示しています（{vitalSigns.length}件）。↑↓はデモ閾値外の参考表示です。
        </caption>
        <thead>
          <tr>
            <th scope="col">Measured At / 測定日時</th>
            <th scope="col">BT / 体温</th>
            <th scope="col">BP / 血圧</th>
            <th scope="col">HR / 脈拍</th>
            <th scope="col">RR / 呼吸数</th>
            <th scope="col">SpO₂</th>
            <th scope="col">Pain / 疼痛</th>
            <th scope="col">Consciousness / 意識</th>
            <th scope="col">Memo / 備考</th>
            <th scope="col">
              <span className="visually-hidden">Actions / 操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {vitalSigns.map((vital) => (
            <tr key={vital.id}>
              <td data-label="Measured At / 測定日時">
                <time dateTime={vital.measuredAt}>{formatDateTime(vital.measuredAt)}</time>
              </td>
              <td data-label="BT / 体温">
                <FlaggedValue metric="temperature" value={vital.temperature} text={formatVitalValue(vital.temperature, '℃')} />
              </td>
              <td data-label="BP / 血圧">
                <BloodPressureValue vital={vital} />
              </td>
              <td data-label="HR / 脈拍">
                <FlaggedValue metric="pulse" value={vital.pulse} text={formatVitalValue(vital.pulse)} />
              </td>
              <td data-label="RR / 呼吸数">
                <FlaggedValue metric="respiration" value={vital.respiration} text={formatVitalValue(vital.respiration)} />
              </td>
              <td data-label="SpO₂">
                <FlaggedValue metric="spo2" value={vital.spo2} text={formatVitalValue(vital.spo2, '%')} />
              </td>
              <td data-label="Pain / 疼痛">{vital.painScale === null ? '—' : vital.painScale}</td>
              <td data-label="Consciousness / 意識">{vital.consciousness || '—'}</td>
              <td data-label="Memo / 備考">{vital.memo || '—'}</td>
              <td data-label="Actions / 操作">
                <div className="item-actions">
                  <button type="button" className="button button--secondary button--small" onClick={() => onRequestEdit(vital)}>
                    <BilingualText english="Edit" japanese="編集" mode="compact" />
                  </button>
                  <button type="button" className="button button--danger-ghost button--small" onClick={() => onRequestDelete(vital)}>
                    <BilingualText english="Delete" japanese="削除" mode="compact" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

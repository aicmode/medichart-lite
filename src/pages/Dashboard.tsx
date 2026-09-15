import { useMemo, useState } from 'react';
import type { AppData, Patient, PatientTab } from '../types';
import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { BilingualText } from '../components/BilingualText';
import { PatientAvatar } from '../components/PatientAvatar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  buildAttentionItems,
  buildPatientSnapshots,
  countTodayRecords,
  groupByRoom,
} from '../domain/insights';
import { formatVitalSummary } from '../domain/vitalFormat';
import { DEMO_THRESHOLD_NOTICE } from '../domain/vitalFlags';
import { recordTypeLabel } from '../data/options';
import { isDemoPatientId } from '../data/sampleData';
import { calculateAge, formatAge, formatDate, formatDateTime, formatRelativeTime, todayDateValue } from '../utils/date';
import { patientHash } from '../utils/route';

interface DashboardProps {
  data: AppData;
  /** 更新日時の新しい順 */
  patients: Patient[];
  onGenerateDemoData: () => void;
}

const ATTENTION_PREVIEW = 8;

function StatCard({ icon, label, value, description }: { icon: string; label: string; value: string; description: string }) {
  return (
    <div className="stat-card">
      <span className="stat-card__icon" aria-hidden="true">{icon}</span>
      <div>
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        <p className="stat-card__description">{description}</p>
      </div>
    </div>
  );
}

interface MiniListItem {
  patient: Patient;
  meta: string;
  sub?: string;
  tab?: PatientTab;
}

function PatientMiniList({ english, japanese, subtitle, items }: { english: string; japanese: string; subtitle: string; items: MiniListItem[] }) {
  return (
    <section className="card dashboard-panel">
      <div className="card__header">
        <h2 className="card__title">
          <BilingualText english={english} japanese={japanese} mode="inline" />
        </h2>
        <span className="card__meta">{subtitle}</span>
      </div>
      {items.length === 0 ? (
        <p className="muted-text">表示できる患者はいません。</p>
      ) : (
        <ul className="dashboard-patient-list">
          {items.map(({ patient, meta, sub, tab }) => (
            <li key={patient.id}>
              <a href={patientHash(patient.id, tab)}>
                <PatientAvatar name={patient.name} gender={patient.gender} size="small" decorative />
                <span>
                  <strong>{patient.name}</strong>
                  <small>
                    {patient.patientId} · {formatAge(patient.dateOfBirth)}
                    {patient.room ? ` · 病室 ${patient.room}` : ''}
                  </small>
                  {sub ? <small className="dashboard-patient-list__sub">{sub}</small> : null}
                </span>
                <time>{meta}</time>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Dashboard: 「今日確認すべき情報」を上から順に配置する */
export function Dashboard({ data, patients, onGenerateDemoData }: DashboardProps) {
  const [showAllAttention, setShowAllAttention] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);

  const view = useMemo(() => {
    const now = new Date();
    const snapshots = buildPatientSnapshots(data);
    const patientById = new Map(data.patients.map((patient) => [patient.id, patient]));
    const ages = data.patients.map((patient) => calculateAge(patient.dateOfBirth)).filter((age): age is number => age !== null);

    const activity = [
      ...data.nursingNotes.map((note) => ({
        id: note.id,
        at: note.recordedAt,
        patientId: note.patientId,
        label: recordTypeLabel(note.recordType),
        text: note.body,
        tab: 'records' as const,
      })),
      ...data.soapRecords.map((soap) => ({
        id: soap.id,
        at: soap.recordedAt,
        patientId: soap.patientId,
        label: 'SOAP',
        text: soap.problem || soap.subjective || soap.objective,
        tab: 'soap' as const,
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 6);

    const latestVitals = [...snapshots.values()]
      .filter((snapshot) => snapshot.latestVital !== null)
      .sort((a, b) => new Date(b.latestVital?.measuredAt ?? 0).getTime() - new Date(a.latestVital?.measuredAt ?? 0).getTime())
      .slice(0, 4);

    return {
      snapshots,
      patientById,
      attention: buildAttentionItems(snapshots, now),
      today: countTodayRecords(data, now),
      openHandovers: data.handovers.filter((handover) => handover.status === 'open').length,
      rooms: groupByRoom(snapshots.values()),
      activity,
      latestVitals,
      male: data.patients.filter((patient) => patient.gender === 'male').length,
      female: data.patients.filter((patient) => patient.gender === 'female').length,
      otherGender: data.patients.filter((patient) => patient.gender === 'other' || patient.gender === 'undisclosed').length,
      averageAge: ages.length ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : null,
      diagnosisCount: data.patients.reduce((count, patient) => count + patient.diagnoses.length, 0),
      demoCount: data.patients.filter((patient) => isDemoPatientId(patient.patientId)).length,
    };
  }, [data]);

  const recentlyRegistered = [...data.patients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const handleDemoClick = () => {
    if (view.demoCount > 0) setConfirmDemo(true);
    else onGenerateDemoData();
  };

  const visibleAttention = showAllAttention ? view.attention : view.attention.slice(0, ATTENTION_PREVIEW);
  const hasVitalFlags = view.attention.some((item) => item.kind === 'vital-flag');

  const headerActions = (
    <>
      <button type="button" className="button button--secondary" onClick={handleDemoClick}>
        <span aria-hidden="true">✦</span>
        <BilingualText english="Generate Demo Data" japanese="デモデータ生成" mode="compact" />
      </button>
      <a className="button button--primary" href="#/patients/new">
        <BilingualText english="New Patient" japanese="患者登録" mode="compact" />
      </a>
    </>
  );

  return (
    <div className="page">
      <Header
        title="Dashboard"
        titleJapanese="ダッシュボード"
        description="本日確認すべき情報を上から順に表示します。すべて架空データの集計で、医学的な評価は行いません。"
        actions={headerActions}
      />

      {patients.length === 0 ? (
        <EmptyState
          title="No Patients Yet / 患者未登録"
          description="患者を登録するか、デモデータを生成すると、本日の状況・要確認リスト・病室情報が表示されます。"
          action={<div className="button-row">{headerActions}</div>}
        />
      ) : (
        <>
          <section className="today-strip" aria-labelledby="today-title">
            <div className="today-strip__date">
              <h2 id="today-title">
                <BilingualText english="Today" japanese="本日の状況" mode="stacked" />
              </h2>
              <p>{formatDate(todayDateValue())}</p>
            </div>
            <dl className="today-strip__stats">
              <div><dt>本日の記録</dt><dd>{view.today.total}</dd></div>
              <div><dt>バイタル</dt><dd>{view.today.vitals}</dd></div>
              <div><dt>経過記録</dt><dd>{view.today.records}</dd></div>
              <div><dt>SOAP</dt><dd>{view.today.soap}</dd></div>
              <div><dt>申し送り</dt><dd>{view.today.handovers}</dd></div>
              <div className={view.openHandovers > 0 ? 'today-strip__stat--alert' : undefined}>
                <dt>未確認の申し送り</dt>
                <dd>{view.openHandovers}</dd>
              </div>
            </dl>
          </section>

          <div className="dashboard-main">
            <section className="card" aria-labelledby="attention-title">
              <div className="card__header">
                <h2 className="card__title" id="attention-title">
                  <BilingualText english="Needs Attention" japanese="要確認" mode="inline" />
                </h2>
                <span className="card__meta">{view.attention.length} 件</span>
              </div>
              <p className="card__description">
                保存データから機械的に抽出した確認リストです。並び順は業務上の確認順で、医学的な緊急度ではありません。
              </p>
              {view.attention.length === 0 ? (
                <p className="muted-text">要確認の項目はありません。</p>
              ) : (
                <ul className="attention-list">
                  {visibleAttention.map((item) => (
                    <li key={item.key}>
                      <a className={`attention-item attention-item--${item.kind}`} href={patientHash(item.patient.id, item.tab)}>
                        <span className="attention-item__room">
                          <span className="visually-hidden">病室 </span>
                          {item.patient.room || '—'}
                        </span>
                        <span className="attention-item__main">
                          <strong>{item.patient.name}</strong>
                          <span>{item.japanese}</span>
                          <small>{item.detail}</small>
                        </span>
                        <span className="attention-item__kind" lang="en">{item.english}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {view.attention.length > ATTENTION_PREVIEW ? (
                <div className="card__footer">
                  <button
                    type="button"
                    className="button button--ghost button--small"
                    aria-expanded={showAllAttention}
                    onClick={() => setShowAllAttention((current) => !current)}
                  >
                    {showAllAttention ? '先頭のみ表示' : `すべて表示（残り ${view.attention.length - ATTENTION_PREVIEW} 件）`}
                  </button>
                </div>
              ) : null}
              {hasVitalFlags ? <p className="demo-notice demo-notice--small">{DEMO_THRESHOLD_NOTICE}</p> : null}
            </section>

            <section className="card" aria-labelledby="room-title">
              <div className="card__header">
                <h2 className="card__title" id="room-title">
                  <BilingualText english="Room Board" japanese="病室情報" mode="inline" />
                </h2>
                <span className="card__meta">{view.rooms.length} 室</span>
              </div>
              <ul className="room-grid">
                {view.rooms.map((group) => (
                  <li className="room-tile" key={group.room || 'unassigned'}>
                    <p className="room-tile__number">{group.room || '病室未登録'}</p>
                    <ul>
                      {group.snapshots.map((snapshot) => (
                        <li key={snapshot.patient.id}>
                          <a className="room-tile__patient" href={patientHash(snapshot.patient.id)}>
                            <span>{snapshot.patient.name}</span>
                            <span className="room-tile__badges">
                              {snapshot.hasAllergy ? <span className="mini-badge mini-badge--danger">アレルギー</span> : null}
                              {snapshot.latestVitalFlags.length > 0 ? <span className="mini-badge mini-badge--danger">閾値外</span> : null}
                              {snapshot.openHandovers.length > 0 ? (
                                <span className="mini-badge mini-badge--caution">申し送り {snapshot.openHandovers.length}</span>
                              ) : null}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="stat-grid stat-grid--compact" aria-label="患者統計">
            <StatCard icon="👥" label="Patients / 登録患者数" value={`${data.patients.length}`} description="架空患者" />
            <StatCard icon="♂" label="Male / 男性" value={`${view.male}`} description="登録患者" />
            <StatCard icon="♀" label="Female / 女性" value={`${view.female}`} description="登録患者" />
            <StatCard icon="◇" label="Other / その他・未回答" value={`${view.otherGender}`} description="登録患者" />
            <StatCard icon="◷" label="Average Age / 平均年齢" value={view.averageAge === null ? '—' : `${view.averageAge}歳`} description="生年月日登録済み" />
            <StatCard icon="＋" label="Diagnoses / 疾患件数" value={`${view.diagnosisCount}`} description="登録疾患の合計" />
          </section>

          <div className="dashboard-grid">
            <section className="card dashboard-panel" aria-labelledby="activity-title">
              <div className="card__header">
                <h2 className="card__title" id="activity-title">
                  <BilingualText english="Recent Records & SOAP" japanese="最近の看護記録・SOAP" mode="inline" />
                </h2>
                <span className="card__meta">記録日時順</span>
              </div>
              {view.activity.length === 0 ? (
                <p className="muted-text">記録はまだありません。</p>
              ) : (
                <ul className="activity-list">
                  {view.activity.map((item) => {
                    const patient = view.patientById.get(item.patientId);
                    if (!patient) return null;
                    return (
                      <li key={item.id}>
                        <a className="activity-item" href={patientHash(patient.id, item.tab)}>
                          <span className="badge">{item.label}</span>
                          <span className="activity-item__main">
                            <strong>{patient.name}</strong>
                            <span>{item.text}</span>
                          </span>
                          <time dateTime={item.at}>{formatRelativeTime(item.at)}</time>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <PatientMiniList
              english="Latest Vitals"
              japanese="最新バイタル"
              subtitle="測定日時順"
              items={view.latestVitals.map((snapshot) => ({
                patient: snapshot.patient,
                meta: formatDateTime(snapshot.latestVital?.measuredAt ?? ''),
                sub: snapshot.latestVital ? formatVitalSummary(snapshot.latestVital) : undefined,
                tab: 'vitals',
              }))}
            />
            <PatientMiniList
              english="Recently Registered"
              japanese="最近登録患者"
              subtitle="登録日時順"
              items={recentlyRegistered.map((patient) => ({ patient, meta: formatDateTime(patient.createdAt) }))}
            />
            <PatientMiniList
              english="Recently Updated"
              japanese="最近更新患者"
              subtitle="更新日時順"
              items={patients.slice(0, 4).map((patient) => ({ patient, meta: formatDateTime(patient.updatedAt) }))}
            />
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmDemo}
        title="Regenerate Demo Data / デモデータを再生成"
        message="既存の Demo Data（患者IDが DEMO- で始まる患者）と、その患者に追加した記録を削除して作り直します。DEMO- 以外の患者には影響しません。"
        detail={`対象：DEMO- 患者 ${view.demoCount} 名`}
        confirmLabel="Regenerate / 再生成"
        cancelLabel="Cancel / キャンセル"
        onConfirm={() => {
          setConfirmDemo(false);
          onGenerateDemoData();
        }}
        onCancel={() => setConfirmDemo(false)}
      />
    </div>
  );
}

import { useMemo } from 'react';
import type { AppData, Patient, Route } from '../types';
import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { formatAge, formatDateTime, isSameLocalDay } from '../utils/date';

interface DashboardProps {
  data: AppData;
  /** 更新日時の新しい順に並んだ患者一覧 */
  patients: Patient[];
  onNavigate: (route: Route) => void;
}

interface StatCardProps {
  label: string;
  value: string;
  description: string;
  /** 日時のような長い値を小さめに表示する */
  compact?: boolean;
}

function StatCard({ label, value, description, compact = false }: StatCardProps) {
  return (
    <div className="stat-card">
      <p className="stat-card__label">{label}</p>
      <p className={`stat-card__value${compact ? ' stat-card__value--compact' : ''}`}>{value}</p>
      <p className="stat-card__description">{description}</p>
    </div>
  );
}

/** Dashboard 画面 */
export function Dashboard({ data, patients, onNavigate }: DashboardProps) {
  const stats = useMemo(() => {
    const today = new Date();

    // 本日の記録件数（バイタル + 看護記録）
    const todayRecords =
      data.vitalSigns.filter((vital) => isSameLocalDay(vital.measuredAt, today)).length +
      data.nursingNotes.filter((note) => isSameLocalDay(note.recordedAt, today)).length;

    // 登録されている疾患の種類数
    const diagnosisSet = new Set<string>();
    for (const patient of data.patients) {
      for (const diagnosis of patient.diagnoses) {
        diagnosisSet.add(diagnosis);
      }
    }

    // 最新の記録日時
    const timestamps: number[] = [
      ...data.vitalSigns.map((vital) => new Date(vital.measuredAt).getTime()),
      ...data.nursingNotes.map((note) => new Date(note.recordedAt).getTime()),
    ].filter((time) => Number.isFinite(time));

    const latest = timestamps.length > 0 ? Math.max(...timestamps) : null;

    return {
      patientCount: data.patients.length,
      todayRecords,
      diagnosisCount: diagnosisSet.size,
      latestRecordAt: latest === null ? null : new Date(latest).toISOString(),
    };
  }, [data]);

  const recentPatients = patients.slice(0, 5);

  return (
    <div className="page">
      <Header
        title="Dashboard"
        description="登録状況の概要です。すべて架空データのデモ表示であり、医療的な判断は行いません。"
        actions={
          <button
            type="button"
            className="button button--primary"
            onClick={() => onNavigate({ name: 'new-patient' })}
          >
            New Patient
          </button>
        }
      />

      <section className="stat-grid" aria-label="Summary">
        <StatCard
          label="Patients"
          value={`${stats.patientCount}`}
          description="登録されている患者数"
        />
        <StatCard
          label="Today's Records"
          value={`${stats.todayRecords}`}
          description="本日のバイタル・看護記録の合計件数"
        />
        <StatCard
          label="Diagnoses"
          value={`${stats.diagnosisCount}`}
          description="登録されている疾患名の種類数"
        />
        <StatCard
          label="Last Record"
          value={stats.latestRecordAt === null ? '—' : formatDateTime(stats.latestRecordAt)}
          description="最新の記録日時"
          compact
        />
      </section>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Recently Updated Patients</h2>
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={() => onNavigate({ name: 'patients' })}
          >
            View All
          </button>
        </div>

        {recentPatients.length === 0 ? (
          <EmptyState
            title="No Patients Yet"
            description="患者がまだ登録されていません。New Patient から架空の患者を登録してください。"
            action={
              <button
                type="button"
                className="button button--primary"
                onClick={() => onNavigate({ name: 'new-patient' })}
              >
                New Patient
              </button>
            }
          />
        ) : (
          <ul className="recent-list">
            {recentPatients.map((patient) => (
              <li key={patient.id}>
                <button
                  type="button"
                  className="recent-item"
                  onClick={() =>
                    onNavigate({ name: 'patient-detail', patientId: patient.id })
                  }
                >
                  <span className="recent-item__main">
                    <span className="recent-item__id">{patient.patientId}</span>
                    <span className="recent-item__name">{patient.name}</span>
                    <span className="recent-item__sub">
                      {formatAge(patient.dateOfBirth)}
                      {patient.room ? ` / 病室 ${patient.room}` : ''}
                    </span>
                  </span>
                  <span className="recent-item__time">
                    更新：{formatDateTime(patient.updatedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

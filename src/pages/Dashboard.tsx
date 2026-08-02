import { useMemo } from 'react';
import type { AppData, Patient, Route } from '../types';
import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { calculateAge, formatAge, formatDateTime } from '../utils/date';
import { BilingualText } from '../components/BilingualText';
import { PatientAvatar } from '../components/PatientAvatar';

interface DashboardProps {
  data: AppData;
  patients: Patient[];
  onNavigate: (route: Route) => void;
  onGenerateDemoData: () => void;
}

function StatCard({ icon, label, value, description }: { icon: string; label: string; value: string; description: string }) {
  return <div className="stat-card fade-in"><span className="stat-card__icon" aria-hidden="true">{icon}</span><div><p className="stat-card__label">{label}</p><p className="stat-card__value">{value}</p><p className="stat-card__description">{description}</p></div></div>;
}

function PatientMiniList({ title, subtitle, patients, onNavigate, meta }: { title: string; subtitle: string; patients: Patient[]; onNavigate: (route: Route) => void; meta: (patient: Patient) => string }) {
  return (
    <section className="card dashboard-panel fade-in">
      <div className="card__header"><h2 className="card__title">{title}</h2><span className="card__meta">{subtitle}</span></div>
      {patients.length === 0 ? <p className="muted-text">表示できる患者はいません。</p> : (
        <ul className="dashboard-patient-list">
          {patients.map((patient) => <li key={patient.id}><button type="button" onClick={() => onNavigate({ name: 'patient-detail', patientId: patient.id })}><PatientAvatar name={patient.name} gender={patient.gender} size="small" /><span><strong>{patient.name}</strong><small>{patient.patientId} · {formatAge(patient.dateOfBirth)}</small></span><time>{meta(patient)}</time></button></li>)}
        </ul>
      )}
    </section>
  );
}

export function Dashboard({ data, patients, onNavigate, onGenerateDemoData }: DashboardProps) {
  const stats = useMemo(() => {
    const ages = data.patients.map((patient) => calculateAge(patient.dateOfBirth)).filter((age): age is number => age !== null);
    const latestVitalByPatient = new Map<string, number>();
    data.vitalSigns.forEach((vital) => {
      const time = new Date(vital.measuredAt).getTime();
      latestVitalByPatient.set(vital.patientId, Math.max(latestVitalByPatient.get(vital.patientId) ?? 0, time));
    });
    const latestVitalPatients = [...data.patients].filter((patient) => latestVitalByPatient.has(patient.id)).sort((a, b) => (latestVitalByPatient.get(b.id) ?? 0) - (latestVitalByPatient.get(a.id) ?? 0)).slice(0, 4);
    return {
      male: data.patients.filter((patient) => patient.gender === 'male').length,
      female: data.patients.filter((patient) => patient.gender === 'female').length,
      averageAge: ages.length ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : null,
      diagnosisCount: data.patients.reduce((count, patient) => count + patient.diagnoses.length, 0),
      latestVitalByPatient,
      latestVitalPatients,
    };
  }, [data]);

  const recentlyRegistered = [...data.patients].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);
  const recentlyUpdated = patients.slice(0, 4);

  return (
    <div className="page">
      <Header title="Dashboard" titleJapanese="ダッシュボード" description="患者・記録の動きをひと目で把握できる、デモ用クリニカルダッシュボードです。" actions={<><button type="button" className="button button--secondary" onClick={onGenerateDemoData}><span aria-hidden="true">✦</span><BilingualText english="Generate Demo Data" japanese="デモデータ生成" mode="compact" /></button><button type="button" className="button button--primary" onClick={() => onNavigate({ name: 'new-patient' })}><BilingualText english="New Patient" japanese="患者登録" mode="compact" /></button></>} />

      <section className="stat-grid" aria-label="患者統計">
        <StatCard icon="♂" label="Male / 男性" value={`${stats.male}`} description="登録患者" />
        <StatCard icon="♀" label="Female / 女性" value={`${stats.female}`} description="登録患者" />
        <StatCard icon="◷" label="Average Age / 平均年齢" value={stats.averageAge === null ? '—' : `${stats.averageAge}歳`} description="生年月日登録済み患者" />
        <StatCard icon="＋" label="Diagnoses / 疾患件数" value={`${stats.diagnosisCount}`} description="登録された疾患の合計" />
      </section>

      {patients.length === 0 ? <EmptyState title="No Patients Yet / 患者未登録" description="患者を登録するか、デモデータを生成してください。" /> : (
        <div className="dashboard-grid">
          <PatientMiniList title="Latest Vitals / 最新バイタル患者" subtitle="測定日時順" patients={stats.latestVitalPatients} onNavigate={onNavigate} meta={(patient) => formatDateTime(new Date(stats.latestVitalByPatient.get(patient.id) ?? 0).toISOString())} />
          <PatientMiniList title="Recently Registered / 最近登録患者" subtitle="登録日時順" patients={recentlyRegistered} onNavigate={onNavigate} meta={(patient) => formatDateTime(patient.createdAt)} />
          <PatientMiniList title="Recently Updated / 最近更新患者" subtitle="更新日時順" patients={recentlyUpdated} onNavigate={onNavigate} meta={(patient) => formatDateTime(patient.updatedAt)} />
        </div>
      )}
    </div>
  );
}

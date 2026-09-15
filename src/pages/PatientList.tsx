import { useId, useMemo, useState } from 'react';
import type { AppData, Gender, Patient } from '../types';
import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { BilingualText } from '../components/BilingualText';
import { PatientAvatar } from '../components/PatientAvatar';
import { PatientStatusBadges } from '../components/PatientStatusBadges';
import { GENDER_OPTIONS, genderLabel } from '../data/options';
import { buildPatientSnapshots } from '../domain/insights';
import type { PatientSnapshot } from '../domain/insights';
import { calculateAge, formatAge, formatDateTime, formatRelativeTime, isSameLocalDay } from '../utils/date';
import { normalizeForSearch } from '../utils/validation';
import { patientHash } from '../utils/route';

interface PatientListProps {
  data: AppData;
  /** 更新日時の新しい順 */
  patients: Patient[];
}

type SortKey = 'updated' | 'created' | 'patientId' | 'name' | 'room' | 'age';
type StatusFilter = 'all' | 'handover' | 'flag' | 'allergy' | 'no-vitals';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'updated', label: '更新日時（新しい順）' },
  { value: 'created', label: '登録日時（新しい順）' },
  { value: 'room', label: '病室順' },
  { value: 'patientId', label: '患者ID順' },
  { value: 'name', label: '氏名順' },
  { value: 'age', label: '年齢（高い順）' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'handover', label: '未確認の申し送りあり' },
  { value: 'flag', label: '最新バイタルにデモ閾値外' },
  { value: 'allergy', label: 'アレルギー登録あり' },
  { value: 'no-vitals', label: '本日バイタル未記録' },
];

interface Filters {
  keyword: string;
  room: string;
  gender: Gender | 'all';
  diagnosis: string;
  status: StatusFilter;
  sort: SortKey;
}

const DEFAULT_FILTERS: Filters = { keyword: '', room: 'all', gender: 'all', diagnosis: 'all', status: 'all', sort: 'updated' };

function matchesStatus(snapshot: PatientSnapshot, status: StatusFilter): boolean {
  switch (status) {
    case 'all':
      return true;
    case 'handover':
      return snapshot.openHandovers.length > 0;
    case 'flag':
      return snapshot.latestVitalFlags.length > 0;
    case 'allergy':
      return snapshot.hasAllergy;
    case 'no-vitals':
      return snapshot.latestVital === null || !isSameLocalDay(snapshot.latestVital.measuredAt);
  }
}

function compareBy(sort: SortKey): (a: Patient, b: Patient) => number {
  const time = (iso: string) => new Date(iso).getTime();
  switch (sort) {
    case 'updated':
      return (a, b) => time(b.updatedAt) - time(a.updatedAt);
    case 'created':
      return (a, b) => time(b.createdAt) - time(a.createdAt);
    case 'patientId':
      return (a, b) => a.patientId.localeCompare(b.patientId, 'ja', { numeric: true });
    case 'name':
      return (a, b) => a.name.localeCompare(b.name, 'ja');
    case 'room':
      return (a, b) => {
        if (a.room === '' || b.room === '') return a.room === b.room ? 0 : a.room === '' ? 1 : -1;
        return a.room.localeCompare(b.room, 'ja', { numeric: true });
      };
    case 'age':
      return (a, b) => (calculateAge(b.dateOfBirth) ?? -1) - (calculateAge(a.dateOfBirth) ?? -1);
  }
}

/** Patients 画面（検索・絞り込み・並び替え） */
export function PatientList({ data, patients }: PatientListProps) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const ids = { keyword: useId(), room: useId(), gender: useId(), diagnosis: useId(), status: useId(), sort: useId() };

  const snapshots = useMemo(() => buildPatientSnapshots(data), [data]);
  const rooms = useMemo(
    () => [...new Set(patients.map((patient) => patient.room).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja', { numeric: true })),
    [patients],
  );
  const diagnoses = useMemo(
    () => [...new Set(patients.flatMap((patient) => patient.diagnoses))].sort((a, b) => a.localeCompare(b, 'ja')),
    [patients],
  );

  const filtered = useMemo(() => {
    const query = normalizeForSearch(filters.keyword);
    return patients
      .filter((patient) => {
        if (query !== '' && !normalizeForSearch(patient.patientId).includes(query) && !normalizeForSearch(patient.name).includes(query)) {
          return false;
        }
        if (filters.room !== 'all' && patient.room !== filters.room) return false;
        if (filters.gender !== 'all' && patient.gender !== filters.gender) return false;
        if (filters.diagnosis !== 'all' && !patient.diagnoses.includes(filters.diagnosis)) return false;
        const snapshot = snapshots.get(patient.id);
        return snapshot ? matchesStatus(snapshot, filters.status) : filters.status === 'all';
      })
      .sort(compareBy(filters.sort));
  }, [patients, snapshots, filters]);

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((current) => ({ ...current, [key]: value }));
  const isFiltered =
    filters.keyword.trim() !== '' || filters.room !== 'all' || filters.gender !== 'all' || filters.diagnosis !== 'all' || filters.status !== 'all';

  const newPatientLink = (
    <a className="button button--primary" href="#/patients/new">
      <BilingualText english="New Patient" japanese="患者登録" mode="compact" />
    </a>
  );

  return (
    <div className="page">
      <Header
        title="Patient List"
        titleJapanese="患者一覧"
        description="登録されている架空患者の一覧です。患者ID・氏名で検索し、病室・性別・疾患・状態で絞り込めます。"
        actions={newPatientLink}
      />

      {patients.length === 0 ? (
        <EmptyState
          title="No Patients Yet / 患者未登録"
          description="患者がまだ登録されていません。New Patient から架空の患者を登録するか、Dashboard でデモデータを生成してください。"
          action={newPatientLink}
        />
      ) : (
        <>
          <section className="card filter-card" aria-label="検索と絞り込み">
            <div className="filter-grid">
              <div className="field filter-grid__keyword">
                <label className="field__label" htmlFor={ids.keyword}>
                  <BilingualText english="Search" japanese="患者ID・氏名" mode="inline" />
                </label>
                <input
                  id={ids.keyword}
                  className="input"
                  type="search"
                  value={filters.keyword}
                  placeholder="例：DEMO-0001 または 月見"
                  autoComplete="off"
                  onChange={(event) => update('keyword', event.target.value)}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor={ids.room}>
                  <BilingualText english="Room" japanese="病室" mode="inline" />
                </label>
                <select id={ids.room} className="input" value={filters.room} onChange={(event) => update('room', event.target.value)}>
                  <option value="all">すべて</option>
                  {rooms.map((room) => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field__label" htmlFor={ids.gender}>
                  <BilingualText english="Gender" japanese="性別" mode="inline" />
                </label>
                <select id={ids.gender} className="input" value={filters.gender} onChange={(event) => update('gender', event.target.value as Gender | 'all')}>
                  <option value="all">すべて</option>
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field__label" htmlFor={ids.diagnosis}>
                  <BilingualText english="Diagnosis" japanese="疾患" mode="inline" />
                </label>
                <select id={ids.diagnosis} className="input" value={filters.diagnosis} onChange={(event) => update('diagnosis', event.target.value)}>
                  <option value="all">すべて</option>
                  {diagnoses.map((diagnosis) => (
                    <option key={diagnosis} value={diagnosis}>{diagnosis}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field__label" htmlFor={ids.status}>
                  <BilingualText english="Status" japanese="状態" mode="inline" />
                </label>
                <select id={ids.status} className="input" value={filters.status} onChange={(event) => update('status', event.target.value as StatusFilter)}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field__label" htmlFor={ids.sort}>
                  <BilingualText english="Sort" japanese="並び替え" mode="inline" />
                </label>
                <select id={ids.sort} className="input" value={filters.sort} onChange={(event) => update('sort', event.target.value as SortKey)}>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="filter-summary">
              <p role="status" aria-live="polite">
                {filtered.length} / {patients.length} 件表示
              </p>
              {isFiltered ? (
                <button type="button" className="button button--ghost button--small" onClick={() => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort })}>
                  <BilingualText english="Clear Filters" japanese="条件をクリア" mode="compact" />
                </button>
              ) : null}
            </div>
          </section>

          <section className="card" aria-label="患者一覧">
            {filtered.length === 0 ? (
              <EmptyState
                title="No Results / 検索結果なし"
                description="条件に一致する患者は見つかりませんでした。キーワードや絞り込み条件を変えてお試しください。"
                action={
                  <button type="button" className="button button--secondary" onClick={() => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort })}>
                    <BilingualText english="Clear Filters" japanese="条件をクリア" mode="compact" />
                  </button>
                }
              />
            ) : (
              <>
                <div className="table-scroll patient-table-wrap">
                  <table className="data-table patient-table">
                    <caption className="data-table__caption">氏名または「詳細」を選択すると患者詳細を表示します。状態は保存データの集計表示です。</caption>
                    <thead>
                      <tr>
                        <th scope="col">Patient / 患者</th>
                        <th scope="col">Age・Gender / 年齢・性別</th>
                        <th scope="col">Room / 病室</th>
                        <th scope="col">Main Diagnosis / 主要疾患</th>
                        <th scope="col">Status / 状態</th>
                        <th scope="col">Latest Vitals / 最新測定</th>
                        <th scope="col">Last Updated / 最終更新</th>
                        <th scope="col"><span className="visually-hidden">Actions / 操作</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((patient) => {
                        const snapshot = snapshots.get(patient.id);
                        return (
                          <tr key={patient.id}>
                            <td>
                              <a className="patient-link" href={patientHash(patient.id)}>
                                <PatientAvatar name={patient.name} gender={patient.gender} size="inline" decorative />
                                <span>
                                  <strong>{patient.name}</strong>
                                  <span className="mono">{patient.patientId}</span>
                                </span>
                              </a>
                            </td>
                            <td>{formatAge(patient.dateOfBirth)} / {genderLabel(patient.gender)}</td>
                            <td>{patient.room || '—'}</td>
                            <td>
                              {patient.diagnoses[0] ?? '—'}
                              {patient.diagnoses.length > 1 ? <small className="muted-text"> +{patient.diagnoses.length - 1}</small> : null}
                            </td>
                            <td>{snapshot ? <PatientStatusBadges snapshot={snapshot} /> : null}</td>
                            <td>
                              {snapshot?.latestVital ? (
                                <time dateTime={snapshot.latestVital.measuredAt} title={formatDateTime(snapshot.latestVital.measuredAt)}>
                                  {formatRelativeTime(snapshot.latestVital.measuredAt)}
                                </time>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td><time dateTime={patient.updatedAt}>{formatDateTime(patient.updatedAt)}</time></td>
                            <td>
                              <a className="button button--secondary button--small" href={patientHash(patient.id)}>
                                <BilingualText english="Open" japanese="詳細" mode="compact" />
                                <span className="visually-hidden">（{patient.name}）</span>
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <ul className="patient-cards">
                  {filtered.map((patient) => {
                    const snapshot = snapshots.get(patient.id);
                    return (
                      <li key={patient.id}>
                        <a className="patient-card" href={patientHash(patient.id)}>
                          <span className="patient-card__top">
                            <PatientAvatar name={patient.name} gender={patient.gender} size="small" decorative />
                            <span className="patient-card__identity">
                              <strong>{patient.name}</strong>
                              <span className="mono">{patient.patientId}</span>
                            </span>
                            <span className="patient-card__room">{patient.room ? `病室 ${patient.room}` : '病室未登録'}</span>
                          </span>
                          <span className="patient-card__meta">
                            {formatAge(patient.dateOfBirth)} / {genderLabel(patient.gender)} / {patient.diagnoses[0] ?? '疾患未登録'}
                          </span>
                          {snapshot ? <PatientStatusBadges snapshot={snapshot} /> : null}
                          <span className="patient-card__updated">最終更新 {formatDateTime(patient.updatedAt)}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

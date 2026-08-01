import { useId, useMemo, useState } from 'react';
import type { Patient, Route } from '../types';
import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { genderLabel } from '../data/options';
import { formatAge, formatDateTime } from '../utils/date';
import { normalizeForSearch } from '../utils/validation';

interface PatientListProps {
  patients: Patient[];
  onNavigate: (route: Route) => void;
}

/** Patients 画面（一覧 + 検索） */
export function PatientList({ patients, onNavigate }: PatientListProps) {
  const [keyword, setKeyword] = useState('');
  const searchId = useId();

  const filtered = useMemo(() => {
    // 前後の空白を無視し、大文字・小文字を区別せずに検索する
    const query = normalizeForSearch(keyword);
    if (query === '') return patients;

    return patients.filter(
      (patient) =>
        normalizeForSearch(patient.patientId).includes(query) ||
        normalizeForSearch(patient.name).includes(query),
    );
  }, [patients, keyword]);

  const openDetail = (patient: Patient) => {
    onNavigate({ name: 'patient-detail', patientId: patient.id });
  };

  return (
    <div className="page">
      <Header
        title="Patients"
        description="登録されている架空患者の一覧です。患者IDまたは氏名で検索できます。"
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

      <section className="card">
        <div className="field field--search">
          <label className="field__label" htmlFor={searchId}>
            検索（患者ID / 氏名）
          </label>
          <input
            id={searchId}
            className="input"
            type="search"
            value={keyword}
            placeholder="例：PT-0001 または 山田"
            autoComplete="off"
            onChange={(event) => setKeyword(event.target.value)}
          />
          <p className="field__hint">
            前後の空白と大文字・小文字の違いは無視されます（{filtered.length} / {patients.length}
            件表示）。
          </p>
        </div>

        {patients.length === 0 ? (
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
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No Results"
            description="検索条件に一致する患者は見つかりませんでした。キーワードを変えてお試しください。"
            action={
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setKeyword('')}
              >
                Clear Search
              </button>
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table data-table--clickable">
              <caption className="data-table__caption">
                行を選択すると患者詳細を表示します。
              </caption>
              <thead>
                <tr>
                  <th scope="col">Patient ID</th>
                  <th scope="col">Name</th>
                  <th scope="col">Age</th>
                  <th scope="col">Gender</th>
                  <th scope="col">Room</th>
                  <th scope="col">Diagnoses</th>
                  <th scope="col">Last Updated</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient) => (
                  <tr key={patient.id}>
                    <td data-label="Patient ID">
                      <span className="mono">{patient.patientId}</span>
                    </td>
                    <td data-label="Name">
                      <span className="strong-text">{patient.name}</span>
                    </td>
                    <td data-label="Age">{formatAge(patient.dateOfBirth)}</td>
                    <td data-label="Gender">{genderLabel(patient.gender)}</td>
                    <td data-label="Room">{patient.room || '—'}</td>
                    <td data-label="Diagnoses">
                      {patient.diagnoses.length === 0 ? (
                        '—'
                      ) : (
                        <span className="tag-list tag-list--inline">
                          {patient.diagnoses.map((diagnosis) => (
                            <span className="tag tag--static" key={diagnosis}>
                              {diagnosis}
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td data-label="Last Updated">{formatDateTime(patient.updatedAt)}</td>
                    <td data-label="Actions">
                      <button
                        type="button"
                        className="button button--secondary button--small"
                        onClick={() => openDetail(patient)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

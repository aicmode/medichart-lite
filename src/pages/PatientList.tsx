import { useId, useMemo, useState } from 'react';
import type { Patient, Route } from '../types';
import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { genderLabel } from '../data/options';
import { formatAge, formatDateTime } from '../utils/date';
import { normalizeForSearch } from '../utils/validation';
import { BilingualText } from '../components/BilingualText';
import { PatientAvatar } from '../components/PatientAvatar';

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
        title="Patient List"
        titleJapanese="患者一覧"
        description="登録されている架空患者の一覧です。患者IDまたは氏名で検索できます。"
        actions={
          <button
            type="button"
            className="button button--primary"
            onClick={() => onNavigate({ name: 'new-patient' })}
          >
            <BilingualText english="New Patient" japanese="患者登録" mode="compact" />
          </button>
        }
      />

      <section className="card">
        <div className="field field--search">
          <label className="field__label" htmlFor={searchId}>
            <BilingualText english="Search" japanese="検索（患者ID / 氏名）" mode="inline" />
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
            title="No Patients Yet / 患者未登録"
            description="患者がまだ登録されていません。New Patient から架空の患者を登録してください。"
            action={
              <button
                type="button"
                className="button button--primary"
                onClick={() => onNavigate({ name: 'new-patient' })}
              >
                <BilingualText english="New Patient" japanese="患者登録" mode="compact" />
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No Results / 検索結果なし"
            description="検索条件に一致する患者は見つかりませんでした。キーワードを変えてお試しください。"
            action={
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setKeyword('')}
              >
                <BilingualText english="Clear" japanese="クリア" mode="compact" />
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
                  <th scope="col">Patient ID / 患者ID</th>
                  <th scope="col">Name / 氏名</th>
                  <th scope="col">Age / 年齢</th>
                  <th scope="col">Gender / 性別</th>
                  <th scope="col">Room / 病室</th>
                  <th scope="col">Diagnoses / 疾患</th>
                  <th scope="col">Last Updated / 最終更新</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions / 操作</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient) => (
                  <tr key={patient.id}>
                    <td data-label="Patient ID / 患者ID">
                      <span className="mono">{patient.patientId}</span>
                    </td>
                    <td data-label="Name / 氏名">
                      <span className="patient-cell">
                        <PatientAvatar
                          name={patient.name}
                          gender={patient.gender}
                          size="inline"
                        />
                        <span className="strong-text">{patient.name}</span>
                      </span>
                    </td>
                    <td data-label="Age / 年齢">{formatAge(patient.dateOfBirth)}</td>
                    <td data-label="Gender / 性別">{genderLabel(patient.gender)}</td>
                    <td data-label="Room / 病室">{patient.room || '—'}</td>
                    <td data-label="Diagnoses / 疾患">
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
                    <td data-label="Last Updated / 最終更新">{formatDateTime(patient.updatedAt)}</td>
                    <td data-label="Actions / 操作">
                      <button
                        type="button"
                        className="button button--secondary button--small"
                        onClick={() => openDetail(patient)}
                      >
                        <BilingualText english="Open" japanese="詳細" mode="compact" />
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

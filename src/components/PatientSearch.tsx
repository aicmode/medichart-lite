import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Patient, Route } from '../types';
import { formatAge } from '../utils/date';
import { normalizeForSearch } from '../utils/validation';

interface PatientSearchProps {
  patients: Patient[];
  onNavigate: (route: Route) => void;
}

const MAX_RESULTS = 6;

/** 主要画面から利用できる患者ID・氏名の共通検索 */
export function PatientSearch({ patients, onNavigate }: PatientSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const results = useMemo(() => {
    const normalized = normalizeForSearch(query);
    if (normalized === '') return [];
    return patients
      .filter(
        (patient) =>
          normalizeForSearch(patient.patientId).includes(normalized) ||
          normalizeForSearch(patient.name).includes(normalized),
      )
      .slice(0, MAX_RESULTS);
  }, [patients, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const selectPatient = (patient: Patient) => {
    setQuery('');
    setOpen(false);
    onNavigate({ name: 'patient-detail', patientId: patient.id });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || normalizeForSearch(query) === '') return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      selectPatient(results[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  };

  const hasQuery = normalizeForSearch(query) !== '';

  return (
    <div className="patient-search" ref={rootRef}>
      <label className="visually-hidden" htmlFor={`${listId}-input`}>
        患者IDまたは氏名で患者を検索
      </label>
      <div className="patient-search__input-wrap">
        <span className="patient-search__icon" aria-hidden="true">
          ⌕
        </span>
        <input
          id={`${listId}-input`}
          className="patient-search__input"
          type="search"
          role="combobox"
          value={query}
          placeholder="患者ID・氏名で検索"
          autoComplete="off"
          aria-label="患者IDまたは氏名で患者を検索"
          aria-expanded={open && hasQuery}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && results[activeIndex] ? `${listId}-option-${activeIndex}` : undefined
          }
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && hasQuery ? (
        <div className="patient-search__popover" id={listId} role="listbox">
          {results.length === 0 ? (
            <p className="patient-search__empty" role="status">
              一致する患者が見つかりません。
            </p>
          ) : (
            results.map((patient, index) => (
              <button
                key={patient.id}
                id={`${listId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`patient-search__result${
                  index === activeIndex ? ' patient-search__result--active' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectPatient(patient)}
              >
                <span className="patient-search__result-main">
                  <span className="mono">{patient.patientId}</span>
                  <strong>{patient.name}</strong>
                </span>
                <span className="patient-search__result-meta">
                  {formatAge(patient.dateOfBirth)} / 病室 {patient.room || '未登録'}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

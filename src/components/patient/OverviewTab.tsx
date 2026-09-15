import { useState } from 'react';
import type { Patient, PatientTab } from '../../types';
import type { PatientRecords } from '../../domain/selectors';
import type { AssistContext } from '../../ai';
import { getAssistProvider } from '../../ai';
import { BilingualText } from '../BilingualText';
import { LatestVitalCard } from '../VitalSignHistory';
import { AssistNotices, AssistShell } from '../AssistPanel';
import { useAssistRunner } from '../../hooks/useAssistRunner';
import { bloodTypeLabel, genderLabel, handoverPriorityLabel, recordTypeLabel } from '../../data/options';
import { formatAge, formatDate, formatDateTime } from '../../utils/date';

interface OverviewTabProps {
  patient: Patient;
  records: PatientRecords;
  assistContext: AssistContext;
  onOpenTab: (tab: PatientTab) => void;
}

function OpenTabButton({ tab, label, onOpenTab }: { tab: PatientTab; label: string; onOpenTab: (tab: PatientTab) => void }) {
  return (
    <div className="card__footer">
      <button type="button" className="button button--ghost button--small" onClick={() => onOpenTab(tab)}>
        {label} →
      </button>
    </div>
  );
}

function PatientSummaryAssist({ context }: { context: AssistContext }) {
  const { status, run } = useAssistRunner<string>();
  const [copyMessage, setCopyMessage] = useState('');

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage('コピーしました。');
    } catch {
      setCopyMessage('コピーできませんでした。テキストを選択してコピーしてください。');
    }
  };

  return (
    <AssistShell
      english="Patient Summary Draft"
      japanese="患者サマリー下書き"
      description="登録済みの事実（基本情報・疾患・最新バイタル・件数）を文章に並べます。評価や推測は含めません。"
    >
      <div className="form-actions form-actions--start">
        <button
          type="button"
          className="button button--secondary"
          disabled={status.kind === 'running'}
          onClick={() => {
            setCopyMessage('');
            void run(() => getAssistProvider().summarizePatient(context));
          }}
        >
          {status.kind === 'running' ? '作成中…' : 'サマリーを作成'}
        </button>
      </div>
      <div aria-live="polite">
        {status.kind === 'error' ? <p className="field__error">{status.message}</p> : null}
        {status.kind === 'done' ? (
          <div className="assist-panel__output">
            <AssistNotices result={status.result} />
            <pre className="assist-panel__text">{status.result.value}</pre>
            <div className="form-actions form-actions--start">
              <button type="button" className="button button--ghost button--small" onClick={() => void copy(status.result.value)}>
                コピー
              </button>
              {copyMessage ? <span className="muted-text">{copyMessage}</span> : null}
            </div>
          </div>
        ) : null}
      </div>
    </AssistShell>
  );
}

/** Overview タブ: 重要情報を1画面で確認する */
export function OverviewTab({ patient, records, assistContext, onOpenTab }: OverviewTabProps) {
  const latestVital = records.vitalSigns[0];
  const openHandovers = records.handovers.filter((handover) => handover.status === 'open');
  const latestNote = records.nursingNotes[0];
  const latestSoap = records.soapRecords[0];
  const activeMeds = records.medications.filter((medication) => medication.status === 'active');
  const inactiveMedCount = records.medications.length - activeMeds.length;

  return (
    <div className="overview-grid">
      <section className="card" aria-labelledby="ov-vitals">
        <div className="card__header">
          <h3 className="card__title" id="ov-vitals">
            <BilingualText english="Latest Vitals" japanese="最新バイタル" mode="inline" />
          </h3>
          <span className="card__meta">{records.vitalSigns.length} 件</span>
        </div>
        {latestVital ? (
          <LatestVitalCard vital={latestVital} />
        ) : (
          <p className="muted-text">バイタルはまだ記録されていません。</p>
        )}
        <OpenTabButton tab="vitals" label={latestVital ? 'バイタル履歴・推移' : 'バイタルを記録'} onOpenTab={onOpenTab} />
      </section>

      <section className="card" aria-labelledby="ov-handover">
        <div className="card__header">
          <h3 className="card__title" id="ov-handover">
            <BilingualText english="Latest Handover" japanese="最新の申し送り" mode="inline" />
          </h3>
          <span className="card__meta">未確認 {openHandovers.length} 件</span>
        </div>
        {records.handovers.length === 0 ? (
          <p className="muted-text">申し送りはまだありません。</p>
        ) : (
          <ul className="compact-list">
            {(openHandovers.length > 0 ? openHandovers : records.handovers).slice(0, 3).map((handover) => (
              <li key={handover.id}>
                <p className="compact-list__head">
                  <span className={`status-badge status-badge--${handover.priority}`}>{handoverPriorityLabel(handover.priority)}</span>
                  <span className={`status-badge status-badge--${handover.status}`}>{handover.status === 'open' ? '未確認' : '確認済み'}</span>
                  <time dateTime={handover.recordedAt}>{formatDateTime(handover.recordedAt)}</time>
                </p>
                <p className="compact-list__body">{handover.content}</p>
                {handover.cautions ? <p className="compact-list__caution">注意事項：{handover.cautions}</p> : null}
              </li>
            ))}
          </ul>
        )}
        <OpenTabButton tab="handover" label="申し送りを開く" onOpenTab={onOpenTab} />
      </section>

      <section className="card" aria-labelledby="ov-basic">
        <h3 className="card__title" id="ov-basic">
          <BilingualText english="Basic Information" japanese="基本情報" mode="inline" />
        </h3>
        <dl className="kv-list">
          <div><dt>Patient ID / 患者ID</dt><dd className="mono">{patient.patientId}</dd></div>
          <div><dt>Date of Birth / 生年月日</dt><dd>{formatDate(patient.dateOfBirth)}（{formatAge(patient.dateOfBirth)}）</dd></div>
          <div><dt>Gender / 性別</dt><dd>{genderLabel(patient.gender)}</dd></div>
          <div><dt>Room / 病室</dt><dd>{patient.room || '未登録'}</dd></div>
          <div><dt>Blood Type / 血液型</dt><dd>{bloodTypeLabel(patient.bloodType)}</dd></div>
          <div><dt>Registered / 登録日時</dt><dd>{formatDateTime(patient.createdAt)}</dd></div>
        </dl>
      </section>

      <section className="card" aria-labelledby="ov-medical">
        <h3 className="card__title" id="ov-medical">
          <BilingualText english="Medical Summary" japanese="疾患・主訴・既往歴" mode="inline" />
        </h3>
        {patient.diagnoses.length > 0 ? (
          <ul className="tag-list">
            {patient.diagnoses.map((diagnosis) => (
              <li className="tag tag--static" key={diagnosis}>{diagnosis}</li>
            ))}
          </ul>
        ) : (
          <p className="muted-text">疾患は登録されていません。</p>
        )}
        <dl className="kv-list kv-list--spaced">
          <div><dt>Chief Complaint / 主訴</dt><dd>{patient.chiefComplaint || '—'}</dd></div>
          <div><dt>Medical History / 既往歴</dt><dd>{patient.medicalHistory || '—'}</dd></div>
        </dl>
        <OpenTabButton tab="medical" label="医療情報を開く" onOpenTab={onOpenTab} />
      </section>

      <section className="card" aria-labelledby="ov-records">
        <h3 className="card__title" id="ov-records">
          <BilingualText english="Latest Records" japanese="最新の記録" mode="inline" />
        </h3>
        {!latestNote && !latestSoap ? (
          <p className="muted-text">経過記録・SOAP はまだありません。</p>
        ) : (
          <ul className="compact-list">
            {latestNote ? (
              <li>
                <p className="compact-list__head">
                  <span className="badge">{recordTypeLabel(latestNote.recordType)}</span>
                  <time dateTime={latestNote.recordedAt}>{formatDateTime(latestNote.recordedAt)}</time>
                  <span>{latestNote.author || '記録者未記入'}</span>
                </p>
                <p className="compact-list__body">{latestNote.body}</p>
              </li>
            ) : null}
            {latestSoap ? (
              <li>
                <p className="compact-list__head">
                  <span className="badge">SOAP</span>
                  <time dateTime={latestSoap.recordedAt}>{formatDateTime(latestSoap.recordedAt)}</time>
                  {latestSoap.problem ? <strong>{latestSoap.problem}</strong> : null}
                </p>
                <p className="compact-list__body">S: {latestSoap.subjective || '—'}{'\n'}P: {latestSoap.plan || '—'}</p>
              </li>
            ) : null}
          </ul>
        )}
        <div className="card__footer">
          <button type="button" className="button button--ghost button--small" onClick={() => onOpenTab('records')}>経過記録 →</button>
          <button type="button" className="button button--ghost button--small" onClick={() => onOpenTab('soap')}>SOAP →</button>
        </div>
      </section>

      <section className="card" aria-labelledby="ov-meds">
        <div className="card__header">
          <h3 className="card__title" id="ov-meds">
            <BilingualText english="Medications" japanese="内服概要" mode="inline" />
          </h3>
          <span className="card__meta">継続中 {activeMeds.length} 件</span>
        </div>
        {activeMeds.length === 0 ? (
          <p className="muted-text">継続中の内服は登録されていません。</p>
        ) : (
          <ul className="med-summary">
            {activeMeds.map((medication) => (
              <li key={medication.id}>
                <strong>{medication.name}</strong>
                <span>
                  {medication.dose}
                  {medication.unit} / {medication.category === 'prn' ? `臨時: ${medication.indication || '—'}` : medication.timing || '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
        {inactiveMedCount > 0 ? <p className="muted-text">一時中止・終了：{inactiveMedCount} 件</p> : null}
        <OpenTabButton tab="medications" label="内服を開く" onOpenTab={onOpenTab} />
      </section>

      <div className="overview-grid__wide">
        <PatientSummaryAssist context={assistContext} />
      </div>
    </div>
  );
}

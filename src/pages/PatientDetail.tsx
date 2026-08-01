import { useState } from 'react';
import type { NursingNote, Patient, Route, VitalSign } from '../types';
import type { NursingNoteInput, PatientInput, VitalSignInput } from '../hooks/useAppData';
import { Header } from '../components/Header';
import { PatientForm } from '../components/PatientForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { VitalSignForm } from '../components/VitalSignForm';
import { VitalSignHistory } from '../components/VitalSignHistory';
import { NursingNoteForm } from '../components/NursingNoteForm';
import { NursingNoteList } from '../components/NursingNoteList';
import { bloodTypeLabel, genderLabel } from '../data/options';
import { formatAge, formatDate, formatDateTime } from '../utils/date';

interface PatientDetailProps {
  patient: Patient;
  vitalSigns: VitalSign[];
  nursingNotes: NursingNote[];
  isPatientIdTaken: (patientId: string) => boolean;
  onUpdatePatient: (input: PatientInput) => void;
  onDeletePatient: () => void;
  onAddVitalSign: (input: VitalSignInput) => void;
  onDeleteVitalSign: (id: string) => void;
  onAddNursingNote: (input: NursingNoteInput) => void;
  onDeleteNursingNote: (id: string) => void;
  onNavigate: (route: Route) => void;
}

/** 削除確認の対象 */
type PendingDeletion =
  | { kind: 'patient' }
  | { kind: 'vital'; vital: VitalSign }
  | { kind: 'note'; note: NursingNote }
  | null;

interface DefinitionItemProps {
  term: string;
  description: string;
}

function DefinitionItem({ term, description }: DefinitionItemProps) {
  return (
    <div className="definition-item">
      <dt>{term}</dt>
      <dd>{description || '—'}</dd>
    </div>
  );
}

/** Patient Detail 画面 */
export function PatientDetail({
  patient,
  vitalSigns,
  nursingNotes,
  isPatientIdTaken,
  onUpdatePatient,
  onDeletePatient,
  onAddVitalSign,
  onDeleteVitalSign,
  onAddNursingNote,
  onDeleteNursingNote,
  onNavigate,
}: PatientDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion>(null);

  const handleConfirmDelete = () => {
    if (pendingDeletion === null) return;

    if (pendingDeletion.kind === 'patient') {
      onDeletePatient();
    } else if (pendingDeletion.kind === 'vital') {
      onDeleteVitalSign(pendingDeletion.vital.id);
    } else {
      onDeleteNursingNote(pendingDeletion.note.id);
    }
    setPendingDeletion(null);
  };

  const dialogContent = (() => {
    if (pendingDeletion === null) {
      return { title: '', message: '', detail: undefined as string | undefined };
    }
    if (pendingDeletion.kind === 'patient') {
      return {
        title: 'Delete Patient',
        message:
          'この患者を削除します。紐づくバイタルサインと看護記録もすべて削除され、元に戻せません。',
        detail: `${patient.patientId} / ${patient.name}（バイタル ${vitalSigns.length}件、看護記録 ${nursingNotes.length}件）`,
      };
    }
    if (pendingDeletion.kind === 'vital') {
      return {
        title: 'Delete Vital Signs',
        message: 'このバイタル記録を削除します。元に戻せません。',
        detail: `測定日時：${formatDateTime(pendingDeletion.vital.measuredAt)}`,
      };
    }
    return {
      title: 'Delete Nursing Note',
      message: 'この看護記録を削除します。元に戻せません。',
      detail: `記録日時：${formatDateTime(pendingDeletion.note.recordedAt)}`,
    };
  })();

  return (
    <div className="page">
      <Header
        title="Patient Detail"
        description="患者ごとのカルテ画面です。表示・記録のみを行い、診断や治療の提案は行いません。"
        actions={
          <>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => onNavigate({ name: 'patients' })}
            >
              Back to Patients
            </button>
            {!isEditing ? (
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            ) : null}
            <button
              type="button"
              className="button button--danger"
              onClick={() => setPendingDeletion({ kind: 'patient' })}
            >
              Delete
            </button>
          </>
        }
      />

      {isEditing ? (
        <section className="section">
          <h2 className="section__title">Edit Patient</h2>
          <p className="section__description">
            登録済みの患者情報を編集します。患者IDを変更する場合も重複チェックが行われます。
          </p>
          <PatientForm
            initialPatient={patient}
            isPatientIdTaken={isPatientIdTaken}
            submitLabel="Save Changes"
            onSubmit={(input) => {
              onUpdatePatient(input);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        </section>
      ) : (
        <>
          <section className="card">
            <div className="card__header">
              <h2 className="card__title">Patient Overview</h2>
              <span className="card__meta">最終更新：{formatDateTime(patient.updatedAt)}</span>
            </div>
            <div className="patient-headline">
              <span className="patient-headline__id mono">{patient.patientId}</span>
              <span className="patient-headline__name">{patient.name}</span>
            </div>
            <dl className="definition-grid">
              <DefinitionItem term="Age" description={formatAge(patient.dateOfBirth)} />
              <DefinitionItem
                term="Date of Birth"
                description={formatDate(patient.dateOfBirth)}
              />
              <DefinitionItem term="Gender" description={genderLabel(patient.gender)} />
              <DefinitionItem term="Room" description={patient.room} />
              <DefinitionItem term="Blood Type" description={bloodTypeLabel(patient.bloodType)} />
              <DefinitionItem term="Registered" description={formatDateTime(patient.createdAt)} />
            </dl>
          </section>

          <section className="card">
            <h2 className="card__title">Diagnoses</h2>
            {patient.diagnoses.length === 0 ? (
              <p className="muted-text">疾患名は登録されていません。Edit から追加できます。</p>
            ) : (
              <ul className="tag-list">
                {patient.diagnoses.map((diagnosis) => (
                  <li className="tag tag--static" key={diagnosis}>
                    {diagnosis}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="card__header">
              <h2 className="card__title">Vital Signs</h2>
              <span className="card__meta">{vitalSigns.length} 件</span>
            </div>
            <p className="card__description">
              測定値を記録・表示するだけの機能です。正常・異常の判定や医療的な評価は行いません。
            </p>
            <VitalSignForm onSubmit={onAddVitalSign} />
            <hr className="divider" />
            <VitalSignHistory
              vitalSigns={vitalSigns}
              onRequestDelete={(vital) => setPendingDeletion({ kind: 'vital', vital })}
            />
          </section>

          <section className="card">
            <div className="card__header">
              <h2 className="card__title">Nursing Notes</h2>
              <span className="card__meta">{nursingNotes.length} 件</span>
            </div>
            <p className="card__description">
              観察した事実や実施したケアを記録します（架空の内容のみ）。
            </p>
            <NursingNoteForm onSubmit={onAddNursingNote} />
            <hr className="divider" />
            <NursingNoteList
              notes={nursingNotes}
              onRequestDelete={(note) => setPendingDeletion({ kind: 'note', note })}
            />
          </section>

          <section className="card">
            <h2 className="card__title">Medical Information</h2>
            <dl className="definition-grid definition-grid--wide">
              <DefinitionItem term="Allergies" description={patient.allergies} />
              <DefinitionItem term="Medical History" description={patient.medicalHistory} />
              <DefinitionItem term="Chief Complaint" description={patient.chiefComplaint} />
              <DefinitionItem term="Notes" description={patient.notes} />
            </dl>
          </section>
        </>
      )}

      <ConfirmDialog
        open={pendingDeletion !== null}
        title={dialogContent.title}
        message={dialogContent.message}
        detail={dialogContent.detail}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeletion(null)}
      />
    </div>
  );
}

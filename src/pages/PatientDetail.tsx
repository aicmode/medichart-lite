import { lazy, Suspense, useState } from 'react';
import type { Medication, NursingNote, Patient, Route, VitalSign } from '../types';
import type {
  MedicationInput,
  NursingNoteInput,
  PatientInput,
  VitalSignInput,
} from '../hooks/useAppData';
import { Header } from '../components/Header';
import { PatientForm } from '../components/PatientForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { VitalSignForm } from '../components/VitalSignForm';
import { VitalSignHistory } from '../components/VitalSignHistory';
import { NursingNoteForm } from '../components/NursingNoteForm';
import { NursingNoteList } from '../components/NursingNoteList';
import { AllergyAlert } from '../components/AllergyAlert';
import { BilingualText } from '../components/BilingualText';
import { MedicationSection } from '../components/MedicationSection';
import { bloodTypeLabel, genderLabel } from '../data/options';
import { formatAge, formatDate, formatDateTime } from '../utils/date';
import { PatientAvatar } from '../components/PatientAvatar';

const VitalTrend = lazy(() =>
  import('../components/VitalTrend').then((module) => ({ default: module.VitalTrend })),
);

interface PatientDetailProps {
  patient: Patient;
  vitalSigns: VitalSign[];
  nursingNotes: NursingNote[];
  medications: Medication[];
  isPatientIdTaken: (patientId: string) => boolean;
  onUpdatePatient: (input: PatientInput) => void;
  onDeletePatient: () => void;
  onAddVitalSign: (input: VitalSignInput) => void;
  onDeleteVitalSign: (id: string) => void;
  onAddNursingNote: (input: NursingNoteInput) => void;
  onDeleteNursingNote: (id: string) => void;
  onAddMedication: (input: MedicationInput) => void;
  onUpdateMedication: (id: string, input: MedicationInput) => void;
  onDeleteMedication: (id: string) => void;
  onNavigate: (route: Route) => void;
}

type PendingDeletion =
  | { kind: 'patient' }
  | { kind: 'vital'; vital: VitalSign }
  | { kind: 'note'; note: NursingNote }
  | null;

interface DefinitionItemProps {
  english: string;
  japanese: string;
  description: string;
}

function DefinitionItem({ english, japanese, description }: DefinitionItemProps) {
  return (
    <div className="definition-item">
      <dt>
        <BilingualText english={english} japanese={japanese} mode="stacked" />
      </dt>
      <dd>{description || '—'}</dd>
    </div>
  );
}

/** Patient Detail / 患者詳細画面 */
export function PatientDetail({
  patient,
  vitalSigns,
  nursingNotes,
  medications,
  isPatientIdTaken,
  onUpdatePatient,
  onDeletePatient,
  onAddVitalSign,
  onDeleteVitalSign,
  onAddNursingNote,
  onDeleteNursingNote,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
  onNavigate,
}: PatientDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion>(null);

  const handleConfirmDelete = () => {
    if (pendingDeletion === null) return;
    if (pendingDeletion.kind === 'patient') onDeletePatient();
    else if (pendingDeletion.kind === 'vital') onDeleteVitalSign(pendingDeletion.vital.id);
    else onDeleteNursingNote(pendingDeletion.note.id);
    setPendingDeletion(null);
  };

  const dialogContent = (() => {
    if (pendingDeletion === null) {
      return { title: '', message: '', detail: undefined as string | undefined };
    }
    if (pendingDeletion.kind === 'patient') {
      return {
        title: 'Delete Patient / 患者を削除',
        message:
          'この患者を削除します。紐づくバイタルサイン、看護記録、薬剤情報もすべて削除され、元に戻せません。',
        detail: `${patient.patientId} / ${patient.name}（バイタル ${vitalSigns.length}件、看護記録 ${nursingNotes.length}件、薬剤 ${medications.length}件）`,
      };
    }
    if (pendingDeletion.kind === 'vital') {
      return {
        title: 'Delete Vital Signs / バイタルを削除',
        message: 'このバイタル記録を削除します。元に戻せません。',
        detail: `測定日時：${formatDateTime(pendingDeletion.vital.measuredAt)}`,
      };
    }
    return {
      title: 'Delete Nursing Note / 看護記録を削除',
      message: 'この看護記録を削除します。元に戻せません。',
      detail: `記録日時：${formatDateTime(pendingDeletion.note.recordedAt)}`,
    };
  })();

  return (
    <div className="page">
      <Header
        title="Patient Detail"
        titleJapanese="患者詳細"
        description="患者ごとのカルテ画面です。表示・記録のみを行い、診断や治療の提案は行いません。"
        actions={
          <>
            <button
              type="button"
              className="button button--primary print-trigger"
              onClick={() => window.print()}
            >
              <span aria-hidden="true">⎙</span>
              <BilingualText english="Print PDF" japanese="PDF印刷" mode="compact" />
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => onNavigate({ name: 'patients' })}
            >
              <BilingualText
                english="Back to Patients"
                japanese="患者一覧へ戻る"
                mode="compact"
              />
            </button>
            {!isEditing ? (
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setIsEditing(true)}
              >
                <BilingualText english="Edit" japanese="編集" mode="compact" />
              </button>
            ) : null}
            <button
              type="button"
              className="button button--danger"
              onClick={() => setPendingDeletion({ kind: 'patient' })}
            >
              <BilingualText english="Delete" japanese="削除" mode="compact" />
            </button>
          </>
        }
      />

      {isEditing ? (
        <section className="section">
          <h2 className="section__title">
            <BilingualText english="Edit Patient" japanese="患者情報編集" mode="inline" />
          </h2>
          <p className="section__description">
            登録済みの患者情報を編集します。患者IDを変更する場合も重複チェックが行われます。
          </p>
          <PatientForm
            initialPatient={patient}
            isPatientIdTaken={isPatientIdTaken}
            submitLabel="Save Changes"
            submitJapaneseLabel="変更を保存"
            onSubmit={(input) => {
              onUpdatePatient(input);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        </section>
      ) : (
        <>
          <div className="printable-record">
          <section className="patient-summary" aria-label="患者概要">
            <PatientAvatar name={patient.name} gender={patient.gender} />
            <div className="patient-summary__identity">
              <h2>{patient.name}</h2>
              <span className="patient-summary__id mono">{patient.patientId}</span>
              <p>
                {formatAge(patient.dateOfBirth)} / {genderLabel(patient.gender)} / 病室{' '}
                {patient.room || '未登録'}
              </p>
              <p className="patient-summary__diagnosis">
                <span>Main Diagnosis / 主な疾患</span>
                <strong>{patient.diagnoses[0] || '未登録'}</strong>
              </p>
            </div>
            <AllergyAlert allergies={patient.allergies} compact />
          </section>

          <section className="card">
            <div className="card__header">
              <h2 className="card__title">
                <BilingualText
                  english="Patient Overview"
                  japanese="患者基本情報"
                  mode="inline"
                />
              </h2>
              <span className="card__meta">
                Last Updated / 最終更新：{formatDateTime(patient.updatedAt)}
              </span>
            </div>
            <dl className="definition-grid">
              <DefinitionItem
                english="Date of Birth"
                japanese="生年月日"
                description={formatDate(patient.dateOfBirth)}
              />
              <DefinitionItem
                english="Blood Type"
                japanese="血液型"
                description={bloodTypeLabel(patient.bloodType)}
              />
              <DefinitionItem
                english="Registered"
                japanese="登録日時"
                description={formatDateTime(patient.createdAt)}
              />
              <DefinitionItem
                english="Last Updated"
                japanese="最終更新"
                description={formatDateTime(patient.updatedAt)}
              />
            </dl>
          </section>

          <section className="card">
            <h2 className="card__title">
              <BilingualText english="Medical Information" japanese="医療情報" mode="inline" />
            </h2>
            <AllergyAlert allergies={patient.allergies} />
            <dl className="definition-grid definition-grid--wide medical-definition-grid">
              <DefinitionItem
                english="Allergies"
                japanese="アレルギー"
                description={patient.allergies || '未登録'}
              />
              <DefinitionItem
                english="Medical History"
                japanese="既往歴"
                description={patient.medicalHistory}
              />
              <DefinitionItem
                english="Chief Complaint"
                japanese="主訴"
                description={patient.chiefComplaint}
              />
              <DefinitionItem english="Notes" japanese="備考" description={patient.notes} />
            </dl>
          </section>

          <section className="card">
            <h2 className="card__title">
              <BilingualText english="Diagnoses" japanese="疾患" mode="inline" />
            </h2>
            {patient.diagnoses.length === 0 ? (
              <p className="muted-text">
                疾患名は登録されていません。Edit / 編集から追加できます。
              </p>
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

          <MedicationSection
            medications={medications}
            onAdd={onAddMedication}
            onUpdate={onUpdateMedication}
            onDelete={onDeleteMedication}
          />

          <Suspense fallback={<section className="card"><p className="muted-text">グラフを読み込んでいます…</p></section>}>
            <VitalTrend vitalSigns={vitalSigns} />
          </Suspense>

          <section className="card">
            <div className="card__header">
              <h2 className="card__title">
                <BilingualText english="Vital Signs" japanese="バイタルサイン" mode="inline" />
              </h2>
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
              <h2 className="card__title">
                <BilingualText english="Nursing Timeline" japanese="看護記録タイムライン" mode="inline" />
              </h2>
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
          </div>
        </>
      )}

      <ConfirmDialog
        open={pendingDeletion !== null}
        title={dialogContent.title}
        message={dialogContent.message}
        detail={dialogContent.detail}
        confirmLabel="Delete / 削除"
        cancelLabel="Cancel / キャンセル"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeletion(null)}
      />
    </div>
  );
}

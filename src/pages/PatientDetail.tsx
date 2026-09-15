import { useId, useMemo, useState } from 'react';
import type { AppData, Patient, PatientTab } from '../types';
import type { AppDataActions } from '../hooks/useAppData';
import type { AssistContext } from '../ai';
import { Header } from '../components/Header';
import { PatientForm } from '../components/PatientForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { BilingualText } from '../components/BilingualText';
import { MedicationSection } from '../components/MedicationSection';
import { PatientTabs } from '../components/PatientTabs';
import { tabElementId } from '../utils/route';
import { SoapSection } from '../components/SoapSection';
import { HandoverSection } from '../components/HandoverSection';
import { TimelineSection } from '../components/TimelineSection';
import { PatientHeaderCard } from '../components/patient/PatientHeaderCard';
import { OverviewTab } from '../components/patient/OverviewTab';
import { VitalsTab } from '../components/patient/VitalsTab';
import { RecordsTab } from '../components/patient/RecordsTab';
import { MedicalInfoTab } from '../components/patient/MedicalInfoTab';
import { selectPatientRecords } from '../domain/selectors';
import { buildTimeline } from '../domain/timeline';

interface PatientDetailProps {
  data: AppData;
  patient: Patient;
  tab: PatientTab;
  isPatientIdTaken: (patientId: string) => boolean;
  actions: AppDataActions;
  onChangeTab: (tab: PatientTab) => void;
  onDeleted: () => void;
  onToast: (type: 'success' | 'error', text: string) => void;
}

/** Patient Detail / 患者詳細（v2 の中心画面） */
export function PatientDetail({
  data,
  patient,
  tab,
  isPatientIdTaken,
  actions,
  onChangeTab,
  onDeleted,
  onToast,
}: PatientDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const panelId = useId();

  const records = useMemo(() => selectPatientRecords(data, patient.id), [data, patient.id]);
  const assistContext = useMemo<AssistContext>(() => ({ patient, ...records }), [patient, records]);
  const timeline = useMemo(() => (tab === 'timeline' ? buildTimeline(assistContext) : []), [tab, assistContext]);

  /** 保存処理の後に完了メッセージを出す */
  const withToast =
    <A extends unknown[]>(fn: (...args: A) => void, message: string) =>
    (...args: A) => {
      fn(...args);
      onToast('success', message);
    };

  const openHandoverCount = records.handovers.filter((handover) => handover.status === 'open').length;
  const activeMedicationCount = records.medications.filter((medication) => medication.status === 'active').length;

  const renderPanel = () => {
    switch (tab) {
      case 'overview':
        return <OverviewTab patient={patient} records={records} assistContext={assistContext} onOpenTab={onChangeTab} />;
      case 'vitals':
        return (
          <VitalsTab
            vitalSigns={records.vitalSigns}
            onAdd={withToast((input) => actions.addVitalSign(patient.id, input), 'バイタルサインを登録しました。')}
            onUpdate={withToast(actions.updateVitalSign, 'バイタルサインを更新しました。')}
            onDelete={withToast(actions.deleteVitalSign, 'バイタル記録を削除しました。')}
          />
        );
      case 'records':
        return (
          <RecordsTab
            notes={records.nursingNotes}
            onAdd={withToast((input) => actions.addNursingNote(patient.id, input), '記録を登録しました。')}
            onUpdate={withToast(actions.updateNursingNote, '記録を更新しました。')}
            onDelete={withToast(actions.deleteNursingNote, '記録を削除しました。')}
          />
        );
      case 'soap':
        return (
          <SoapSection
            records={records.soapRecords}
            onAdd={withToast((input) => actions.addSoapRecord(patient.id, input), 'SOAP記録を保存しました。')}
            onUpdate={withToast(actions.updateSoapRecord, 'SOAP記録を更新しました。')}
            onDelete={withToast(actions.deleteSoapRecord, 'SOAP記録を削除しました。')}
          />
        );
      case 'medications':
        return (
          <MedicationSection
            medications={records.medications}
            onAdd={withToast((input) => actions.addMedication(patient.id, input), '内服情報を登録しました。')}
            onUpdate={withToast(actions.updateMedication, '内服情報を更新しました。')}
            onDelete={withToast(actions.deleteMedication, '内服情報を削除しました。')}
          />
        );
      case 'medical':
        return <MedicalInfoTab patient={patient} onEdit={() => setIsEditing(true)} />;
      case 'handover':
        return (
          <HandoverSection
            records={records.handovers}
            assistContext={assistContext}
            onAdd={withToast((input) => actions.addHandover(patient.id, input), '申し送りを保存しました。')}
            onUpdate={withToast(actions.updateHandover, '申し送りを更新しました。')}
            onSetStatus={(id, status) => {
              actions.setHandoverStatus(id, status);
              onToast('success', status === 'acknowledged' ? '申し送りを確認済みにしました。' : '申し送りを未確認に戻しました。');
            }}
            onDelete={withToast(actions.deleteHandover, '申し送りを削除しました。')}
          />
        );
      case 'timeline':
        return <TimelineSection events={timeline} onOpenTab={onChangeTab} />;
    }
  };

  return (
    <div className="page">
      <nav className="breadcrumb no-print" aria-label="パンくずリスト">
        <ol>
          <li><a href="#/">Dashboard</a></li>
          <li><a href="#/patients">Patients</a></li>
          <li aria-current="page">{patient.name}</li>
        </ol>
      </nav>

      <Header
        title="Patient Detail"
        titleJapanese="患者詳細"
        description="患者ごとの記録画面です。表示・記録のみを行い、診断や治療の提案は行いません。"
        actions={
          <>
            <a className="button button--ghost" href="#/patients">
              <BilingualText english="Back" japanese="患者一覧へ" mode="compact" />
            </a>
            <button type="button" className="button button--ghost print-trigger" onClick={() => window.print()}>
              <span aria-hidden="true">⎙</span>
              <BilingualText english="Print" japanese="印刷" mode="compact" />
            </button>
            {!isEditing ? (
              <button type="button" className="button button--secondary" onClick={() => setIsEditing(true)}>
                <BilingualText english="Edit" japanese="編集" mode="compact" />
              </button>
            ) : null}
            <button type="button" className="button button--danger-ghost" onClick={() => setConfirmDelete(true)}>
              <BilingualText english="Delete" japanese="削除" mode="compact" />
            </button>
          </>
        }
      />

      <PatientHeaderCard patient={patient} records={records} />

      {isEditing ? (
        <section className="section" aria-labelledby="edit-patient-title">
          <h2 className="section__title" id="edit-patient-title">
            <BilingualText english="Edit Patient" japanese="患者情報編集" mode="inline" />
          </h2>
          <p className="section__description">
            基本情報・医療情報・疾患を編集します。患者IDを変更する場合も重複チェックが行われます。
          </p>
          <PatientForm
            initialPatient={patient}
            isPatientIdTaken={isPatientIdTaken}
            submitLabel="Save Changes"
            submitJapaneseLabel="変更を保存"
            onSubmit={(input) => {
              actions.updatePatient(patient.id, input);
              onToast('success', '患者情報を更新しました。');
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        </section>
      ) : (
        <>
          <PatientTabs
            active={tab}
            panelId={panelId}
            counts={{
              vitals: records.vitalSigns.length,
              records: records.nursingNotes.length,
              soap: records.soapRecords.length,
              medications: activeMedicationCount,
            }}
            alerts={{ handover: openHandoverCount }}
            onChange={onChangeTab}
          />
          <div className="tab-panel" id={panelId} role="tabpanel" aria-labelledby={tabElementId(panelId, tab)}>
            {renderPanel()}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Patient / 患者を削除"
        message="この患者を削除します。紐づくバイタル・記録・SOAP・内服・申し送りもすべて削除され、元に戻せません。"
        detail={`${patient.patientId} / ${patient.name}（バイタル ${records.vitalSigns.length}件、記録 ${records.nursingNotes.length}件、SOAP ${records.soapRecords.length}件、内服 ${records.medications.length}件、申し送り ${records.handovers.length}件）`}
        confirmLabel="Delete / 削除"
        cancelLabel="Cancel / キャンセル"
        onConfirm={() => {
          setConfirmDelete(false);
          actions.deletePatient(patient.id);
          onToast('success', `患者「${patient.name}」と関連記録を削除しました。`);
          onDeleted();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

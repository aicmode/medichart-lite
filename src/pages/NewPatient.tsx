import type { Route } from '../types';
import type { PatientInput } from '../hooks/useAppData';
import { Header } from '../components/Header';
import { PatientForm } from '../components/PatientForm';
import { BilingualText } from '../components/BilingualText';

interface NewPatientProps {
  isPatientIdTaken: (patientId: string) => boolean;
  onCreate: (input: PatientInput) => void;
  onNavigate: (route: Route) => void;
}

/** New Patient 画面 */
export function NewPatient({ isPatientIdTaken, onCreate, onNavigate }: NewPatientProps) {
  return (
    <div className="page">
      <Header
        title="New Patient"
        titleJapanese="患者登録"
        description="架空の患者情報を登録します。実在する患者の情報は入力しないでください。"
        actions={
          <button
            type="button"
            className="button button--ghost"
            onClick={() => onNavigate({ name: 'patients' })}
          >
            <BilingualText english="Back to Patients" japanese="患者一覧へ戻る" mode="compact" />
          </button>
        }
      />

      <PatientForm
        isPatientIdTaken={isPatientIdTaken}
        submitLabel="Register Patient"
        submitJapaneseLabel="患者を登録"
        onSubmit={onCreate}
        onCancel={() => onNavigate({ name: 'patients' })}
      />
    </div>
  );
}

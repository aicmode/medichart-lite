import type { Route } from '../types';
import type { PatientInput } from '../hooks/useAppData';
import { Header } from '../components/Header';
import { PatientForm } from '../components/PatientForm';

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
        description="架空の患者情報を登録します。実在する患者の情報は入力しないでください。"
        actions={
          <button
            type="button"
            className="button button--ghost"
            onClick={() => onNavigate({ name: 'patients' })}
          >
            Back to Patients
          </button>
        }
      />

      <PatientForm
        isPatientIdTaken={isPatientIdTaken}
        submitLabel="Register Patient"
        onSubmit={onCreate}
        onCancel={() => onNavigate({ name: 'patients' })}
      />
    </div>
  );
}

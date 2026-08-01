import { useCallback, useEffect, useRef, useState } from 'react';
import type { Route, ToastMessage } from './types';
import { Layout } from './components/Layout';
import { EmptyState } from './components/EmptyState';
import { Dashboard } from './pages/Dashboard';
import { PatientList } from './pages/PatientList';
import { NewPatient } from './pages/NewPatient';
import { PatientDetail } from './pages/PatientDetail';
import { useAppData } from './hooks/useAppData';
import { generateId } from './utils/id';

/** トーストの自動消去までの時間 (ms) */
const TOAST_DURATION = 4000;

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'dashboard' });
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimer = useRef<number | null>(null);

  const {
    data,
    patients,
    getPatient,
    getVitalSigns,
    getNursingNotes,
    isPatientIdTaken,
    addPatient,
    updatePatient,
    deletePatient,
    addVitalSign,
    deleteVitalSign,
    addNursingNote,
    deleteNursingNote,
  } = useAppData();

  const showToast = useCallback((type: ToastMessage['type'], text: string) => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    setToast({ id: generateId(), type, text });
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_DURATION);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const navigate = useCallback((next: Route) => {
    setRoute(next);
    // 画面切り替え時は先頭までスクロールする
    window.scrollTo({ top: 0 });
  }, []);

  const renderPage = () => {
    switch (route.name) {
      case 'dashboard':
        return <Dashboard data={data} patients={patients} onNavigate={navigate} />;

      case 'patients':
        return <PatientList patients={patients} onNavigate={navigate} />;

      case 'new-patient':
        return (
          <NewPatient
            isPatientIdTaken={(patientId) => isPatientIdTaken(patientId)}
            onCreate={(input) => {
              const created = addPatient(input);
              showToast('success', `患者「${created.name}」を登録しました。`);
              navigate({ name: 'patient-detail', patientId: created.id });
            }}
            onNavigate={navigate}
          />
        );

      case 'patient-detail': {
        const patient = getPatient(route.patientId);

        if (!patient) {
          return (
            <div className="page">
              <EmptyState
                title="Patient Not Found"
                description="対象の患者が見つかりませんでした。既に削除された可能性があります。"
                action={
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => navigate({ name: 'patients' })}
                  >
                    Back to Patients
                  </button>
                }
              />
            </div>
          );
        }

        return (
          <PatientDetail
            patient={patient}
            vitalSigns={getVitalSigns(patient.id)}
            nursingNotes={getNursingNotes(patient.id)}
            isPatientIdTaken={(patientId) => isPatientIdTaken(patientId, patient.id)}
            onUpdatePatient={(input) => {
              updatePatient(patient.id, input);
              showToast('success', '患者情報を更新しました。');
            }}
            onDeletePatient={() => {
              deletePatient(patient.id);
              showToast('success', `患者「${patient.name}」と関連記録を削除しました。`);
              navigate({ name: 'patients' });
            }}
            onAddVitalSign={(input) => {
              addVitalSign(patient.id, input);
              showToast('success', 'バイタルサインを登録しました。');
            }}
            onDeleteVitalSign={(id) => {
              deleteVitalSign(id);
              showToast('success', 'バイタル記録を削除しました。');
            }}
            onAddNursingNote={(input) => {
              addNursingNote(patient.id, input);
              showToast('success', '看護記録を登録しました。');
            }}
            onDeleteNursingNote={(id) => {
              deleteNursingNote(id);
              showToast('success', '看護記録を削除しました。');
            }}
            onNavigate={navigate}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <Layout
      currentRoute={route}
      onNavigate={navigate}
      patientCount={data.patients.length}
      toast={toast}
      onDismissToast={() => setToast(null)}
    >
      {renderPage()}
    </Layout>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Route, ToastMessage } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PatientList } from './pages/PatientList';
import { NewPatient } from './pages/NewPatient';
import { PatientDetail } from './pages/PatientDetail';
import { DataManagement } from './pages/DataManagement';
import { NotFound } from './pages/NotFound';
import { useAppData } from './hooks/useAppData';
import { useHashRoute } from './hooks/useHashRoute';
import { generateId } from './utils/id';
import { readPreference, writePreference } from './utils/storage';

/** トーストの自動消去までの時間 (ms) */
const TOAST_DURATION = 4000;
const THEME_KEY = 'medichart-lite:theme';

type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  const stored = readPreference(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** ページ単位の識別子（タブ切り替えではスクロール・フォーカス移動をしない） */
function pageKeyOf(route: Route): string {
  if (route.name === 'patient-detail') return `patient:${route.patientId}`;
  if (route.name === 'not-found') return `not-found:${route.path}`;
  return route.name;
}

export default function App() {
  const { route, navigate } = useHashRoute();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const { data, patients, storageIssue, dismissStorageIssue, loadedVersion, currentVersion, isPatientIdTaken, actions } =
    useAppData();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writePreference(THEME_KEY, theme);
  }, [theme]);

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

  // 画面切り替え時は先頭へスクロールし、見出しへフォーカスを移す（スクリーンリーダー向け）
  const pageKey = pageKeyOf(route);
  const previousPageKey = useRef(pageKey);
  useEffect(() => {
    if (previousPageKey.current === pageKey) return;
    previousPageKey.current = pageKey;
    window.scrollTo({ top: 0 });
    document.querySelector<HTMLElement>('.app-content h1')?.focus({ preventScroll: true });
  }, [pageKey]);

  const currentPatient = route.name === 'patient-detail' ? data.patients.find((patient) => patient.id === route.patientId) : undefined;

  useEffect(() => {
    const titles: Record<Route['name'], string> = {
      dashboard: 'Dashboard',
      patients: 'Patients',
      'new-patient': 'New Patient',
      'patient-detail': currentPatient ? `${currentPatient.name}（架空）` : 'Patient Not Found',
      data: 'Data & Safety',
      'not-found': 'Not Found',
    };
    document.title = `${titles[route.name]} | MediChart Lite`;
  }, [route.name, currentPatient]);

  const handleGenerateDemoData = () => {
    const count = actions.generateDemoData();
    showToast('success', `架空患者${count}名分のデモデータを生成しました。`);
  };

  const renderPage = () => {
    switch (route.name) {
      case 'dashboard':
        return <Dashboard data={data} patients={patients} onGenerateDemoData={handleGenerateDemoData} />;

      case 'patients':
        return <PatientList data={data} patients={patients} />;

      case 'new-patient':
        return (
          <NewPatient
            isPatientIdTaken={(patientId) => isPatientIdTaken(patientId)}
            onCreate={(input) => {
              const created = actions.addPatient(input);
              showToast('success', `患者「${created.name}」を登録しました。`);
              navigate({ name: 'patient-detail', patientId: created.id, tab: 'overview' });
            }}
            onNavigate={navigate}
          />
        );

      case 'patient-detail': {
        if (!currentPatient) {
          return (
            <NotFound
              english="Patient Not Found"
              japanese="患者が見つかりません"
              description="対象の患者が見つかりませんでした。削除されたか、URL の患者IDが正しくない可能性があります。"
            />
          );
        }
        return (
          <PatientDetail
            key={currentPatient.id}
            data={data}
            patient={currentPatient}
            tab={route.tab}
            isPatientIdTaken={(patientId) => isPatientIdTaken(patientId, currentPatient.id)}
            actions={actions}
            onChangeTab={(tab) =>
              navigate({ name: 'patient-detail', patientId: currentPatient.id, tab }, { replace: true })
            }
            onDeleted={() => navigate({ name: 'patients' }, { replace: true })}
            onToast={showToast}
          />
        );
      }

      case 'data':
        return (
          <DataManagement
            data={data}
            loadedVersion={loadedVersion}
            currentVersion={currentVersion}
            actions={actions}
            onGenerateDemoData={handleGenerateDemoData}
            onToast={showToast}
          />
        );

      case 'not-found':
        return (
          <NotFound
            english="Page Not Found"
            japanese="ページが見つかりません"
            description="URL が正しいか確認してください。"
            path={route.path}
          />
        );
    }
  };

  return (
    <Layout
      currentRoute={route}
      onNavigate={navigate}
      patients={patients}
      toast={toast}
      onDismissToast={() => setToast(null)}
      theme={theme}
      onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
      storageIssue={storageIssue}
      onDismissStorageIssue={dismissStorageIssue}
    >
      {renderPage()}
    </Layout>
  );
}

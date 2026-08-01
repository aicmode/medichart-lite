import type { ReactNode } from 'react';
import type { Patient, Route, ToastMessage } from '../types';
import { Sidebar } from './Sidebar';
import { DisclaimerBanner } from './DisclaimerBanner';
import { Toast } from './Toast';

interface LayoutProps {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  patientCount: number;
  patients: Patient[];
  toast: ToastMessage | null;
  onDismissToast: () => void;
  children: ReactNode;
}

/** サイドバー + メイン画面の共通レイアウト */
export function Layout({
  currentRoute,
  onNavigate,
  patientCount,
  patients,
  toast,
  onDismissToast,
  children,
}: LayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        patientCount={patientCount}
        patients={patients}
      />

      <div className="app-main">
        <DisclaimerBanner />
        <Toast toast={toast} onDismiss={onDismissToast} />
        <main className="app-content">{children}</main>
        <footer className="app-footer">
          <p>MediChart Lite — 学習・デモ用の架空データ専用アプリ / 医療機器ではありません。</p>
        </footer>
      </div>
    </div>
  );
}

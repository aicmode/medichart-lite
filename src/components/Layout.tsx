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
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
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
        <div className="app-toolbar no-print">
          {/* 押した後に切り替わる先（現在の状態の反対）を表示する */}
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={theme === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え'}
            title={theme === 'light' ? '現在：ライトモード / クリックでダークモード' : '現在：ダークモード / クリックでライトモード'}
          >
            <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>
        </div>
        <Toast toast={toast} onDismiss={onDismissToast} />
        <main className="app-content">{children}</main>
        <footer className="app-footer">
          <p>MediChart Lite — 学習・デモ用の架空データ専用アプリ / 医療機器ではありません。</p>
        </footer>
      </div>
    </div>
  );
}

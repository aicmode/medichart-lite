import type { ReactNode } from 'react';
import type { Patient, Route, ToastMessage } from '../types';
import type { StorageIssue } from '../hooks/useAppData';
import { Sidebar } from './Sidebar';
import { DisclaimerBanner } from './DisclaimerBanner';
import { Toast } from './Toast';

interface LayoutProps {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  patients: Patient[];
  toast: ToastMessage | null;
  onDismissToast: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  storageIssue: StorageIssue | null;
  onDismissStorageIssue: () => void;
  children: ReactNode;
}

function storageIssueMessage(issue: StorageIssue): string {
  switch (issue.kind) {
    case 'unavailable':
      return 'ブラウザの保存領域を利用できないため、データは保存されません（再読み込みで消えます）。プライベートモードや保存設定を確認してください。';
    case 'corrupt':
      return issue.backedUp
        ? '保存データを読み込めなかったため、サンプルデータで起動しました。元のデータは退避済みです（データ管理画面から保存できます）。'
        : '保存データを読み込めなかったため、サンプルデータで起動しました。';
    case 'dropped':
      return `保存データの一部（${issue.count}件）が破損していたため、読み込みから除外しました。`;
    case 'save-failed':
      return 'データを保存できませんでした。ブラウザの保存容量を確認してください。';
  }
}

/** サイドバー + メイン画面の共通レイアウト */
export function Layout({
  currentRoute,
  onNavigate,
  patients,
  toast,
  onDismissToast,
  theme,
  onToggleTheme,
  storageIssue,
  onDismissStorageIssue,
  children,
}: LayoutProps) {
  return (
    <div className="app-shell">
      <button
        type="button"
        className="skip-link"
        onClick={() => document.getElementById('main-content')?.focus()}
      >
        メインコンテンツへ移動
      </button>

      <Sidebar currentRoute={currentRoute} onNavigate={onNavigate} patients={patients} />

      <div className="app-main">
        <DisclaimerBanner />
        {storageIssue ? (
          <div className="storage-notice" role="status">
            <p>
              {storageIssueMessage(storageIssue)}
              {storageIssue.kind === 'corrupt' ? (
                <>
                  {' '}
                  <a href="#/data">データ管理を開く</a>
                </>
              ) : null}
            </p>
            <button type="button" className="toast__close" onClick={onDismissStorageIssue} aria-label="保存に関するお知らせを閉じる">
              ×
            </button>
          </div>
        ) : null}
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
            <span aria-hidden="true">{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>
        </div>
        <Toast toast={toast} onDismiss={onDismissToast} />
        <main className="app-content" id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="app-footer">
          <p>MediChart Lite v2 — 学習・デモ用の架空データ専用アプリ / 医療機器ではありません / 診断・治療・投薬判断には使用できません。</p>
        </footer>
      </div>
    </div>
  );
}

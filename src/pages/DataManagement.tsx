import { useState } from 'react';
import type { AppData } from '../types';
import type { AppDataActions } from '../hooks/useAppData';
import { Header } from '../components/Header';
import { BilingualText } from '../components/BilingualText';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CORRUPT_BACKUP_KEY, STORAGE_KEY, readPreference, removePreference } from '../utils/storage';
import { isDemoPatientId } from '../data/sampleData';
import { getAssistProvider } from '../ai';
import { todayDateValue } from '../utils/date';

interface DataManagementProps {
  data: AppData;
  loadedVersion: number | null;
  currentVersion: number;
  actions: AppDataActions;
  onGenerateDemoData: () => void;
  onToast: (type: 'success' | 'error', text: string) => void;
}

type PendingAction = 'regenerate' | 'remove-demo' | 'reset' | 'discard-backup' | null;

/** ブラウザにファイルとして保存させる（外部送信は行わない） */
function downloadText(filename: string, content: string): boolean {
  try {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

/** Data & Safety / データ管理 */
export function DataManagement({ data, loadedVersion, currentVersion, actions, onGenerateDemoData, onToast }: DataManagementProps) {
  const [pending, setPending] = useState<PendingAction>(null);
  const [corruptBackup, setCorruptBackup] = useState(() => readPreference(CORRUPT_BACKUP_KEY));

  const demoCount = data.patients.filter((patient) => isDemoPatientId(patient.patientId)).length;
  const sizeKb = Math.max(1, Math.round(new Blob([JSON.stringify(data)]).size / 1024));
  const provider = getAssistProvider();
  const stamp = todayDateValue().replaceAll('-', '');

  const counts = [
    { label: 'Patients / 患者', value: data.patients.length },
    { label: 'Vitals / バイタル', value: data.vitalSigns.length },
    { label: 'Records / 経過記録', value: data.nursingNotes.length },
    { label: 'SOAP', value: data.soapRecords.length },
    { label: 'Medications / 内服', value: data.medications.length },
    { label: 'Handovers / 申し送り', value: data.handovers.length },
  ];

  const dialog = (() => {
    switch (pending) {
      case 'regenerate':
        return {
          title: 'Regenerate Demo Data / デモデータを再生成',
          message: 'DEMO- で始まる患者と、その患者に追加した記録を削除して作り直します。DEMO- 以外の患者には影響しません。',
          detail: `対象：DEMO- 患者 ${demoCount} 名`,
          confirm: 'Regenerate / 再生成',
          run: onGenerateDemoData,
        };
      case 'remove-demo':
        return {
          title: 'Remove Demo Data / デモデータを削除',
          message: 'DEMO- で始まる患者と関連記録をすべて削除します。元に戻せません。',
          detail: `対象：DEMO- 患者 ${demoCount} 名`,
          confirm: 'Remove / 削除',
          run: () => {
            const removed = actions.removeDemoData();
            onToast('success', `デモ患者 ${removed} 名を削除しました。`);
          },
        };
      case 'reset':
        return {
          title: 'Reset All Data / すべてのデータを初期化',
          message: 'このブラウザに保存されているすべての患者・記録を削除します。元に戻せません。必要ならバックアップを保存してから実行してください。',
          detail: `患者 ${data.patients.length} 名と関連記録`,
          confirm: 'Reset / 初期化',
          run: () => {
            actions.resetAllData();
            onToast('success', 'すべてのデータを初期化しました。');
          },
        };
      case 'discard-backup':
        return {
          title: 'Discard Backup / 退避データを破棄',
          message: '読み込めなかった保存データの退避コピーを削除します。元に戻せません。',
          detail: undefined,
          confirm: 'Discard / 破棄',
          run: () => {
            removePreference(CORRUPT_BACKUP_KEY);
            setCorruptBackup(null);
            onToast('success', '退避データを破棄しました。');
          },
        };
      case null:
        return null;
    }
  })();

  return (
    <div className="page">
      <Header
        title="Data & Safety"
        titleJapanese="データ管理・安全方針"
        description="保存方式の確認、Demo Data の管理、バックアップ、初期化を行います。すべてこのブラウザ内で完結します。"
      />

      <div className="data-grid">
        <section className="card" aria-labelledby="storage-title">
          <h2 className="card__title" id="storage-title">
            <BilingualText english="Storage" japanese="保存方式" mode="inline" />
          </h2>
          <dl className="kv-list">
            <div><dt>保存先</dt><dd>このブラウザの Local Storage（サーバー・外部DBへの送信なし）</dd></div>
            <div><dt>保存キー</dt><dd className="mono">{STORAGE_KEY}</dd></div>
            <div><dt>データ形式</dt><dd>schema v{currentVersion}（読み込み時：{loadedVersion === null ? '新規作成' : `v${loadedVersion}`}）</dd></div>
            <div><dt>データ量</dt><dd>約 {sizeKb} KB</dd></div>
          </dl>
          <ul className="count-grid" aria-label="保存件数">
            {counts.map((count) => (
              <li key={count.label}>
                <span>{count.label}</span>
                <strong>{count.value}</strong>
              </li>
            ))}
          </ul>
          <p className="field__hint">別のブラウザ・端末・シークレットウィンドウとはデータを共有しません。公開デモを閲覧した第三者の操作が、他の閲覧者のデータに影響することはありません。</p>
        </section>

        <section className="card" aria-labelledby="demo-title">
          <h2 className="card__title" id="demo-title">
            <BilingualText english="Demo Data" japanese="デモデータ" mode="inline" />
          </h2>
          <p className="card__description">
            完全に架空の患者10名と、バイタル履歴・経過記録・SOAP・内服・申し送りを生成します。患者IDは「DEMO-」で始まり、利用者が登録した患者とは区別されます。
          </p>
          <p className="kv-inline">現在の DEMO- 患者：<strong>{demoCount} 名</strong></p>
          <div className="button-row button-row--start">
            <button type="button" className="button button--primary" onClick={() => (demoCount > 0 ? setPending('regenerate') : onGenerateDemoData())}>
              <BilingualText english={demoCount > 0 ? 'Regenerate' : 'Generate'} japanese={demoCount > 0 ? '再生成' : '生成'} mode="compact" />
            </button>
            <button type="button" className="button button--danger-ghost" disabled={demoCount === 0} onClick={() => setPending('remove-demo')}>
              <BilingualText english="Remove Demo Data" japanese="デモデータを削除" mode="compact" />
            </button>
          </div>
        </section>

        <section className="card" aria-labelledby="backup-title">
          <h2 className="card__title" id="backup-title">
            <BilingualText english="Backup" japanese="バックアップ" mode="inline" />
          </h2>
          <p className="card__description">現在のデータを JSON ファイルとして端末に保存します（外部送信なし）。</p>
          <div className="button-row button-row--start">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                const ok = downloadText(`medichart-lite-backup-${stamp}.json`, JSON.stringify(data, null, 2));
                onToast(ok ? 'success' : 'error', ok ? 'バックアップファイルを作成しました。' : 'バックアップファイルを作成できませんでした。');
              }}
            >
              <BilingualText english="Export JSON" japanese="JSONで保存" mode="compact" />
            </button>
          </div>
          {corruptBackup !== null ? (
            <div className="backup-alert" role="note">
              <p>
                <strong>読み込めなかった保存データの退避コピーがあります。</strong>
                必要に応じてファイルとして保存し、不要になったら破棄してください。
              </p>
              <div className="button-row button-row--start">
                <button
                  type="button"
                  className="button button--secondary button--small"
                  onClick={() => {
                    const ok = downloadText(`medichart-lite-corrupt-backup-${stamp}.json`, corruptBackup);
                    onToast(ok ? 'success' : 'error', ok ? '退避データを保存しました。' : '退避データを保存できませんでした。');
                  }}
                >
                  退避データを保存
                </button>
                <button type="button" className="button button--danger-ghost button--small" onClick={() => setPending('discard-backup')}>
                  退避データを破棄
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="card card--danger" aria-labelledby="reset-title">
          <h2 className="card__title" id="reset-title">
            <BilingualText english="Reset" japanese="初期化" mode="inline" />
          </h2>
          <p className="card__description">このブラウザに保存されたすべての患者・記録を削除します。初期化後はサンプルデータも自動投入されません。</p>
          <button type="button" className="button button--danger" disabled={data.patients.length === 0} onClick={() => setPending('reset')}>
            <BilingualText english="Reset All Data" japanese="すべて初期化" mode="compact" />
          </button>
        </section>

        <section className="card data-grid__wide" aria-labelledby="safety-title">
          <h2 className="card__title" id="safety-title">
            <BilingualText english="Safety Policy & Record Assist" japanese="安全方針と記録支援" mode="inline" />
          </h2>
          <ul className="plain-list">
            <li>学習・ポートフォリオ用のデモです。<strong>実在する患者の情報や個人情報は入力しないでください。</strong></li>
            <li>医療機器ではありません。診断・治療提案・投薬判断・医学的な緊急度判定の機能はありません。</li>
            <li>バイタルの「デモ閾値外」は固定値との単純比較による参考表示で、正常・異常の判定ではありません。</li>
            <li>記録支援（{provider.label}）は、文章の抜き出し・振り分け・定型文への流し込みのみを行います。有料APIキーは不要で、{provider.sendsDataExternally ? '入力内容を外部へ送信します。' : '入力内容を外部へ送信しません。'}</li>
            <li>申し送りの優先度は業務整理のラベルであり、医学的な緊急度ではありません。</li>
          </ul>
        </section>
      </div>

      <ConfirmDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        detail={dialog?.detail}
        confirmLabel={dialog?.confirm}
        cancelLabel="Cancel / キャンセル"
        onConfirm={() => {
          dialog?.run();
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

import { lazy, Suspense, useRef, useState } from 'react';
import type { VitalSign } from '../../types';
import type { VitalSignInput } from '../../hooks/useAppData';
import { BilingualText } from '../BilingualText';
import { ConfirmDialog } from '../ConfirmDialog';
import { EmptyState } from '../EmptyState';
import { VitalSignForm } from '../VitalSignForm';
import { LatestVitalCard, VitalSignHistory } from '../VitalSignHistory';
import { DEMO_THRESHOLD_NOTICE } from '../../domain/vitalFlags';
import { formatDateTime } from '../../utils/date';
import { useRevealWhen } from '../../hooks/useRevealWhen';

const VitalTrend = lazy(() => import('../VitalTrend').then((module) => ({ default: module.VitalTrend })));

interface VitalsTabProps {
  vitalSigns: VitalSign[];
  onAdd: (input: VitalSignInput) => void;
  onUpdate: (id: string, input: VitalSignInput) => void;
  onDelete: (id: string) => void;
}

type Editor = { mode: 'new'; key: number } | { mode: 'edit'; vital: VitalSign };

/** Vitals タブ: 記録・最新値・推移・履歴 */
export function VitalsTab({ vitalSigns, onAdd, onUpdate, onDelete }: VitalsTabProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VitalSign | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  useRevealWhen(formRef, editor ? (editor.mode === 'edit' ? editor.vital.id : String(editor.key)) : null);

  const latest = vitalSigns[0];
  const openNew = () => setEditor({ mode: 'new', key: Date.now() });

  return (
    <>
      <section className="card" aria-labelledby="vitals-title">
        <div className="card__header">
          <h2 className="card__title" id="vitals-title">
            <BilingualText english="Vital Signs" japanese="バイタルサイン" mode="inline" />
          </h2>
          <div className="card__header-actions">
            <span className="card__meta">{vitalSigns.length} 件</span>
            {editor === null ? (
              <button type="button" className="button button--primary button--small" onClick={openNew}>
                <BilingualText english="Add Vitals" japanese="バイタルを記録" mode="compact" />
              </button>
            ) : null}
          </div>
        </div>
        <p className="demo-notice" role="note">{DEMO_THRESHOLD_NOTICE}</p>

        {editor ? (
          <div ref={formRef} className="panel-form reveal-anchor">
            <h3 className="panel-form__title">
              <BilingualText
                english={editor.mode === 'edit' ? 'Edit Vitals' : 'New Vitals'}
                japanese={editor.mode === 'edit' ? `バイタルを編集（${formatDateTime(editor.vital.measuredAt)}）` : 'バイタルを記録'}
                mode="inline"
              />
            </h3>
            <VitalSignForm
              key={editor.mode === 'edit' ? editor.vital.id : editor.key}
              initialVital={editor.mode === 'edit' ? editor.vital : undefined}
              onSubmit={(input) => {
                if (editor.mode === 'edit') onUpdate(editor.vital.id, input);
                else onAdd(input);
                setEditor(null);
              }}
              onCancel={() => setEditor(null)}
            />
          </div>
        ) : null}

        {latest ? (
          <LatestVitalCard vital={latest} />
        ) : (
          <EmptyState
            title="No Vital Signs / バイタル未登録"
            description="この患者のバイタルはまだ登録されていません。"
            action={
              editor === null ? (
                <button type="button" className="button button--primary" onClick={openNew}>
                  <BilingualText english="Add Vitals" japanese="バイタルを記録" mode="compact" />
                </button>
              ) : undefined
            }
          />
        )}
      </section>

      {vitalSigns.length > 0 ? (
        <Suspense
          fallback={
            <section className="card">
              <p className="muted-text" role="status">グラフを読み込んでいます…</p>
            </section>
          }
        >
          <VitalTrend vitalSigns={vitalSigns} />
        </Suspense>
      ) : null}

      {vitalSigns.length > 0 ? (
        <section className="card" aria-labelledby="vital-history-title">
          <div className="card__header">
            <h2 className="card__title" id="vital-history-title">
              <BilingualText english="Vital History" japanese="バイタル履歴" mode="inline" />
            </h2>
            <span className="card__meta">新しい順</span>
          </div>
          <VitalSignHistory
            vitalSigns={vitalSigns}
            onRequestEdit={(vital) => setEditor({ mode: 'edit', vital })}
            onRequestDelete={setPendingDelete}
          />
        </section>
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete Vital Signs / バイタルを削除"
        message="このバイタル記録を削除します。元に戻せません。"
        detail={pendingDelete ? `測定日時：${formatDateTime(pendingDelete.measuredAt)}` : undefined}
        confirmLabel="Delete / 削除"
        cancelLabel="Cancel / キャンセル"
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id);
          if (editor?.mode === 'edit' && editor.vital.id === pendingDelete?.id) setEditor(null);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

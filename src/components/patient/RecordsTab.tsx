import { useId, useMemo, useRef, useState } from 'react';
import type { NursingNote, RecordType } from '../../types';
import type { NursingNoteInput } from '../../hooks/useAppData';
import { getAssistProvider } from '../../ai';
import { BilingualText } from '../BilingualText';
import { ConfirmDialog } from '../ConfirmDialog';
import { EmptyState } from '../EmptyState';
import { NursingNoteForm } from '../NursingNoteForm';
import { NursingNoteList } from '../NursingNoteList';
import { TextAssist } from '../AssistPanel';
import { RECORD_TYPE_OPTIONS } from '../../data/options';
import { formatDateTime } from '../../utils/date';
import { useRevealWhen } from '../../hooks/useRevealWhen';

interface RecordsTabProps {
  notes: NursingNote[];
  onAdd: (input: NursingNoteInput) => void;
  onUpdate: (id: string, input: NursingNoteInput) => void;
  onDelete: (id: string) => void;
}

type Editor = { mode: 'new'; key: number; body?: string } | { mode: 'edit'; note: NursingNote };

/** Records タブ: 経過・看護記録 */
export function RecordsTab({ notes, onAdd, onUpdate, onDelete }: RecordsTabProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [pendingDelete, setPendingDelete] = useState<NursingNote | null>(null);
  const [typeFilter, setTypeFilter] = useState<RecordType | 'all'>('all');
  const [tagFilter, setTagFilter] = useState('all');
  const formRef = useRef<HTMLDivElement>(null);
  const typeId = useId();
  const tagId = useId();
  useRevealWhen(formRef, editor ? (editor.mode === 'edit' ? editor.note.id : String(editor.key)) : null);

  const tags = useMemo(
    () => [...new Set(notes.flatMap((note) => note.tags))].sort((a, b) => a.localeCompare(b, 'ja')),
    [notes],
  );
  const typesInUse = RECORD_TYPE_OPTIONS.filter((option) => notes.some((note) => note.recordType === option.value));

  const filtered = notes.filter(
    (note) =>
      (typeFilter === 'all' || note.recordType === typeFilter) &&
      (tagFilter === 'all' || note.tags.includes(tagFilter)),
  );

  return (
    <section className="card" aria-labelledby="records-title">
      <div className="card__header">
        <h2 className="card__title" id="records-title">
          <BilingualText english="Progress & Nursing Records" japanese="経過・看護記録" mode="inline" />
        </h2>
        <div className="card__header-actions">
          <span className="card__meta">{notes.length} 件</span>
          {editor === null ? (
            <button type="button" className="button button--primary button--small" onClick={() => setEditor({ mode: 'new', key: Date.now() })}>
              <BilingualText english="Add Record" japanese="記録を追加" mode="compact" />
            </button>
          ) : null}
        </div>
      </div>
      <p className="card__description">観察した事実や実施したケアを時系列で記録します（架空の内容のみ）。</p>

      <TextAssist
        english="Key Points Assist"
        japanese="長文記録の要点整理"
        description="長い記録文から、キーワード規則で要点になりそうな文を抜き出します。新しい内容は追加しません。"
        inputLabel="整理する文章（架空の内容のみ）"
        placeholder="例：朝食は半分摂取。「お腹が張る」と訴えあり。午後に病棟内を歩行。排便なし。"
        runLabel="要点を抜き出す"
        applyLabel="新しい記録の本文に反映"
        task={(text) => getAssistProvider().summarizeNote(text)}
        onApply={(output) => setEditor({ mode: 'new', key: Date.now(), body: output })}
      />

      {editor ? (
        <div ref={formRef} className="panel-form reveal-anchor">
          <h3 className="panel-form__title">
            <BilingualText
              english={editor.mode === 'edit' ? 'Edit Record' : 'New Record'}
              japanese={editor.mode === 'edit' ? `記録を編集（${formatDateTime(editor.note.recordedAt)}）` : '記録を追加'}
              mode="inline"
            />
          </h3>
          {editor.mode === 'new' && editor.body ? (
            <p className="assist-applied">記録支援の下書きを反映しました。内容を確認・編集してから保存してください。</p>
          ) : null}
          <NursingNoteForm
            key={editor.mode === 'edit' ? editor.note.id : editor.key}
            initialNote={editor.mode === 'edit' ? editor.note : undefined}
            initialBody={editor.mode === 'new' ? editor.body : undefined}
            onSubmit={(input) => {
              if (editor.mode === 'edit') onUpdate(editor.note.id, input);
              else onAdd(input);
              setEditor(null);
            }}
            onCancel={() => setEditor(null)}
          />
        </div>
      ) : null}

      {notes.length > 0 ? (
        <div className="section-toolbar">
          <div className="field">
            <label className="field__label" htmlFor={typeId}>記録種別で絞り込み</label>
            <select id={typeId} className="input" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as RecordType | 'all')}>
              <option value="all">すべて</option>
              {typesInUse.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor={tagId}>タグで絞り込み</label>
            <select id={tagId} className="input" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} disabled={tags.length === 0}>
              <option value="all">すべて</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          </div>
          <p className="section-toolbar__count" role="status">{filtered.length} / {notes.length} 件</p>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <EmptyState title="No Records / 記録なし" description="この患者の経過・看護記録はまだありません。「記録を追加」から登録できます。" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Matching Records / 該当する記録なし"
          description="絞り込み条件に一致する記録はありません。"
          action={
            <button type="button" className="button button--secondary" onClick={() => { setTypeFilter('all'); setTagFilter('all'); }}>
              <BilingualText english="Clear Filters" japanese="絞り込みを解除" mode="compact" />
            </button>
          }
        />
      ) : (
        <NursingNoteList notes={filtered} onRequestEdit={(note) => setEditor({ mode: 'edit', note })} onRequestDelete={setPendingDelete} />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete Record / 記録を削除"
        message="この記録を削除します。元に戻せません。"
        detail={pendingDelete ? `記録日時：${formatDateTime(pendingDelete.recordedAt)}` : undefined}
        confirmLabel="Delete / 削除"
        cancelLabel="Cancel / キャンセル"
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id);
          if (editor?.mode === 'edit' && editor.note.id === pendingDelete?.id) setEditor(null);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}

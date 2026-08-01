import type { NursingNote } from '../types';
import { EmptyState } from './EmptyState';
import { recordTypeLabel } from '../data/options';
import { formatDateTime } from '../utils/date';
import { BilingualText } from './BilingualText';

interface NursingNoteListProps {
  notes: NursingNote[];
  onRequestDelete: (note: NursingNote) => void;
}

/** 看護記録の一覧（新しい順） */
export function NursingNoteList({ notes, onRequestDelete }: NursingNoteListProps) {
  if (notes.length === 0) {
    return (
      <EmptyState
        title="No Nursing Notes / 看護記録未登録"
        description="この患者の看護記録はまだ登録されていません。上のフォームから追加できます。"
      />
    );
  }

  return (
    <ul className="note-list">
      {notes.map((note) => (
        <li className="note-item" key={note.id}>
          <div className="note-item__header">
            <div className="note-item__meta">
              <span className="badge">{recordTypeLabel(note.recordType)}</span>
              <span className="note-item__time">{formatDateTime(note.recordedAt)}</span>
              <span className="note-item__author">記録者：{note.author || '未記入'}</span>
            </div>
            <button
              type="button"
              className="button button--danger-ghost button--small"
              onClick={() => onRequestDelete(note)}
            >
              <BilingualText english="Delete" japanese="削除" mode="compact" />
            </button>
          </div>
          <p className="note-item__body">{note.body}</p>
        </li>
      ))}
    </ul>
  );
}

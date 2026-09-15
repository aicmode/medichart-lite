import type { NursingNote } from '../types';
import { recordTypeLabel } from '../data/options';
import { formatDateTime } from '../utils/date';
import { BilingualText } from './BilingualText';

interface NursingNoteListProps {
  notes: NursingNote[];
  onRequestEdit: (note: NursingNote) => void;
  onRequestDelete: (note: NursingNote) => void;
}

const MARKERS: Partial<Record<NursingNote['recordType'], string>> = {
  care: '✚',
  observation: '◉',
  handover: '↗',
  soap: 'S',
};

/** 経過・看護記録の一覧（呼び出し側で並べ替え済み） */
export function NursingNoteList({ notes, onRequestEdit, onRequestDelete }: NursingNoteListProps) {
  return (
    <ol className="note-list nursing-timeline">
      {notes.map((note) => {
        const edited = new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() > 1000;
        return (
          <li className="note-item" key={note.id}>
            <span className="note-item__marker" aria-hidden="true">
              {MARKERS[note.recordType] ?? '●'}
            </span>
            <div className="note-item__header">
              <div className="note-item__meta">
                <span className="badge">{recordTypeLabel(note.recordType)}</span>
                <time className="note-item__time" dateTime={note.recordedAt}>
                  {formatDateTime(note.recordedAt)}
                </time>
                <span className="note-item__author">記録者：{note.author || '未記入'}</span>
                {edited ? <span className="note-item__edited">編集済み {formatDateTime(note.updatedAt)}</span> : null}
              </div>
              <div className="item-actions">
                <button type="button" className="button button--secondary button--small" onClick={() => onRequestEdit(note)}>
                  <BilingualText english="Edit" japanese="編集" mode="compact" />
                </button>
                <button type="button" className="button button--danger-ghost button--small" onClick={() => onRequestDelete(note)}>
                  <BilingualText english="Delete" japanese="削除" mode="compact" />
                </button>
              </div>
            </div>
            <p className="note-item__body">{note.body}</p>
            {note.tags.length > 0 ? (
              <ul className="tag-list tag-list--compact" aria-label="タグ">
                {note.tags.map((tag) => (
                  <li className="tag tag--static tag--small" key={tag}>
                    #{tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

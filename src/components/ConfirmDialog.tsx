import { useEffect, useId, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  /** 見出し（英語） */
  title: string;
  /** 確認文（日本語） */
  message: string;
  /** 補足表示（削除対象の名称など） */
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 削除など取り消せない操作の前に表示する確認ダイアログ */
export function ConfirmDialog({
  open,
  title,
  message,
  detail,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // 表示時に確認ボタンへフォーカスし、Escape で閉じられるようにする
  useEffect(() => {
    if (!open) return;

    confirmButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onMouseDown={onCancel}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="dialog__title" id={titleId}>
          {title}
        </h2>
        <p className="dialog__message" id={descriptionId}>
          {message}
        </p>
        {detail ? <p className="dialog__detail">{detail}</p> : null}
        <div className="dialog__actions">
          <button type="button" className="button button--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="button button--danger"
            onClick={onConfirm}
            ref={confirmButtonRef}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

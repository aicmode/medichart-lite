import type { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

/** 登録・更新・削除の結果を伝えるフィードバック表示 */
export function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast ? (
        <div className={`toast toast--${toast.type}`}>
          <span className="toast__text">{toast.text}</span>
          <button
            type="button"
            className="toast__close"
            onClick={onDismiss}
            aria-label="メッセージを閉じる"
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}

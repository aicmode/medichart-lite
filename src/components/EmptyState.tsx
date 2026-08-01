import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** 見出し（英語） */
  title: string;
  /** 説明文（日本語） */
  description: string;
  /** 任意の操作ボタンなど */
  action?: ReactNode;
}

/** データが無いときに表示する空状態 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__description">{description}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}

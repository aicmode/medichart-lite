import type { ReactNode } from 'react';

interface HeaderProps {
  /** ページ名（英語） */
  title: string;
  /** ページの説明（日本語） */
  description: string;
  /** 右側に置く操作ボタンなど */
  actions?: ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        <h1 className="page-header__title">{title}</h1>
        <p className="page-header__description">{description}</p>
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}

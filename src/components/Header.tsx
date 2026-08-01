import type { ReactNode } from 'react';

interface HeaderProps {
  /** ページ名（英語） */
  title: string;
  /** ページ名（日本語） */
  titleJapanese: string;
  /** ページの説明（日本語） */
  description: string;
  /** 右側に置く操作ボタンなど */
  actions?: ReactNode;
}

export function Header({ title, titleJapanese, description, actions }: HeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        <h1 className="page-header__title">
          <span className="page-header__title-en">{title}</span>
          <span className="page-header__title-ja" lang="ja">
            {titleJapanese}
          </span>
        </h1>
        <p className="page-header__description">{description}</p>
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}

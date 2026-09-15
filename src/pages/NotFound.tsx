import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { BilingualText } from '../components/BilingualText';

interface NotFoundProps {
  english: string;
  japanese: string;
  description: string;
  /** 表示用の要求パス */
  path?: string;
}

/** 存在しないページ・患者の表示（404 相当） */
export function NotFound({ english, japanese, description, path }: NotFoundProps) {
  return (
    <div className="page">
      <Header title="Not Found" titleJapanese="見つかりません" description="指定されたページまたは患者を表示できませんでした。" />
      <EmptyState
        title={`${english} / ${japanese}`}
        description={description}
        action={
          <div className="button-row">
            <a className="button button--primary" href="#/patients">
              <BilingualText english="Patients" japanese="患者一覧へ" mode="compact" />
            </a>
            <a className="button button--ghost" href="#/">
              <BilingualText english="Dashboard" japanese="ダッシュボードへ" mode="compact" />
            </a>
          </div>
        }
      />
      {path ? <p className="muted-text not-found-path">要求されたURL：<span className="mono">#{path}</span></p> : null}
    </div>
  );
}

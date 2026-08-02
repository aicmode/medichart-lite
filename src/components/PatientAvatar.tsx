import type { Gender } from '../types';

interface PatientAvatarProps {
  /** 患者氏名（aria-label に使用。氏名の文字は表示しない） */
  name: string;
  /** 背景色を決める性別。未指定は「未回答」として扱う */
  gender?: Gender;
  size?: 'inline' | 'small' | 'large';
  /** 氏名などが隣接していてアバターが装飾に過ぎない場合は true にする */
  decorative?: boolean;
}

/** 性別ごとの背景色。白いシルエットアイコンとの組み合わせでライト／ダーク両方で視認できる色のみ */
const GENDER_COLORS: Record<Gender, string> = {
  male: '#2563eb', // ブルー
  female: '#ec4899', // ピンク
  other: '#0d9488', // ティール
  undisclosed: '#64748b', // グレー
};

/** lucide-react の User アイコンと同じ形状（依存追加を避けてインライン SVG で実装） */
function UserIcon() {
  return (
    <svg
      className="patient-avatar__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/**
 * 人物シルエットを表示する丸型アバター。
 * 写真・イニシャルは一切表示せず、背景色のみ性別で切り替える。
 */
export function PatientAvatar({ name, gender = 'undisclosed', size = 'large', decorative = false }: PatientAvatarProps) {
  const label = name.trim() === '' ? '患者' : name.trim();
  const background = GENDER_COLORS[gender] ?? GENDER_COLORS.undisclosed;

  return (
    <span
      className={`patient-avatar patient-avatar--${size}`}
      style={{ backgroundColor: background }}
      {...(decorative
        ? { 'aria-hidden': true as const }
        : { role: 'img', 'aria-label': `${label}の患者アイコン` })}
    >
      <UserIcon />
    </span>
  );
}

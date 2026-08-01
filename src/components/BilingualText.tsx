interface BilingualTextProps {
  english: string;
  japanese: string;
  mode?: 'stacked' | 'inline' | 'compact';
  className?: string;
}

/** 英語を主表示、日本語を補助表示にする共通ラベル */
export function BilingualText({
  english,
  japanese,
  mode = 'stacked',
  className = '',
}: BilingualTextProps) {
  return (
    <span
      className={`bilingual bilingual--${mode}${className ? ` ${className}` : ''}`}
      aria-label={`${english}、${japanese}`}
    >
      <span className="bilingual__english" aria-hidden="true">
        {english}
      </span>
      <span className="bilingual__japanese" aria-hidden="true">
        {japanese}
      </span>
    </span>
  );
}

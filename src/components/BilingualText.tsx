interface BilingualTextProps {
  english: string;
  japanese: string;
  mode?: 'stacked' | 'inline' | 'compact';
  className?: string;
}

/**
 * 英語を主表示、日本語を補助表示にする共通ラベル。
 * 両方のテキストを支援技術にもそのまま公開する（aria-hidden で隠さない）。
 */
export function BilingualText({
  english,
  japanese,
  mode = 'stacked',
  className = '',
}: BilingualTextProps) {
  return (
    <span className={`bilingual bilingual--${mode}${className ? ` ${className}` : ''}`}>
      <span className="bilingual__english" lang="en">
        {english}
      </span>
      {/* 読み上げ時に英語と日本語が連結しないよう空白を挟む（flex 内では表示に影響しない） */}
      {english === japanese ? null : (
        <>
          {' '}
          <span className="bilingual__japanese">{japanese}</span>
        </>
      )}
    </span>
  );
}

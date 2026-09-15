/** アレルギー欄の自由記述を、表示用の項目へ分解する */

const NO_ALLERGY_WORDS = ['なし', '無し', '特記事項なし', '登録なし', '未登録', 'nka', 'none'];

/** 「なし」等の明記や空欄は空配列を返す */
export function parseAllergyItems(value: string): string[] {
  const normalized = value
    .trim()
    .replace(/（[^）]*）|\([^)]*\)/g, '')
    .trim()
    .toLowerCase();
  if (normalized === '' || NO_ALLERGY_WORDS.includes(normalized)) return [];
  return value
    .split(/[,、，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function hasRegisteredAllergy(value: string): boolean {
  return parseAllergyItems(value).length > 0;
}

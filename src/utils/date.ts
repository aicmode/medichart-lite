/** 日付・日時の変換と表示に関するユーティリティ */

/** 数値を2桁のゼロ埋め文字列にする */
function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Date が有効かどうかを判定する */
export function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

/**
 * 生年月日から現在年齢を計算する。
 * 未入力・不正な日付・未来日の場合は null を返す。
 */
export function calculateAge(dateOfBirth: string, now: Date = new Date()): number | null {
  if (!dateOfBirth) return null;

  const birth = new Date(`${dateOfBirth}T00:00:00`);
  if (!isValidDate(birth)) return null;
  if (birth.getTime() > now.getTime()) return null;

  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;

  return age >= 0 ? age : null;
}

/** 年齢の表示文字列（未入力時は「—」） */
export function formatAge(dateOfBirth: string): string {
  const age = calculateAge(dateOfBirth);
  return age === null ? '—' : `${age}歳`;
}

/** input[type="date"] に渡す本日の日付 (YYYY-MM-DD) */
export function todayDateValue(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** input[type="datetime-local"] に渡す値 (YYYY-MM-DDTHH:mm) */
export function toDateTimeLocalValue(date: Date = new Date()): string {
  return `${todayDateValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * datetime-local の値を ISO 8601 文字列へ変換する。
 * 変換できない場合は null を返す。
 */
export function dateTimeLocalToISO(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!isValidDate(date)) return null;
  return date.toISOString();
}

/** ISO 8601 文字列を日本語表記の日時にする (例: 2026/08/01 09:30) */
export function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (!isValidDate(date)) return '—';
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** YYYY-MM-DD を日本語表記の日付にする (例: 1958/04/12) */
export function formatDate(value: string): string {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (!isValidDate(date)) return '—';
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

/** ISO 8601 文字列を短い日時表記にする (例: 08/01 09:30) */
export function formatShortDateTime(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (!isValidDate(date)) return '—';
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

/** 経過時間の簡易表記（例: 5分前 / 3時間前 / 2日前） */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (!isValidDate(date)) return '—';
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'たった今';
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}時間前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}日前`;
  return formatDateTime(iso);
}

/** ISO 日時の降順比較（新しい順） */
export function compareIsoDesc(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime();
}

/** 2つのISO日時が同じ日かどうか */
export function isSameLocalDay(iso: string, target: Date = new Date()): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  if (!isValidDate(date)) return false;
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

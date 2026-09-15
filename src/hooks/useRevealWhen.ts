import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * key が変わったとき（フォームを開いた・編集対象を切り替えた）に、
 * 対象を画面内へスクロールし、最初の入力欄へフォーカスする。
 */
export function useRevealWhen(ref: RefObject<HTMLElement | null>, key: string | null): void {
  useEffect(() => {
    if (key === null || !ref.current) return;
    ref.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
    ref.current.querySelector<HTMLElement>('input, textarea, select')?.focus({ preventScroll: true });
  }, [ref, key]);
}

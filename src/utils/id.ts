/**
 * 一意なID生成
 *
 * crypto.randomUUID が使えない環境（古いブラウザ、非セキュアコンテキストなど）でも
 * 動作するように段階的なフォールバックを用意する。
 */

let sequence = 0;

/** crypto.getRandomValues を用いた RFC4122 v4 相当のUUID生成 */
function uuidFromRandomValues(cryptoObj: Crypto): string {
  const bytes = new Uint8Array(16);
  cryptoObj.getRandomValues(bytes);
  // version (4) と variant (10xx) ビットを設定する
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex: string[] = [];
  for (let i = 0; i < bytes.length; i += 1) {
    hex.push(bytes[i].toString(16).padStart(2, '0'));
  }
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

/** 乱数と時刻を組み合わせた最終フォールバック */
function fallbackId(): string {
  sequence += 1;
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `id-${time}-${sequence.toString(36)}-${random}`;
}

/** アプリ内で使用する一意なIDを返す */
export function generateId(): string {
  const cryptoObj: Crypto | undefined = globalThis.crypto;

  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    try {
      return cryptoObj.randomUUID();
    } catch {
      // randomUUID が例外を投げる環境では次の手段を試す
    }
  }

  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    try {
      return uuidFromRandomValues(cryptoObj);
    } catch {
      // getRandomValues も使えない場合は最終フォールバックへ
    }
  }

  return fallbackId();
}

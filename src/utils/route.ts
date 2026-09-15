/**
 * URL ハッシュと Route の相互変換（依存ライブラリなしの軽量ルーター）。
 *
 * ハッシュ方式を採用している理由:
 * - 静的ホスティング（Vercel）でリライト設定を追加せずに、リロード・直リンクに対応できる。
 */

import type { PatientTab, Route } from '../types';
import { isPatientTab } from '../data/options';

function safeDecode(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

/** location.hash（例: "#/patients/abc/vitals"）を Route へ変換する */
export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '');
  const path = raw.split('?')[0] ?? '';
  const segments = path.split('/').filter((segment) => segment !== '');

  if (segments.length === 0) return { name: 'dashboard' };

  const [first, second, third, ...rest] = segments;

  if (first === 'data' && segments.length === 1) return { name: 'data' };

  if (first === 'patients') {
    if (second === undefined) return { name: 'patients' };
    if (second === 'new' && third === undefined) return { name: 'new-patient' };

    const patientId = safeDecode(second);
    if (patientId !== null && rest.length === 0) {
      if (third === undefined) return { name: 'patient-detail', patientId, tab: 'overview' };
      if (isPatientTab(third)) return { name: 'patient-detail', patientId, tab: third };
    }
  }

  return { name: 'not-found', path: `/${segments.join('/')}` };
}

/** Route を location.hash 用の文字列へ変換する */
export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'dashboard':
      return '#/';
    case 'patients':
      return '#/patients';
    case 'new-patient':
      return '#/patients/new';
    case 'patient-detail':
      return patientHash(route.patientId, route.tab);
    case 'data':
      return '#/data';
    case 'not-found':
      return `#${route.path}`;
  }
}

/** Patient Detail のタブ要素ID（tab と tabpanel の関連付けに使用） */
export function tabElementId(panelId: string, tab: PatientTab): string {
  return `${panelId}-tab-${tab}`;
}

export function patientHash(patientId: string, tab: PatientTab = 'overview'): string {
  const base = `#/patients/${encodeURIComponent(patientId)}`;
  return tab === 'overview' ? base : `${base}/${tab}`;
}

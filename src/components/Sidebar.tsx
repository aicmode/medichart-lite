import type { Patient, Route } from '../types';
import { BilingualText } from './BilingualText';
import { PatientSearch } from './PatientSearch';
import { routeToHash } from '../utils/route';

type NavKey = 'dashboard' | 'patients' | 'new-patient' | 'data';

/** ナビゲーション項目 */
const NAV_ITEMS: { key: NavKey; label: string; japanese: string; route: Route }[] = [
  { key: 'dashboard', label: 'Dashboard', japanese: 'ダッシュボード', route: { name: 'dashboard' } },
  { key: 'patients', label: 'Patients', japanese: '患者一覧', route: { name: 'patients' } },
  { key: 'new-patient', label: 'New Patient', japanese: '患者登録', route: { name: 'new-patient' } },
  { key: 'data', label: 'Data', japanese: 'データ管理', route: { name: 'data' } },
];

interface SidebarProps {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  patients: Patient[];
}

function activeKeyOf(route: Route): NavKey | null {
  switch (route.name) {
    case 'patient-detail':
      return 'patients';
    case 'not-found':
      return null;
    default:
      return route.name;
  }
}

export function Sidebar({ currentRoute, onNavigate, patients }: SidebarProps) {
  // 患者詳細を開いている間も Patients をアクティブ扱いにする
  const activeKey = activeKeyOf(currentRoute);

  return (
    <aside className="sidebar">
      <a className="sidebar__brand" href="#/" aria-label="MediChart Lite ダッシュボードへ">
        <span className="sidebar__logo" aria-hidden="true">
          M
        </span>
        <span className="sidebar__brand-text">
          <span className="sidebar__title">MediChart Lite</span>
          <span className="sidebar__subtitle">Demo Nursing Record v2</span>
        </span>
      </a>

      <PatientSearch patients={patients} onNavigate={onNavigate} />

      <nav className="sidebar__nav" aria-label="Main navigation">
        <ul className="sidebar__list">
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <li key={item.key}>
                <a
                  className={`sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  href={routeToHash(item.route)}
                >
                  <BilingualText english={item.label} japanese={item.japanese} mode="compact" />
                  {item.key === 'patients' ? (
                    <span className="sidebar__badge">
                      {patients.length}
                      <span className="visually-hidden">名</span>
                    </span>
                  ) : null}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="sidebar__note">
        学習・ポートフォリオ用のデモアプリです。架空データのみを扱い、データはこのブラウザ内にのみ保存されます。
      </p>
    </aside>
  );
}

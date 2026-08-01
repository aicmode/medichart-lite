import type { Route } from '../types';

/** ナビゲーション項目 */
const NAV_ITEMS: { key: Route['name']; label: string; route: Route }[] = [
  { key: 'dashboard', label: 'Dashboard', route: { name: 'dashboard' } },
  { key: 'patients', label: 'Patients', route: { name: 'patients' } },
  { key: 'new-patient', label: 'New Patient', route: { name: 'new-patient' } },
];

interface SidebarProps {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  /** 登録患者数（バッジ表示用） */
  patientCount: number;
}

export function Sidebar({ currentRoute, onNavigate, patientCount }: SidebarProps) {
  // 患者詳細を開いている間も Patients をアクティブ扱いにする
  const activeKey: Route['name'] =
    currentRoute.name === 'patient-detail' ? 'patients' : currentRoute.name;

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">
          M
        </span>
        <span className="sidebar__brand-text">
          <span className="sidebar__title">MediChart Lite</span>
          <span className="sidebar__subtitle">Demo EMR</span>
        </span>
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation">
        <ul className="sidebar__list">
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className={`sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onNavigate(item.route)}
                >
                  <span>{item.label}</span>
                  {item.key === 'patients' ? (
                    <span className="sidebar__badge">{patientCount}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="sidebar__note">
        学習・ポートフォリオ用のデモアプリです。データはブラウザ内にのみ保存されます。
      </p>
    </aside>
  );
}

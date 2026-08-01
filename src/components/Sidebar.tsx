import type { Patient, Route } from '../types';
import { BilingualText } from './BilingualText';
import { PatientSearch } from './PatientSearch';

/** ナビゲーション項目 */
const NAV_ITEMS: { key: Route['name']; label: string; japanese: string; route: Route }[] = [
  { key: 'dashboard', label: 'Dashboard', japanese: 'ダッシュボード', route: { name: 'dashboard' } },
  { key: 'patients', label: 'Patients', japanese: '患者一覧', route: { name: 'patients' } },
  { key: 'new-patient', label: 'New Patient', japanese: '患者登録', route: { name: 'new-patient' } },
];

interface SidebarProps {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  /** 登録患者数（バッジ表示用） */
  patientCount: number;
  patients: Patient[];
}

export function Sidebar({ currentRoute, onNavigate, patientCount, patients }: SidebarProps) {
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

      <PatientSearch patients={patients} onNavigate={onNavigate} />

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
                  <BilingualText english={item.label} japanese={item.japanese} mode="compact" />
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

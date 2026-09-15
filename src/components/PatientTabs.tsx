import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { PatientTab } from '../types';
import { PATIENT_TABS } from '../data/options';
import { tabElementId } from '../utils/route';

interface PatientTabsProps {
  active: PatientTab;
  /** タブ名の横に表示する件数 */
  counts: Partial<Record<PatientTab, number>>;
  /** 未確認など注意を促す件数（強調表示） */
  alerts: Partial<Record<PatientTab, number>>;
  panelId: string;
  onChange: (tab: PatientTab) => void;
}

/** Patient Detail のタブ（WAI-ARIA Tabs パターン、矢印キー・Home/End 対応） */
export function PatientTabs({ active, counts, alerts, panelId, onChange }: PatientTabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // 小画面で横スクロールしている場合も、選択中のタブを表示範囲に入れる
  useEffect(() => {
    const element = listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    element?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = PATIENT_TABS.findIndex((tab) => tab.value === active);
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % PATIENT_TABS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + PATIENT_TABS.length) % PATIENT_TABS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = PATIENT_TABS.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const next = PATIENT_TABS[nextIndex].value;
    onChange(next);
    document.getElementById(tabElementId(panelId, next))?.focus();
  };

  return (
    <div className="patient-tabs no-print">
      <div
        ref={listRef}
        className="patient-tabs__list"
        role="tablist"
        aria-label="患者記録の区分"
        onKeyDown={handleKeyDown}
      >
        {PATIENT_TABS.map((tab) => {
          const selected = tab.value === active;
          const count = counts[tab.value];
          const alert = alerts[tab.value] ?? 0;
          return (
            <button
              key={tab.value}
              id={tabElementId(panelId, tab.value)}
              type="button"
              role="tab"
              className={`patient-tabs__tab${selected ? ' patient-tabs__tab--active' : ''}`}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.value)}
            >
              <span className="patient-tabs__english" lang="en">{tab.english}</span>
              {tab.english !== tab.japanese ? <span className="patient-tabs__japanese">{tab.japanese}</span> : null}
              {alert > 0 ? (
                <span className="patient-tabs__count patient-tabs__count--alert">
                  {alert}
                  <span className="visually-hidden">件 要確認</span>
                </span>
              ) : count !== undefined ? (
                <span className="patient-tabs__count">
                  {count}
                  <span className="visually-hidden">件</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

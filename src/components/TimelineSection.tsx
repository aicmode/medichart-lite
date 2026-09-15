import { useMemo, useState } from 'react';
import type { PatientTab } from '../types';
import type { TimelineEvent, TimelineEventKind } from '../domain/timeline';
import { formatDate, todayDateValue } from '../utils/date';
import { BilingualText } from './BilingualText';
import { EmptyState } from './EmptyState';

interface TimelineSectionProps {
  events: TimelineEvent[];
  onOpenTab: (tab: PatientTab) => void;
}

type FilterKey = 'all' | 'vital' | 'record' | 'soap' | 'medication' | 'handover' | 'patient';

const FILTERS: { key: FilterKey; label: string; kinds: TimelineEventKind[] }[] = [
  { key: 'all', label: 'すべて', kinds: [] },
  { key: 'vital', label: 'バイタル', kinds: ['vital'] },
  { key: 'record', label: '経過記録', kinds: ['record'] },
  { key: 'soap', label: 'SOAP', kinds: ['soap'] },
  { key: 'medication', label: '内服', kinds: ['medication-added', 'medication-updated'] },
  { key: 'handover', label: '申し送り', kinds: ['handover', 'handover-acknowledged'] },
  { key: 'patient', label: '患者情報', kinds: ['patient-created', 'patient-updated'] },
];

const KIND_ICON: Record<TimelineEventKind, string> = {
  'patient-created': '★',
  'patient-updated': '✎',
  vital: '♥',
  record: '●',
  soap: 'S',
  'medication-added': '℞',
  'medication-updated': '℞',
  handover: '↗',
  'handover-acknowledged': '✓',
};

function localDateKey(iso: string): string {
  return todayDateValue(new Date(iso));
}

/** Timeline タブ: 各記録の日時から生成したイベントを日付ごとに表示する */
export function TimelineSection({ events, onOpenTab }: TimelineSectionProps) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const groups = useMemo(() => {
    const kinds = FILTERS.find((item) => item.key === filter)?.kinds ?? [];
    const filtered = kinds.length === 0 ? events : events.filter((event) => kinds.includes(event.kind));
    const map = new Map<string, TimelineEvent[]>();
    for (const event of filtered) {
      const key = localDateKey(event.at);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [events, filter]);

  const today = todayDateValue();

  return (
    <section className="card" aria-labelledby="timeline-title">
      <div className="card__header">
        <h2 className="card__title" id="timeline-title">
          <BilingualText english="Timeline" japanese="タイムライン" mode="inline" />
        </h2>
        <span className="card__meta">{events.length} 件</span>
      </div>
      <p className="card__description">
        登録・バイタル・経過記録・SOAP・内服・申し送りを日時順にまとめて表示します。各記録の日時から自動生成しています（削除した記録は表示されません）。
      </p>

      <div className="filter-chips" role="group" aria-label="表示するイベントの種類">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`chip chip--toggle${filter === item.key ? ' chip--on' : ''}`}
            aria-pressed={filter === item.key}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState title="No Events / イベントなし" description="選択した種類のイベントはありません。" />
      ) : (
        <div className="timeline">
          {groups.map(([date, dayEvents]) => (
            <section className="timeline__day" key={date} aria-label={`${formatDate(date)}のイベント`}>
              <h3 className="timeline__date">
                {formatDate(date)}
                {date === today ? <span className="timeline__today">Today / 本日</span> : null}
              </h3>
              <ol className="timeline__list">
                {dayEvents.map((event) => (
                  <li className={`timeline__item timeline__item--${event.kind}`} key={event.id}>
                    <span className="timeline__icon" aria-hidden="true">{KIND_ICON[event.kind]}</span>
                    <div className="timeline__content">
                      <p className="timeline__heading">
                        <time dateTime={event.at}>
                          {new Date(event.at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </time>
                        <strong>
                          <span lang="en">{event.english}</span> <span className="timeline__ja">{event.japanese}</span>
                        </strong>
                      </p>
                      {event.detail ? <p className="timeline__detail">{event.detail}</p> : null}
                    </div>
                    <button type="button" className="button button--ghost button--small timeline__open" onClick={() => onOpenTab(event.tab)}>
                      開く<span className="visually-hidden">（{event.japanese}）</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

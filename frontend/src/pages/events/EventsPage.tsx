import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { eventsService } from '../../services';
import { Event, EventFilters, EventFormat, EventTheme } from '../../types';
import EventCard from '../../components/events/EventCard';
import styles from './EventsPage.module.scss';

const FORMATS = Object.values(EventFormat);
const THEMES  = Object.values(EventTheme);

const EventsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const getFilters = useCallback((): EventFilters => ({
    search:   searchParams.get('search')   ?? undefined,
    format:   (searchParams.get('format')  as EventFormat)  ?? undefined,
    theme:    (searchParams.get('theme')   as EventTheme)   ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo:   searchParams.get('dateTo')   ?? undefined,
    sortBy:   (searchParams.get('sortBy')  as any)          ?? 'date',
    order:    (searchParams.get('order')   as any)          ?? 'asc',
    page:     parseInt(searchParams.get('page') ?? '1'),
    limit:    12,
  }), [searchParams]);

  useEffect(() => {
    setLoading(true);
    eventsService.getAll(getFilters())
      .then((res) => { setEvents(res.items); setTotal(res.total); setTotalPages(res.totalPages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchParams, getFilters]);

  const setFilter = (key: string, value: string | undefined) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      next.set('page', '1');
      return next;
    });
  };

  const setPage = (page: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(page));
      return next;
    });
  };

  const currentPage = parseInt(searchParams.get('page') ?? '1');

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.topBar}>
          <div className={styles.topLeft}>
            <h1 className={styles.heading}>{t('events.explore')}</h1>
            <span className={styles.count}>{t('events.resultsCount', { count: total })}</span>
          </div>
          <div className={styles.topRight}>
            <select
              className={styles.sortSelect}
              value={`${searchParams.get('sortBy') ?? 'date'}:${searchParams.get('order') ?? 'asc'}`}
              onChange={(e) => {
                const [sortBy, order] = e.target.value.split(':');
                setSearchParams((p) => { const n = new URLSearchParams(p); n.set('sortBy', sortBy); n.set('order', order); n.set('page','1'); return n; });
              }}
            >
              <option value="date:asc">{t('events.sort.dateSoonest')}</option>
              <option value="date:desc">{t('events.sort.dateLatest')}</option>
              <option value="price:asc">{t('events.sort.priceLow')}</option>
              <option value="price:desc">{t('events.sort.priceHigh')}</option>
              <option value="title:asc">{t('events.sort.titleAZ')}</option>
            </select>
            {!filtersOpen && (
              <button className={`btn btn--secondary btn--sm ${styles.filterToggle}`} onClick={() => setFiltersOpen(true)}>
                ⚙ {t('events.filters.toggle')} {(searchParams.get('format') || searchParams.get('theme')) ? '•' : ''}
              </button>
            )}
          </div>
        </div>

        <div className={styles.layout}>
          <aside className={`${styles.sidebar} ${filtersOpen ? styles.sidebarOpen : ''}`}>
            {filtersOpen && (
              <button
                className={`btn btn--ghost btn--sm ${styles.sidebarClose}`}
                onClick={() => setFiltersOpen(false)}
              >
                ✕ {t('common.close')}
              </button>
            )}
            <div className={styles.filterSection}>
              <h3 className={styles.filterTitle}>{t('events.filters.format')}</h3>
              <div className={styles.filterOptions}>
                <button
                  className={`${styles.filterChip} ${!searchParams.get('format') ? styles.filterChipActive : ''}`}
                  onClick={() => setFilter('format', undefined)}
                >{t('events.filters.all')}</button>
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    className={`${styles.filterChip} ${searchParams.get('format') === f ? styles.filterChipActive : ''}`}
                    onClick={() => setFilter('format', searchParams.get('format') === f ? undefined : f)}
                  >
                    {t(`events.formats.${f}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterSection}>
              <h3 className={styles.filterTitle}>{t('events.filters.theme')}</h3>
              <div className={styles.filterOptions}>
                <button
                  className={`${styles.filterChip} ${!searchParams.get('theme') ? styles.filterChipActive : ''}`}
                  onClick={() => setFilter('theme', undefined)}
                >{t('events.filters.all')}</button>
                {THEMES.map((th) => (
                  <button
                    key={th}
                    className={`${styles.filterChip} ${searchParams.get('theme') === th ? styles.filterChipActive : ''}`}
                    onClick={() => setFilter('theme', searchParams.get('theme') === th ? undefined : th)}
                  >
                    {t(`events.themes.${th}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterSection}>
              <h3 className={styles.filterTitle}>{t('events.filters.dateRange')}</h3>
              <div className="field">
                <label className="field__label">{t('events.filters.from')}</label>
                <input type="date" className="field__input" value={searchParams.get('dateFrom') ?? ''} onChange={(e) => setFilter('dateFrom', e.target.value || undefined)} />
              </div>
              <div className="field" style={{ marginTop: 8 }}>
                <label className="field__label">{t('events.filters.to')}</label>
                <input type="date" className="field__input" value={searchParams.get('dateTo') ?? ''} onChange={(e) => setFilter('dateTo', e.target.value || undefined)} />
              </div>
            </div>

            <button className="btn btn--ghost btn--sm btn--full" onClick={() => { setSearchParams({}); setFiltersOpen(false); }}>
              {t('events.filters.clearAll')}
            </button>
          </aside>

          <div className={styles.content}>
            {loading ? (
              <div className="page-loading"><div className="spinner" /></div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">🔍</div>
                <div className="empty-state__title">{t('events.noEvents')}</div>
                <div className="empty-state__body">{t('events.noEventsHint')}</div>
              </div>
            ) : (
              <>
                <div className={styles.grid}>
                  {events.map((event) => <EventCard key={event.id} event={event} />)}
                </div>

                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className="btn btn--secondary btn--sm"
                      disabled={currentPage <= 1}
                      onClick={() => setPage(currentPage - 1)}
                    >{t('common.prev')}</button>
                    <span className={styles.pageInfo}>{t('common.page', { page: currentPage, total: totalPages })}</span>
                    <button
                      className="btn btn--secondary btn--sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage(currentPage + 1)}
                    >{t('common.next')}</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;

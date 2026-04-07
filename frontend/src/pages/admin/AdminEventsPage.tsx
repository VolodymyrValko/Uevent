
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { adminService } from '../../services';
import { Event } from '../../types';
import styles from './AdminPages.module.scss';

const AdminEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (p: number, s: string) => {
    setLoading(true);
    adminService.getEvents(p, s)
      .then((res) => { setEvents(res.items); setTotal(res.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page, search); }, [page, search]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setSearch(searchInput); };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    await adminService.deleteEvent(id);
    load(page, search);
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Events <span className={styles.count}>({total})</span></h1>
      <form onSubmit={handleSearch} className={styles.searchRow}>
        <input className="field__input" placeholder="Search by title…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <button type="submit" className="btn btn--primary btn--sm">Search</button>
      </form>
      {loading ? <div className="page-loading"><div className="spinner" /></div> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Title</th><th>Organizer</th><th>Date</th><th>Tickets</th><th>Price</th><th>Actions</th></tr></thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td className={styles.muted}>{ev.id}</td>
                  <td>
                    <Link to={`/events/${ev.id}`} className={styles.tableLink}>{ev.title}</Link>
                    <span className={`badge badge--${ev.format}`} style={{ marginLeft: 8 }}>{ev.format}</span>
                  </td>
                  <td className={styles.muted}>{ev.company?.name ?? '—'}</td>
                  <td className={styles.muted}>{format(new Date(ev.date), 'dd.MM.yyyy')}</td>
                  <td className={styles.muted}>{ev.ticketsSold}/{ev.maxTickets}</td>
                  <td>{Number(ev.price) === 0 ? <span className="badge badge--free">Free</span> : `$${Number(ev.price).toFixed(2)}`}</td>
                  <td>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(ev.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminEventsPage;

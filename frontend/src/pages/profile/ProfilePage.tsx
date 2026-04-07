import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useNotificationsStore } from '../../store/notificationsStore';
import { usersService, companiesService, ticketsService, eventsService } from '../../services';
import { Event, Ticket, Company } from '../../types';
import EventCard from '../../components/events/EventCard';
import styles from './ProfilePage.module.scss';

const SettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', showNameInEvents: user?.showNameInEvents ?? true });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarRemoved(false);
    setPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm(t('profile.removePhotoConfirm'))) return;
    setRemovingAvatar(true);
    try {
      const updated = await usersService.removeAvatar();
      setUser(updated);
      setPreview(null);
      setAvatarFile(null);
      setAvatarRemoved(true);
    } catch { setError(t('common.error')); }
    finally { setRemovingAvatar(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setSuccess(false); setError('');
    try {
      const fd = new FormData();
      fd.append('firstName', form.firstName);
      fd.append('lastName', form.lastName);
      fd.append('showNameInEvents', String(form.showNameInEvents));
      if (avatarFile) fd.append('avatar', avatarFile);
      const updated = await usersService.updateMe(fd);
      setUser(updated);
      setAvatarRemoved(false);
      setSuccess(true);
    } catch { setError(t('common.error')); }
    finally { setLoading(false); }
  };

  const hasAvatar = !avatarRemoved && (preview || user?.avatar);
  const avatarSrc = preview ?? (user?.avatar && !avatarRemoved ? (user.avatar.startsWith('http') ? user.avatar : `${process.env.REACT_APP_API_URL}${user.avatar}`) : null);

  return (
    <div className={styles.tabContent}>
      <h2 className={styles.tabTitle}>{t('profile.settings')}</h2>
      {success && <div className={styles.successBox}>{t('profile.updated')}</div>}
      {error && <div className={styles.errorBox}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.settingsForm}>
        <div className={styles.avatarRow}>
          <div className={styles.avatarPreview}>
            {avatarSrc ? <img src={avatarSrc} alt="Avatar" /> : <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>}
          </div>
          <div className={styles.avatarActions}>
            <label className="btn btn--secondary btn--sm">
              {t('profile.changePhoto')}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </label>
            {hasAvatar && (
              <button type="button" className="btn btn--danger btn--sm" onClick={handleRemoveAvatar} disabled={removingAvatar}>
                {removingAvatar ? t('common.loading') : t('profile.removePhoto')}
              </button>
            )}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field">
            <label className="field__label">{t('auth.register.firstName')}</label>
            <input className="field__input" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} required />
          </div>
          <div className="field">
            <label className="field__label">{t('auth.register.lastName')}</label>
            <input className="field__input" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} required />
          </div>
        </div>
        <div className="field">
          <label className="field__label">{t('auth.register.email')}</label>
          <input className="field__input" value={user?.email ?? ''} disabled style={{ opacity: 0.5 }} />
        </div>
        <label className={styles.checkRow}>
          <input type="checkbox" checked={form.showNameInEvents} onChange={(e) => setForm((p) => ({ ...p, showNameInEvents: e.target.checked }))} />
          <span>{t('profile.showName')}</span>
        </label>
        <button type="submit" className={`btn btn--primary ${loading ? 'btn--loading' : ''}`} disabled={loading}>
          {loading ? t('profile.saving') : t('profile.saveChanges')}
        </button>
      </form>
    </div>
  );
};

const TicketsTab: React.FC = () => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<Record<number, boolean>>({});
  const [resent, setResent] = useState<Record<number, boolean>>({});
  useEffect(() => { usersService.getMyTickets().then(setTickets).finally(() => setLoading(false)); }, []);

  const handleResend = async (e: React.MouseEvent, ticketId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResending((prev) => ({ ...prev, [ticketId]: true }));
    try {
      await ticketsService.resendEmail(ticketId);
      setResent((prev) => ({ ...prev, [ticketId]: true }));
      setTimeout(() => setResent((prev) => ({ ...prev, [ticketId]: false })), 3000);
    } finally {
      setResending((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  return (
    <div className={styles.tabContent}>
      <h2 className={styles.tabTitle}>{t('profile.myTickets')}</h2>
      {tickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🎫</div>
          <div className="empty-state__title">{t('profile.noTicketsYet')}</div>
          <div className="empty-state__body">{t('profile.noTicketsHint')}</div>
        </div>
      ) : (
        <div className={styles.ticketsList}>
          {tickets.map((tk) => (
            <div key={tk.id} className={styles.ticketRowWrapper}>
              <NavLink to={`/tickets/${tk.id}`} className={styles.ticketRow}>
                <div className={styles.ticketEvent}>
                  <span className={`badge badge--${tk.event?.format ?? 'other'}`}>{tk.event?.format ? t(`events.formats.${tk.event.format}`) : ''}</span>
                  <span className={styles.ticketTitle}>{tk.event?.title}</span>
                </div>
                <div className={styles.ticketInfo}>
                  {tk.event?.date && <span>{format(new Date(tk.event.date), 'dd.MM.yyyy')}</span>}
                  <span className={`${styles.ticketStatus} ${styles[tk.status]}`}>{t(`profile.ticketStatus.${tk.status}`, { defaultValue: tk.status })}</span>
                  <span>${Number(tk.price).toFixed(2)}</span>
                </div>
              </NavLink>
              <button
                className={`btn btn--secondary btn--sm ${styles.resendBtn}`}
                onClick={(e) => handleResend(e, tk.id)}
                disabled={resending[tk.id]}
                title={t('profile.resendEmail')}
              >
                {resent[tk.id] ? t('profile.resendEmailSent') : t('profile.resendEmail')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const NotificationsTab: React.FC = () => {
  const { t } = useTranslation();
  const { notifications, fetchAll, markRead, markAllRead, remove } = useNotificationsStore();
  const navigate = useNavigate();
  useEffect(() => { fetchAll(); }, [fetchAll]);
  return (
    <div className={styles.tabContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className={styles.tabTitle} style={{ margin: 0 }}>{t('profile.notifications')}</h2>
        {notifications.some((n) => !n.isRead) && (
          <button className="btn btn--secondary btn--sm" onClick={markAllRead}>{t('profile.markAllRead')}</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🔔</div>
          <div className="empty-state__title">{t('profile.allCaughtUp')}</div>
          <div className="empty-state__body">{t('profile.noNotificationsYet')}</div>
        </div>
      ) : (
        <div className={styles.notifList}>
          {notifications.map((n) => (
            <div key={n.id} className={`${styles.notifItem} ${!n.isRead ? styles.notifUnread : ''}`}>
              <button className={styles.notifContent} onClick={async () => { await markRead(n.id); if (n.relatedEventId) navigate(`/events/${n.relatedEventId}`); }}>
                <p className={styles.notifTitle}>{n.title}</p>
                <p className={styles.notifBody}>{n.body}</p>
                <p className={styles.notifTime}>{format(new Date(n.createdAt), 'dd.MM.yyyy · HH:mm')}</p>
              </button>
              <button className={styles.notifDelete} onClick={() => remove(n.id)} title={t('common.delete')}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface CompanyFormState { name: string; email: string; description: string; location: string; }
const emptyCompanyForm = (): CompanyFormState => ({ name: '', email: '', description: '', location: '' });

const CompanyTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CompanyFormState>(emptyCompanyForm());
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState<CompanyFormState>(emptyCompanyForm());
  const [createLogo, setCreateLogo] = useState<File | null>(null);
  const [editLogo, setEditLogo] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    companiesService.getMine()
      .then(setCompanies)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(createForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (createLogo) fd.append('logo', createLogo);
      const created = await companiesService.create(fd);
      setCompanies((prev) => [...prev, created]);
      setShowCreate(false);
      setCreateForm(emptyCompanyForm());
      setCreateLogo(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t('common.error'));
    } finally { setCreating(false); }
  };

  const startEdit = (company: Company) => {
    setEditingId(company.id);
    setEditForm({ name: company.name, email: company.email, description: company.description ?? '', location: company.location ?? '' });
    setEditLogo(null);
  };

  const handleSaveEdit = async (e: React.FormEvent, companyId: number) => {
    e.preventDefault();
    setSavingId(companyId); setError('');
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (editLogo) fd.append('logo', editLogo);
      const updated = await companiesService.update(companyId, fd);
      setCompanies((prev) => prev.map((c) => (c.id === companyId ? { ...updated, events: c.events } : c)));
      setEditingId(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t('common.error'));
    } finally { setSavingId(null); }
  };

  const handleDelete = async (company: Company) => {
    if (!window.confirm(t('profile.deleteCompanyConfirm', { name: company.name }))) return;
    setDeletingId(company.id);
    try {
      await companiesService.remove(company.id);
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t('common.error'));
    } finally { setDeletingId(null); }
  };

  const handleDeleteEvent = async (eventId: number, companyId: number) => {
    const ev = companies.find((c) => c.id === companyId)?.events?.find((e) => e.id === eventId);
    if (!ev) return;
    if (!window.confirm(t('profile.deleteEventConfirm', { title: ev.title }))) return;
    try {
      await eventsService.delete(eventId);
      setCompanies((prev) => prev.map((c) =>
        c.id === companyId ? { ...c, events: (c.events ?? []).filter((e) => e.id !== eventId) } : c
      ));
    } catch { }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className={styles.tabContent}>
      <div className={styles.companyTabHeader}>
        <h2 className={styles.tabTitle} style={{ margin: 0 }}>{t('profile.myCompany')}</h2>
        <button className="btn btn--primary btn--sm" onClick={() => { setShowCreate((p) => !p); setError(''); }}>
          {showCreate ? t('common.cancel') : t('profile.company.addNew')}
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {showCreate && (
        <div className={styles.companyCreateForm}>
          <h3 className={styles.companyFormTitle}>{t('profile.company.create')}</h3>
          <form onSubmit={handleCreate} className={styles.settingsForm}>
            <div className="field"><label className="field__label">{t('profile.company.name')} *</label><input className="field__input" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} required /></div>
            <div className="field"><label className="field__label">{t('profile.company.contactEmail')} *</label><input className="field__input" type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} required /></div>
            <div className="field"><label className="field__label">{t('profile.company.description')}</label><textarea className="field__textarea" value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} rows={3} /></div>
            <div className="field"><label className="field__label">{t('profile.company.location')}</label><input className="field__input" placeholder={t('profile.company.locationPlaceholder')} value={createForm.location} onChange={(e) => setCreateForm((p) => ({ ...p, location: e.target.value }))} /></div>
            <div className="field">
              <label className="field__label">{t('profile.company.logo')}</label>
              <label className="btn btn--secondary btn--sm" style={{ width: 'fit-content' }}>
                {createLogo ? createLogo.name : t('profile.company.uploadLogo')}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setCreateLogo(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className={`btn btn--primary ${creating ? 'btn--loading' : ''}`} disabled={creating}>{creating ? t('profile.company.creating') : t('profile.company.create')}</button>
              <button type="button" className="btn btn--ghost" onClick={() => { setShowCreate(false); setCreateForm(emptyCompanyForm()); setCreateLogo(null); }}>{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {companies.length === 0 && !showCreate && (
        <p style={{ color: 'var(--color-text-muted)', marginTop: 16 }}>{t('profile.company.createHint')}</p>
      )}

      {companies.map((company) => (
        <div key={company.id} className={styles.companyCard}>
          {editingId === company.id ? (
            <form onSubmit={(e) => handleSaveEdit(e, company.id)} className={styles.settingsForm}>
              <h3 className={styles.companyFormTitle}>{t('profile.company.edit')}</h3>
              <div className="field"><label className="field__label">{t('profile.company.name')} *</label><input className="field__input" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} required /></div>
              <div className="field"><label className="field__label">{t('profile.company.contactEmail')} *</label><input className="field__input" type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} required /></div>
              <div className="field"><label className="field__label">{t('profile.company.description')}</label><textarea className="field__textarea" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} /></div>
              <div className="field"><label className="field__label">{t('profile.company.location')}</label><input className="field__input" placeholder={t('profile.company.locationPlaceholder')} value={editForm.location} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))} /></div>
              <div className="field">
                <label className="field__label">{t('profile.company.logo')}</label>
                <label className="btn btn--secondary btn--sm" style={{ width: 'fit-content' }}>
                  {editLogo ? editLogo.name : t('profile.company.uploadLogo')}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setEditLogo(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className={`btn btn--primary ${savingId === company.id ? 'btn--loading' : ''}`} disabled={savingId === company.id}>{t('profile.saveChanges')}</button>
                <button type="button" className="btn btn--ghost" onClick={() => setEditingId(null)}>{t('common.cancel')}</button>
              </div>
            </form>
          ) : (
            <>
              <div className={styles.companyHeader}>
                <div className={styles.companyLogo}>
                  {company.logo
                    ? <img src={company.logo.startsWith('http') ? company.logo : `${process.env.REACT_APP_API_URL}${company.logo}`} alt={company.name} />
                    : <span>{company.name[0]}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className={styles.companyName}>{company.name}</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>{company.email}</p>
                  {company.location && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{company.location}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button className="btn btn--ghost btn--sm" onClick={() => startEdit(company)}>{t('common.edit')}</button>
                  <button
                    className={`btn btn--danger btn--sm ${deletingId === company.id ? 'btn--loading' : ''}`}
                    onClick={() => handleDelete(company)}
                    disabled={deletingId === company.id}
                  >
                    {t('profile.deleteCompany')}
                  </button>
                </div>
              </div>
              {company.description && <p style={{ marginTop: 12, lineHeight: 1.65, fontSize: '0.9rem' }}>{company.description}</p>}
            </>
          )}

          <div style={{ marginTop: 24 }}>
            <div className={styles.companyEventsHeader}>
              <h4 className={styles.companyEventsTitle}>{t('profile.company.yourEvents')}</h4>
              <button className="btn btn--primary btn--sm" onClick={() => navigate('/events/create')}>{t('nav.createEvent')}</button>
            </div>
            {company.events && company.events.length > 0 ? (
              <div className={styles.eventsGrid}>
                {company.events.map((ev) => (
                  <div key={ev.id} className={styles.eventCardWrapper}>
                    <EventCard event={ev} />
                    <div className={styles.eventCardActions}>
                      <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/events/${ev.id}/edit`)}>{t('common.edit')}</button>
                      <button className="btn btn--danger btn--sm" onClick={() => handleDeleteEvent(ev.id, company.id)}>{t('profile.deleteEvent')}</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: 8 }}>{t('profile.noCompanyEventsYet')}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationsStore();
  const navLink = (to: string, label: string, badge?: number) => (
    <NavLink
      to={to}
      end={to === '/profile'}
      className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
    >
      {label}
      {badge != null && badge > 0 && <span className={styles.navBadge}>{badge}</span>}
    </NavLink>
  );

  return (
    <div className={styles.page}>
      <div className={`container ${styles.layout}`}>
        <aside className={styles.sidebar}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.avatar
                ? <img src={user.avatar.startsWith('http') ? user.avatar : `${process.env.REACT_APP_API_URL}${user.avatar}`} alt={user.firstName} />
                : <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>}
            </div>
            <div>
              <p className={styles.userName}>{user?.firstName} {user?.lastName}</p>
              <p className={styles.userEmail}>{user?.email}</p>
            </div>
          </div>
          <nav className={styles.nav}>
            {navLink('/profile', t('profile.settings'))}
            {navLink('/profile/tickets', t('profile.myTickets'))}
            {navLink('/profile/notifications', t('profile.notifications'), unreadCount)}
            {navLink('/profile/company', t('profile.myCompany'))}
          </nav>
        </aside>
        <main className={styles.main}>
          <Routes>
            <Route index element={<SettingsTab />} />
            <Route path="tickets" element={<TicketsTab />} />
            <Route path="notifications" element={<NotificationsTab />} />
            <Route path="company" element={<CompanyTab />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;

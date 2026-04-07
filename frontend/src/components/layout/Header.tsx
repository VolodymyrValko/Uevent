import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useNotificationsStore } from '../../store/notificationsStore';
import NotificationsDropdown from '../notifications/NotificationsDropdown';
import LanguageSwitcher from './LanguageSwitcher';
import UEventLogo from './UEventLogo';
import styles from './Header.module.scss';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) fetchUnreadCount();
    const interval = setInterval(() => {
      if (isAuthenticated) fetchUnreadCount();
    }, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo}>
          <UEventLogo size={36} />
          <span className={styles.logoText}>uevent</span>
        </Link>

        <form className={styles.search} onSubmit={handleSearch}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder={t('events.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t('events.searchPlaceholder')}
          />
        </form>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          <Link
            to="/events"
            className={`${styles.navLink} ${isActive('/events') ? styles.navLinkActive : ''}`}
          >
            {t('nav.explore')}
          </Link>
          {isAuthenticated && (
            <Link
              to="/events/create"
              className={`${styles.navLink} ${isActive('/events/create') ? styles.navLinkActive : ''}`}
            >
              {t('nav.createEvent')}
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className={`${styles.navLink} ${styles.navLinkAdmin}`}>
              {t('nav.admin')}
            </Link>
          )}
        </nav>

        <div className={styles.actions}>
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              <div className={styles.notifWrap} ref={notifRef}>
                <button
                  className={styles.notifBtn}
                  onClick={() => setNotifOpen((p) => !p)}
                  aria-label="Notifications"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                {notifOpen && (
                  <NotificationsDropdown onClose={() => setNotifOpen(false)} />
                )}
              </div>

              <div className={styles.avatarWrap} ref={avatarRef}>
                <button
                  className={styles.avatarBtn}
                  onClick={() => setAvatarOpen((p) => !p)}
                  aria-label="User menu"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar.startsWith('http') ? user.avatar : `${process.env.REACT_APP_API_URL}${user.avatar}`}
                      alt={user.firstName}
                      className={styles.avatarImg}
                    />
                  ) : (
                    <span className={styles.avatarInitials}>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  )}
                </button>
                {avatarOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownUser}>
                      <span className={styles.dropdownName}>{user?.firstName} {user?.lastName}</span>
                      <span className={styles.dropdownEmail}>{user?.email}</span>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <Link to="/profile" className={styles.dropdownItem} onClick={() => setAvatarOpen(false)}>{t('profile.settings')}</Link>
                    <Link to="/profile/tickets" className={styles.dropdownItem} onClick={() => setAvatarOpen(false)}>{t('profile.myTickets')}</Link>
                    <Link to="/profile/company" className={styles.dropdownItem} onClick={() => setAvatarOpen(false)}>{t('profile.myCompany')}</Link>
                    <div className={styles.dropdownDivider} />
                    <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={handleLogout}>
                      {t('nav.signOut')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="btn btn--ghost btn--sm">{t('nav.signIn')}</Link>
              <Link to="/auth/register" className="btn btn--primary btn--sm">{t('nav.joinFree')}</Link>
            </>
          )}

          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

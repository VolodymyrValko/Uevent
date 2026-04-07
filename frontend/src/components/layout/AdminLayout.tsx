import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import styles from './AdminLayout.module.scss';

const AdminLayout: React.FC = () => (
  <div className={styles.layout}>
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarTitle}>Admin Panel</span>
      </div>
      <nav className={styles.sidebarNav}>
        <NavLink to="/admin" end className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
          📊 Dashboard
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
          👥 Users
        </NavLink>
        <NavLink to="/admin/events" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
          🎟 Events
        </NavLink>
        <NavLink to="/" className={styles.navItem}>
          ← Back to site
        </NavLink>
      </nav>
    </aside>
    <main className={styles.main}>
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;

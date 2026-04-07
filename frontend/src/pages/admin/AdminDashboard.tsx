
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services';
import styles from './AdminPages.module.scss';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<{ totalUsers: number; totalEvents: number; totalTicketsSold: number; totalRevenue: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { adminService.getStats().then(setStats).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div>
      <h1 className={styles.pageTitle}>Dashboard</h1>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>👥</span>
          <span className={styles.statValue}>{stats?.totalUsers?.toLocaleString()}</span>
          <span className={styles.statLabel}>Total Users</span>
          <Link to="/admin/users" className={styles.statLink}>Manage →</Link>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🎟</span>
          <span className={styles.statValue}>{stats?.totalEvents?.toLocaleString()}</span>
          <span className={styles.statLabel}>Total Events</span>
          <Link to="/admin/events" className={styles.statLink}>Manage →</Link>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🎫</span>
          <span className={styles.statValue}>{stats?.totalTicketsSold?.toLocaleString()}</span>
          <span className={styles.statLabel}>Tickets Sold</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>💰</span>
          <span className={styles.statValue}>${stats?.totalRevenue?.toLocaleString('en', { minimumFractionDigits: 2 })}</span>
          <span className={styles.statLabel}>Total Revenue</span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

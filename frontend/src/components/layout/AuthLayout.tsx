
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import styles from './AuthLayout.module.scss';

const AuthLayout: React.FC = () => (
  <div className={styles.layout}>
    <div className={styles.brand}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoMark}>U</span>
        <span className={styles.logoText}>event</span>
      </Link>
      <p className={styles.tagline}>Connect through events</p>
    </div>
    <div className={styles.card}>
      <Outlet />
    </div>
  </div>
);

export default AuthLayout;

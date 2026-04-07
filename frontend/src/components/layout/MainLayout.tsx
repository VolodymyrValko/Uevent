import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import styles from './MainLayout.module.scss';

const MainLayout: React.FC = () => (
  <div className={styles.layout}>
    <Header />
    <main className={styles.main}>
      <Outlet />
    </main>
    <footer className={styles.footer}>
      <div className="container">
        <span>© {new Date().getFullYear()} Uevent — Connect through events</span>
      </div>
    </footer>
  </div>
);

export default MainLayout;

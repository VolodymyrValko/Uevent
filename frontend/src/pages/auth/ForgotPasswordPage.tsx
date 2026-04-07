import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services';
import styles from './AuthPages.module.scss';

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch { setError(t('common.error')); }
    finally { setLoading(false); }
  };

  if (sent) return (
    <div className={styles.successBox}>
      <div className={styles.successIcon}>📬</div>
      <h2 className={styles.title}>{t('auth.forgotPassword.sentTitle')}</h2>
      <p className={styles.subtitle}>{t('auth.forgotPassword.sentBody')}</p>
      <Link to="/auth/login" className="btn btn--primary btn--full" style={{ marginTop: 24 }}>{t('auth.forgotPassword.backToLogin')}</Link>
    </div>
  );

  return (
    <>
      <h1 className={styles.title}>{t('auth.forgotPassword.title')}</h1>
      <p className={styles.subtitle}>{t('auth.forgotPassword.subtitle')}</p>
      {error && <div className={styles.errorBox}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="field">
          <label className="field__label">{t('auth.login.email')}</label>
          <input className="field__input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <button type="submit" className={`btn btn--primary btn--full ${loading ? 'btn--loading' : ''}`} disabled={loading}>
          {loading ? t('auth.forgotPassword.submitting') : t('auth.forgotPassword.submit')}
        </button>
      </form>
      <p className={styles.switchText}><Link to="/auth/login" className={styles.link}>← {t('auth.forgotPassword.backToLogin')}</Link></p>
    </>
  );
};

export default ForgotPasswordPage;

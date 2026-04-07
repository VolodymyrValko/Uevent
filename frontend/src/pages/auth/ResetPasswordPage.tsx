
import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services';
import styles from './AuthPages.module.scss';

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError(t('auth.resetPassword.passwordsMismatch')); return; }
    if (password.length < 8) { setError(t('auth.register.passwordHint')); return; }
    setLoading(true); setError('');
    try {
      await authService.resetPassword(token, password);
      navigate('/auth/login?reset=1');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t('common.error'));
    } finally { setLoading(false); }
  };

  if (!token) return (
    <div className={styles.errorBox}>{t('auth.resetPassword.invalidLink')} <Link to="/auth/forgot-password" className={styles.link}>{t('auth.resetPassword.requestNew')}</Link>.</div>
  );

  return (
    <>
      <h1 className={styles.title}>{t('auth.resetPassword.title')}</h1>
      <p className={styles.subtitle}>{t('auth.resetPassword.subtitle')}</p>
      {error && <div className={styles.errorBox}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="field">
          <label className="field__label">{t('auth.resetPassword.newPassword')}</label>
          <input className="field__input" type="password" placeholder={t('auth.register.passwordHint')} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
        </div>
        <div className="field">
          <label className="field__label">{t('auth.resetPassword.confirmPassword')}</label>
          <input className="field__input" type="password" placeholder={t('auth.register.passwordHint')} value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
        </div>
        <button type="submit" className={`btn btn--primary btn--full ${loading ? 'btn--loading' : ''}`} disabled={loading}>
          {loading ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit')}
        </button>
      </form>
    </>
  );
};

export default ResetPasswordPage;

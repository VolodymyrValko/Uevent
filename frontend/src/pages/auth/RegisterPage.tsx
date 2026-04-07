
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import styles from './AuthPages.module.scss';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { setError(t('auth.register.passwordHint')); return; }
    setError(''); setLoading(true);
    try {
      const res = await register(form);
      setSuccess(res.message);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t('common.error'));
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className={styles.successBox}>
      <div className={styles.successIcon}>✅</div>
      <h2 className={styles.title}>{t('auth.register.title')}</h2>
      <p className={styles.subtitle}>{success}</p>
      <Link to="/auth/login" className="btn btn--primary btn--full" style={{ marginTop: 24 }}>{t('auth.register.signIn')}</Link>
    </div>
  );

  return (
    <>
      <h1 className={styles.title}>{t('auth.register.title')}</h1>
      <p className={styles.subtitle}>{t('auth.register.subtitle')}</p>
      {error && <div className={styles.errorBox}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.row}>
          <div className="field">
            <label className="field__label">{t('auth.register.firstName')}</label>
            <input className="field__input" type="text" placeholder="John" value={form.firstName} onChange={set('firstName')} required autoComplete="given-name" />
          </div>
          <div className="field">
            <label className="field__label">{t('auth.register.lastName')}</label>
            <input className="field__input" type="text" placeholder="Doe" value={form.lastName} onChange={set('lastName')} required autoComplete="family-name" />
          </div>
        </div>
        <div className="field">
          <label className="field__label">{t('auth.register.email')}</label>
          <input className="field__input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required autoComplete="email" />
        </div>
        <div className="field">
          <label className="field__label">{t('auth.register.password')}</label>
          <input className="field__input" type="password" placeholder={t('auth.register.passwordHint')} value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" />
        </div>
        <button type="submit" className={`btn btn--primary btn--full ${loading ? 'btn--loading' : ''}`} disabled={loading}>
          {loading ? t('auth.register.submitting') : t('auth.register.submit')}
        </button>
      </form>
      <p className={styles.switchText}>
        {t('auth.register.hasAccount')} <Link to="/auth/login" className={styles.link}>{t('auth.register.signIn')}</Link>
      </p>
    </>
  );
};

export { RegisterPage as default };

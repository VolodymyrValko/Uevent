import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitcher.module.scss';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'uk', label: 'UA' },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className={styles.switcher}>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          className={`${styles.btn} ${i18n.language === code ? styles.active : ''}`}
          onClick={() => i18n.changeLanguage(code)}
          aria-label={`Switch to ${label}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;

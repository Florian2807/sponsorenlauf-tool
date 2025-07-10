import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from '../styles/Topbar.module.css';

export default function Topbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference or saved preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className={styles.topbar}>
      <img src="logo.png" alt="Logo" className={styles.logo} />
      <div className={styles.navContainer}>
        <Link href="/scan" className={styles.tab}>
          Runden zählen
        </Link>
        <Link href="/show" className={styles.tab}>
          Schüler anzeigen
        </Link>
        <Link href="/manage" className={styles.tab}>
          Schüler verwalten
        </Link>
        <Link href="/statistics" className={styles.tab}>
          Statistiken
        </Link>
        <Link href="/setup" className={styles.tab}>
          Setup
        </Link>
      </div>
      <button
        className={styles.themeToggle}
        onClick={toggleTheme}
        title={`Zu ${isDarkMode ? 'Hell' : 'Dunkel'}modus wechseln`}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    </div>
  );
}

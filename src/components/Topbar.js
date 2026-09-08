/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from '../styles/Topbar.module.css';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function Topbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  const { authenticated, logout } = useAdminAuth();

  const applyTheme = (darkMode, persist = false) => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);

    if (persist) {
      localStorage.setItem('theme', theme);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const darkMode = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

    setIsDarkMode(darkMode);
    applyTheme(darkMode);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    applyTheme(newTheme, true);
  };

  const primaryNavItems = [
    { href: '/scan', label: 'Runden zählen' },
    { href: '/show', label: 'Schüler anzeigen' },
    { href: '/statistics', label: 'Statistiken' },
    ...(authenticated ? [
      { href: '/manage', label: 'Schüler verwalten' },
      { href: '/setup', label: 'Admin' },
    ] : [{ href: '/admin-login', label: 'Admin 🔒' }]),
  ];

  const isActive = (href) => router.pathname === href;

  const getLinkClassName = (href) => {
    const classes = [styles.navLink];

    if (isActive(href)) {
      classes.push(styles.navLinkActive);
    }

    return classes.join(' ');
  };

  return (
    <header className={styles.topbar}>
      <Link href="/scan" className={styles.brand} aria-label="Zur Scan-Ansicht wechseln">
        <img src="/logo.png" alt="Sponsorenlauf Tool" className={styles.logo} />
      </Link>

      <nav className={styles.navContainer} aria-label="Hauptnavigation">
        <div className={styles.primaryNav}>
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={getLinkClassName(item.href)}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className={styles.headerActions}>
        {authenticated && (
          <button
            className={styles.logoutButton}
            type="button"
            onClick={async () => {
              await logout();
              router.push('/scan');
            }}
          >
            Sperren
          </button>
        )}
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          type="button"
          aria-label={`Zu ${isDarkMode ? 'Hell' : 'Dunkel'}modus wechseln`}
          aria-pressed={isDarkMode}
          title={`Zu ${isDarkMode ? 'Hell' : 'Dunkel'}modus wechseln`}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}

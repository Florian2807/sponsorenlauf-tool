/* eslint-disable @next/next/no-img-element */
import HeaderSettings from './HeaderSettings';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Topbar.module.css';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function Topbar({ hidden = false }) {
  const router = useRouter();
  const { authenticated } = useAdminAuth();

  if (hidden) return null;

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
              className={styles.navLink}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              <span
                key={router.pathname}
                className={`${styles.navLinkLabel} ${isActive(item.href) ? styles.navLinkActive : ''}`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      <HeaderSettings />
    </header>
  );
}

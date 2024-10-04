import Link from 'next/link';
import styles from '../styles/Topbar.module.css'; // Importiere die CSS-Datei

export default function Topbar() {
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
    </div>
  );
}

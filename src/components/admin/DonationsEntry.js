import Link from 'next/link';
import styles from '../../styles/Donations.module.css';

export default function DonationsEntry() {
    return <section className={`setup-resource-panel ${styles.entryCard}`} aria-labelledby="donations-entry-title">
        <div className={styles.entryHeader}>
            <span className={styles.entryIcon} aria-hidden="true"><i className="fa-solid fa-coins" /></span>
            <div>
                <h1 id="donations-entry-title" className="page-title">Spenden eintragen</h1>
                <p>Zusagen und Zahlungseingänge in einem eigenen Arbeitsbereich verwalten.</p>
            </div>
        </div>
        <div className={styles.entryFeatures}>
            <div><i className="fa-solid fa-file-invoice" aria-hidden="true" /><h2>Beträge erfassen</h2><p>Festhalten, wie viel jeder Schüler überweisen soll.</p></div>
            <div><i className="fa-solid fa-check-double" aria-hidden="true" /><h2>Zahlungen abgleichen</h2><p>Eingänge buchen und offene Beträge im Blick behalten.</p></div>
        </div>
        <div className={styles.entryFooter}>
            <p>Öffnet die Spendenseite. Von dort kommst du direkt zum Setup zurück.</p>
            <Link href="/donations" className="btn btn-primary">Spendenbereich öffnen <i className="fa-solid fa-arrow-right" aria-hidden="true" /></Link>
        </div>
    </section>;
}

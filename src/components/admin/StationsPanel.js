import Link from 'next/link';
import { useContext, useState } from 'react';
import { useModuleConfig } from '../../contexts/ModuleConfigContext';
import { useScannerStation } from '../../contexts/ScannerStationContext';
import { PanelNavigationContext } from '../../contexts/PanelNavigationContext';
import ScannerStationAdmin from '../ScannerStationAdmin';

export default function StationsPanel({ embedded = false }) {
    const navigation = useContext(PanelNavigationContext);
    const { config, updateModule, isLoading } = useModuleConfig();
    const { enabled } = useScannerStation();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const activate = async () => {
        setBusy(true);
        setError('');
        try { await updateModule('scannerStations', true); }
        catch (error) { setError(error.message); }
        finally { setBusy(false); }
    };
    return <div className={embedded ? "setup-resource-panel stations-page" : "app-page stations-page"}>
        {!embedded && <Link className="station-back-link" href="/setup"><i className="fa-solid fa-arrow-left" aria-hidden="true" /> Zurück zu Admin</Link>}
        <header className="stations-page-header">
            <div><span className="station-eyebrow">Organisation am Lauftag</span><h1>Scanner-Stationen</h1>
                <p>Stationen benennen, Klassen zuordnen und Scans richtig zuordnen.</p></div>
            <span className={`station-module-state ${enabled ? 'is-active' : ''}`}><span /> {enabled ? 'Modul aktiv' : 'Modul deaktiviert'}</span>
        </header>
        {!config.scannerStations ? <section className="station-activation">
            <span className="station-activation-icon"><i className="fa-solid fa-laptop" aria-hidden="true" /></span>
            <div><h2>Jeder Laptop weiß, wofür er zuständig ist.</h2>
                <p>Lege Stationen wie „Ziel links“ oder „Jahrgang 5“ an. Die Helfer wählen ihre Station auf der Scan-Seite und können deren Klassenregeln einstellen.</p>
                <div className="station-activation-points"><span><i className="fa-solid fa-check" aria-hidden="true" /> Namen bei jedem Scan</span>
                    <span><i className="fa-solid fa-check" aria-hidden="true" /> Regeln für Klassen & Jahrgänge</span>
                    <span><i className="fa-solid fa-check" aria-hidden="true" /> Mehrere Laptops pro Station</span></div>
                {error && <p role="alert">{error}</p>}
                <button type="button" className="btn" disabled={busy || isLoading} onClick={embedded ? () => navigation.openView('moduleSettings') : activate}>{embedded ? 'Unter Module verwalten aktivieren' : busy ? 'Wird aktiviert …' : 'Scanner-Stationen aktivieren'}</button>
                <p className="station-activation-note">Vorhandene Scans bleiben erhalten. Das Modul lässt sich unter „Module verwalten“ wieder deaktivieren.</p>
            </div>
        </section> : <ScannerStationAdmin />}
    </div>;
}

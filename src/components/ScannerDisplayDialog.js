import { useEffect, useId, useState } from 'react';
import BaseDialog from './BaseDialog';

export default function ScannerDisplayDialog({ dialogRef, deviceId, device, onClose, openVersion }) {
    const [displayUrl, setDisplayUrl] = useState('');
    const [copyStatus, setCopyStatus] = useState('');
    const linkId = useId();
    useEffect(() => {
        setDisplayUrl(deviceId ? `${window.location.origin}/display?device=${encodeURIComponent(deviceId)}` : '');
    }, [deviceId]);
    useEffect(() => { setCopyStatus(''); }, [openVersion]);
    return <BaseDialog dialogRef={dialogRef} title="Rundenanzeige verbinden" onClose={onClose}>
        <p>Öffne auf dem iPad <strong>/display</strong> und wähle <strong>{device?.name || 'diesen Scanner'}</strong> aus. Die Rundenanzeige zeigt nach jedem Scan Name, Klasse und Rundenstand.</p>
        <details className="scan-display-direct-link"><summary>Direkten Link teilen</summary>
            <label className="form-label" htmlFor={linkId}>Link für das iPad</label>
            <input id={linkId} value={displayUrl} readOnly onFocus={event => event.target.select()} />
            <div className="live-action-buttons"><button type="button" className="btn" disabled={!displayUrl} onClick={async () => {
                try { await navigator.clipboard.writeText(displayUrl); setCopyStatus('Link kopiert'); }
                catch { setCopyStatus('Bitte den Link im Textfeld markieren und kopieren.'); }
            }}>Link kopieren</button>{displayUrl && <a className="btn btn-secondary" href={displayUrl} target="_blank" rel="noreferrer">Rundenanzeige öffnen</a>}</div>
            <p className="text-muted">Öffne den Link auf dem iPad im selben Netzwerk. Bei „localhost“ verwende stattdessen die Netzwerkadresse des Servers. Nach 30 Sekunden wird die Anzeige wieder frei.</p>
            {copyStatus && <p role="status">{copyStatus}</p>}
        </details>
    </BaseDialog>;
}

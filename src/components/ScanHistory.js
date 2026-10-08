import { formatDate } from '../utils/constants';

export function FeedStatus({ status }) {
    return <span className={`status-pill ${status === 'live' ? 'status-pill-ready' : 'status-pill-warning'}`} aria-live="polite">
        {status === 'live' ? 'Live' : status === 'offline' ? 'Verbindung unterbrochen · verbinde erneut' : 'Verbinde…'}
    </span>;
}

export default function ScanHistory({ scans, status, onSelect, disabled = false, title = 'Letzte Scans', showDevice = false, selectedId, emptyMessage, description }) {
    return <section className="scan-history ui-surface" aria-label={title}>
        <div className="scan-history-heading"><h2>{title}</h2><FeedStatus status={status} /></div>
        {description && <p className="live-feed-description">{description}</p>}
        {scans.length ? <ol className="scan-history-list">
            {scans.map(scan => <li key={scan.id}>
                <button type="button" className={`scan-history-entry${selectedId === scan.student.id ? ' scan-history-entry-selected' : ''}`} aria-pressed={selectedId === undefined ? undefined : selectedId === scan.student.id} disabled={disabled} onClick={event => onSelect(scan.student, event.currentTarget)}>
                    {showDevice && <span className="live-scan-avatar" aria-hidden="true">{scan.student.vorname?.[0]}{scan.student.nachname?.[0]}</span>}
                    <span className="scan-history-person"><strong>{scan.student.vorname} {scan.student.nachname}</strong>
                        <span>Klasse {scan.student.klasse} · ID {scan.student.id}</span>
                        {showDevice && <span className="live-scan-device"><i className="fa-solid fa-laptop" aria-hidden="true" /> {scan.deviceName || 'Unbenannter Scanner'}</span>}
                    </span>
                    <span className="scan-history-time"><time dateTime={scan.timestamp}>{formatDate(new Date(scan.timestamp), 'de-DE')}</time>
                        {showDevice ? <span className="live-scan-rounds"><strong>{scan.roundNumber}.</strong> Runde</span> : <span>{scan.student.roundCount} {scan.student.roundCount === 1 ? 'Runde' : 'Runden'}</span>}</span>
                </button>
            </li>)}
        </ol> : <p className="empty-state">{status === 'offline' ? 'Scans momentan nicht erreichbar.' : status === 'connecting' ? 'Lade Scans…' : emptyMessage || 'Noch keine Scans.'}</p>}
    </section>;
}

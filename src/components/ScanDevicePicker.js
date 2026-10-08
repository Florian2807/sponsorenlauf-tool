import { useEffect, useRef } from 'react';

export default function ScanDevicePicker({ devices, selectedId, loading, error, onSelect, onCancel, onRefresh, invalidLink }) {
    const headingRef = useRef(null);
    const activeCount = devices.filter(device => device.online).length;
    useEffect(() => { headingRef.current?.focus(); }, []);
    return <div className="scan-device-picker">
        <div className="scan-device-picker-heading">
            <span className="scan-device-picker-icon"><i className="fa-solid fa-laptop" aria-hidden="true" /></span>
            <h1 ref={headingRef} tabIndex={-1}>Scanner auswählen</h1>
            <p>Wähle den Scanner, dessen Scans dieses iPad anzeigen soll.</p>
        </div>
        {invalidLink && <p role="alert" className="message message-warning">Dieser Anzeige-Link ist ungültig. Wähle einen Scanner aus der Liste.</p>}
        {error && <p role="alert" className="message message-error">{error}</p>}
        <div className="scan-device-picker-toolbar">
            <span>{loading ? 'Scanner werden geladen …' : `${activeCount} ${activeCount === 1 ? 'aktiver Scanner' : 'aktive Scanner'}`}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={loading}>Aktualisieren</button>
        </div>
        <div className="scan-device-list">
            {devices.map(device => <button key={device.id} type="button"
                className={`scan-device-card${device.id === selectedId ? ' scan-device-card-selected' : ''}`}
                aria-pressed={device.id === selectedId} onClick={() => onSelect(device)}>
                <span className="scan-device-card-icon"><i className="fa-solid fa-laptop" aria-hidden="true" /></span>
                <span className="scan-device-card-copy"><strong>{device.name}</strong>
                    <small>Gerät {device.number}{device.id === selectedId ? ' · Ausgewählt' : ''}</small></span>
                <span className={`scan-device-availability${device.online ? '' : ' scan-device-offline'}`}>
                    <span aria-hidden="true" />{device.online ? 'Aktiv' : 'Offline'}</span>
            </button>)}
        </div>
        {!loading && !error && !devices.length && <div className="scan-device-picker-empty">
            <strong>Noch kein Scanner aktiv</strong>
            <p>Öffne „Runden zählen“ auf einem Laptop. Er erscheint hier automatisch.</p>
        </div>}
        {onCancel && <button className="btn btn-secondary" type="button" onClick={onCancel}>Zur Anzeige</button>}
    </div>;
}

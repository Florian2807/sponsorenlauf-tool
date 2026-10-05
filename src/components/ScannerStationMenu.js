import { useRef, useState, useEffect, useId } from 'react';
import { useScannerStation } from '../contexts/ScannerStationContext';
import BaseDialog from './BaseDialog';
import ScannerStationSettings from './ScannerStationSettings';

export default function ScannerStationMenu() {
    const { enabled, stations, stationId, selectStation, refresh, error } = useScannerStation();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    const triggerRef = useRef(null);
    const menuId = useId();
    const tooltipId = useId();
    const featureTooltipId = useId();
    const [saved, setSaved] = useState(false);
    const dialogRef = useRef(null);
    const [editorVersion, setEditorVersion] = useState(0);
    const station = stations.find((item) => item.id === stationId);
    useEffect(() => {
        if (!open) return;
        const handleOutside = (event) => {
            if (!menuRef.current?.contains(event.target)) setOpen(false);
        };
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };
        document.addEventListener('pointerdown', handleOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('pointerdown', handleOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);
    if (!enabled) return null;
    return <div ref={menuRef} className="station-menu" data-scanner-controls>
        <button ref={triggerRef} type="button" className="station-menu-trigger" aria-label="Scanner-Station auswählen"
            aria-describedby={!open ? tooltipId : undefined}
            aria-expanded={open} aria-controls={menuId}
            onClick={() => { setOpen((previous) => !previous); if (!open) refresh(); }}>
            <i className="fa-solid fa-laptop" aria-hidden="true" />
        </button>
        {!open && <div id={tooltipId} className="station-menu-tooltip" role="tooltip">
            <strong>Scanner-Station</strong>
            <span>Station für diesen Laptop auswählen und Klassenregeln einstellen.</span>
            <small>Aktuell: {station?.name || 'Standard-Scanner'}</small>
        </div>}
        <div id={menuId} className="station-menu-dropdown" hidden={!open}>
        <div className="station-menu-select">
            <span className="station-feature-help" tabIndex={0} aria-label="Scanner-Stationen erklärt" aria-describedby={featureTooltipId}>
                <i className="fa-solid fa-laptop" aria-hidden="true" />
                <span id={featureTooltipId} className="station-feature-tooltip" role="tooltip">
                    Scanner-Stationen geben diesem Laptop einen Stationsnamen und Klassenregeln, damit du Scans ihrer Station zuordnen kannst.
                </span>
            </span>
            <div>
                <label htmlFor="scanner-station-menu" className="sr-only">Scanner-Station</label>
                <select id="scanner-station-menu" aria-label="Scanner-Station" value={stationId} onFocus={refresh}
                    onChange={(event) => { selectStation(event.target.value); setSaved(false); event.target.blur(); }}>
                    {!stations.length && <option value="default">Standard-Scanner</option>}
                    {stations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down station-select-chevron" aria-hidden="true" />
            </div>
        </div>
        <button type="button" className="station-menu-settings" title="Stationsregeln einstellen"
            onClick={async () => { setSaved(false); setOpen(false); await refresh(); setEditorVersion((version) => version + 1); dialogRef.current?.showModal(); }}
            aria-label="Stationsregeln einstellen"><i className="fa-solid fa-sliders" aria-hidden="true" /></button>
        {saved && <span className="station-menu-saved" role="status"><i className="fa-solid fa-check" aria-hidden="true" /><span className="sr-only">Stationsregeln gespeichert</span></span>}
        {error && <span className="station-menu-error" title={error} role="alert"><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Verbindung prüfen</span>}
        </div>
        <BaseDialog onClose={() => triggerRef.current?.focus()} dialogRef={dialogRef} title="Station einstellen" size="large" className="scanner-station-dialog" showDefaultClose={false}>
            <div className="station-dialog-intro"><strong>{station?.name || 'Standard-Scanner'}</strong><span>Klassen und Scan-Verhalten</span></div>
            <ScannerStationSettings key={editorVersion + '-' + stationId} stationId={stationId}
                onCancel={() => dialogRef.current?.close()}
                onSaved={() => { dialogRef.current?.close(); setSaved(true); }} />
        </BaseDialog>
    </div>;
}

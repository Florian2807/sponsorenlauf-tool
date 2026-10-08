import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useModuleConfig } from '../contexts/ModuleConfigContext';
import { useScanFeed } from '../hooks/useScanFeed';
import { FeedStatus } from '../components/ScanHistory';
import ThemeToggle from '../components/ThemeToggle';
import ScanDevicePicker from '../components/ScanDevicePicker';
import { useScanDevices } from '../hooks/useScanDevices';
import { calculateTimeDifference, formatDate } from '../utils/constants';

const validDeviceId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{8,100}$/.test(value);

export default function Display() {
    const { config, isLoading, refresh } = useModuleConfig();
    // Keep the module status current even while no scanner stream is connected.
    useEffect(() => {
        const interval = setInterval(() => { if (!document.hidden) refresh(); }, 30000);
        return () => clearInterval(interval);
    }, [refresh]);
    if (isLoading || config.roundDisplay !== true) return <div className="student-display">
        <header className="student-display-header"><span>Sponsorenlauf <strong>Rundenanzeige</strong></span><ThemeToggle /></header>
        <section className="student-display-content"><div className="student-display-empty">
            {isLoading ? <p>Anzeige wird geladen …</p> : <>
                <i className="fa-solid fa-display" aria-hidden="true" />
                <h1>Rundenanzeige ist deaktiviert</h1>
                <p>Aktiviere das Modul „Rundenanzeige“ im Setup unter „Module verwalten“.</p>
            </>}
        </div></section>
    </div>;
    return <ActiveDisplay />;
}

function ActiveDisplay() {
    const router = useRouter();
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [selectionReady, setSelectionReady] = useState(false);
    const [choosing, setChoosing] = useState(false);
    const switchButton = useRef(null);
    const controls = useRef(null);
    const [controlsOpen, setControlsOpen] = useState(false);
    useEffect(() => {
        if (!controlsOpen) return;
        const outside = event => {
            if (!controls.current?.contains(event.target)) setControlsOpen(false);
        };
        const escape = event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setControlsOpen(false);
                switchButton.current?.focus();
            }
        };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('pointerdown', outside);
            document.removeEventListener('keydown', escape);
        };
    }, [controlsOpen]);
    const routeDevice = router.query.device;
    const invalidLink = routeDevice !== undefined && !validDeviceId(routeDevice);
    useEffect(() => {
        if (!router.isReady) return;
        const next = validDeviceId(routeDevice) ? { id: routeDevice, name: 'Scanner' } : null;
        setSelectedDevice(current => current?.id === next?.id ? current : next);
        setSelectionReady(true);
    }, [router.isReady, routeDevice]);
    const device = selectedDevice?.id;
    const valid = validDeviceId(device);
    const showPicker = selectionReady && (!valid || choosing);
    const registry = useScanDevices(device, selectionReady, showPicker || (valid && !selectedDevice?.number));
    const { scans, status, errorId, deviceMetadata, clearedThroughScanId } = useScanFeed(device, selectionReady && valid, 'display');
    const knownDevice = registry.devices.find(item => item.id === device) || selectedDevice;
    const currentDevice = deviceMetadata?.id === device ? deviceMetadata : knownDevice;
    useEffect(() => {
        if (!currentDevice || !valid) return;
        setSelectedDevice(current => current?.id === currentDevice.id && current !== currentDevice ? currentDevice : current);
    }, [currentDevice, valid]);
    const closePicker = () => { setChoosing(false); requestAnimationFrame(() => switchButton.current?.focus()); };
    useEffect(() => {
        if (!choosing || !valid) return;
        const escape = event => {
            if (event.key === 'Escape') {
                event.preventDefault(); setChoosing(false);
                requestAnimationFrame(() => switchButton.current?.focus());
            }
        };
        document.addEventListener('keydown', escape);
        return () => document.removeEventListener('keydown', escape);
    }, [choosing, valid]);
    const [now, setNow] = useState(0);
    const [fullScreenError, setFullScreenError] = useState('');
    const [pulseId, setPulseId] = useState(null);
    const lastScan = useRef({ device: null, id: null });
    const latest = scans[0];
    const scanId = latest?.id || 0;
    const scanTimestamp = latest?.timestamp;
    useEffect(() => {
        if (status !== 'live') { setPulseId(null); return; }
        if (lastScan.current.device !== device) {
            lastScan.current = { device, id: scanId };
            setPulseId(null);
            return;
        }
        // Only a newly stored, fresh scan flashes; edits/replays/reconnects do not.
        if (scanId > lastScan.current.id && Date.now() - new Date(scanTimestamp).getTime() < 5000) {
            setPulseId(scanId);
        }
        lastScan.current.id = Math.max(lastScan.current.id, scanId);
    }, [device, status, scanId, scanTimestamp]);
    useEffect(() => {
        if (status === 'live' && errorId) setPulseId(`error:${errorId}`);
    }, [errorId, status]);
    useEffect(() => {
        if (pulseId === null) return;
        const timer = setTimeout(() => setPulseId(null), 300);
        return () => clearTimeout(timer);
    }, [pulseId]);
    useEffect(() => {
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);
    const recent = latest && now - new Date(latest.timestamp).getTime() < 30000;
    const visible = valid && status === 'live' && recent && scanId > (clearedThroughScanId || 0);
    const errorPulse = typeof pulseId === 'string';
    return <div className="student-display">
        {!showPicker && valid && status === 'live' && pulseId !== null && (visible || errorPulse)
            && <span key={pulseId} className={`student-display-scan-pulse${errorPulse ? ' student-display-scan-pulse-error' : ''}`} aria-hidden="true" />}
        <header className="student-display-header"><span>Sponsorenlauf <strong>Deine Runden</strong></span>
            <div className="student-display-header-actions">
                {valid && !showPicker && <span className="student-display-connection" title={`Verbunden mit ${currentDevice?.name || 'Scanner'}`}>
                    <i className="fa-solid fa-laptop" aria-hidden="true" /><strong>{currentDevice?.name || 'Scanner'}</strong>
                </span>}
                {valid && <FeedStatus status={status} />}
                <div ref={controls} className="student-display-controls" onBlur={event => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setControlsOpen(false);
                }}>
                    <button ref={switchButton} type="button" className="student-display-controls-trigger" aria-label="Anzeigeoptionen"
                        title="Anzeigeoptionen" aria-expanded={controlsOpen} aria-controls="display-options"
                        onClick={() => setControlsOpen(open => !open)}><i className="fa-solid fa-ellipsis" aria-hidden="true" /></button>
                    <div id="display-options" className="student-display-controls-popover" hidden={!controlsOpen}>
                        <p>Anzeigeoptionen</p>
                        {valid && !showPicker && <button type="button" className="student-display-controls-action" onClick={() => {
                            setControlsOpen(false); setChoosing(true);
                        }}><i className="fa-solid fa-laptop" aria-hidden="true" /><span>Scanner wechseln</span></button>}
                        <button type="button" className="student-display-controls-action" onClick={async () => {
                            try {
                                if (document.fullscreenElement) await document.exitFullscreen();
                                else await document.documentElement.requestFullscreen();
                                setFullScreenError('');
                            } catch { setFullScreenError('Vollbild wird von diesem Browser nicht unterstützt.'); }
                            setControlsOpen(false); switchButton.current?.focus();
                        }}><i className="fa-solid fa-expand" aria-hidden="true" /><span>Vollbild umschalten</span></button>
                        <ThemeToggle className="student-display-controls-action" showLabel />
                    </div>
                </div>
            </div></header>
        {fullScreenError && <p role="status" className="text-muted">{fullScreenError}</p>}
        {showPicker ? <ScanDevicePicker devices={registry.devices} selectedId={device} loading={registry.loading}
            error={registry.error} invalidLink={invalidLink} onRefresh={registry.refresh} onCancel={valid ? closePicker : null}
            onSelect={next => {
                setSelectedDevice(next); setChoosing(false);
                router.replace({ pathname: '/display', query: { device: next.id } }, undefined, { shallow: true });
            }} /> : <section className="student-display-content" aria-live="polite" aria-atomic="true">
            {!selectionReady ? <div className="student-display-empty"><p>Anzeige wird geladen …</p></div>
                : visible ? <div className="student-display-result" key={latest.id}>
                    <span className="student-display-class">Klasse {latest.student.klasse}</span>
                    <h1>{latest.student.vorname} {latest.student.nachname}</h1>
                    <div className="student-display-rounds"><strong>{latest.student.roundCount}</strong><span>{latest.student.roundCount === 1 ? 'Runde geschafft' : 'Runden geschafft'}</span></div>
                    <div className="student-display-metrics"><div><span>Zuletzt gescannt</span><strong>{formatDate(new Date(latest.timestamp), 'de-DE')} Uhr</strong></div>
                        <div><span>Letzte Runde</span><strong>{calculateTimeDifference(latest.timestamp, latest.previousTimestamp) || 'Deine erste Runde'}</strong></div></div>
                    <p className="student-display-cheer">Weiter so!</p>
                </div>
                    : <div className="student-display-empty"><i className="fa-solid fa-person-running" aria-hidden="true" /><h1>{status === 'offline' ? 'Verbindung wird wiederhergestellt' : 'Bereit für deinen Scan'}</h1>
                        <p>{status === 'offline' ? 'Bitte kurz warten.' : 'Deine Runden erscheinen hier automatisch.'}</p></div>}
        </section>}
    </div>;
}

Display.fullScreen = true;

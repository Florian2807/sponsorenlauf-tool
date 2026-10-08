import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useScanFeed } from '../hooks/useScanFeed';
import { useApi } from '../hooks/useApi';
import ScanHistory from '../components/ScanHistory';
import { useScanPages } from '../hooks/useScanPages';
import StudentAutocomplete from '../components/StudentAutocomplete';
import LiveStudentActions from '../components/LiveStudentActions';
import { groupClassesByGrade } from '../utils/classFilterGroups';
import LiveFilterMenu from '../components/LiveFilterMenu';

export default function Live() {
    const [laptop, setLaptop] = useState('all');
    const [klasse, setKlasse] = useState('all');
    const [query, setQuery] = useState('');
    const searchRef = useRef(null);
    const sidebarRef = useRef(null);
    const feedRef = useRef(null);
    const lastScanRef = useRef(null);
    const [devices, setDevices] = useState([]);
    const [classes, setClasses] = useState([]);
    const [classStructure, setClassStructure] = useState({});
    const [selected, setSelected] = useState(null);
    const selectedId = selected?.id;
    const { request } = useApi();
    const { scans: recentScans, status, deviceMetadata, studentChange } = useScanFeed(undefined, true, 'admin');
    const { scans, total, loading, error, loadMore, reset, reload } = useScanPages({ laptop, klasse, query, status, deviceMetadata, studentChange });
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const [deviceData, classData, structureData] = await Promise.all([
                    request('/api/scan-devices'), request('/api/getAvailableClasses', { cacheMs: 30000 }), request('/api/classStructure'),
                ]);
                if (!cancelled) {
                    setDevices(current => [...new Map([...current, ...deviceData.devices].map(device => [device.id, device])).values()]);
                    setClasses(classData);
                    setClassStructure(structureData);
                }
            } catch { /* useApi displays a recoverable metadata error. */ }
        };
        load();
        window.addEventListener('sponsorenlauf:settings-changed', load);
        return () => { cancelled = true; window.removeEventListener('sponsorenlauf:settings-changed', load); };
    }, [request]);
    useEffect(() => {
        setDevices(current => [...new Map([...current, ...[...scans, ...recentScans].map(scan => ({ id: scan.deviceId, name: scan.deviceName })), ...(deviceMetadata ? [deviceMetadata] : [])].map(device => [device.id, device])).values()]);
        setClasses(current => [...new Set([...current, ...scans.map(scan => scan.student.klasse)])].filter(Boolean));
        setSelected(current => {
            const latest = scans.find(scan => scan.student.id === current?.id)?.student;
            return latest && Object.entries(latest).some(([key, value]) => current[key] !== value) ? { ...current, ...latest } : current;
        });
    }, [scans, recentScans, deviceMetadata]);
    // The selected student stays current when filters or pagination hide their scans.
    useEffect(() => {
        if (!selectedId || status !== 'live' || scans.some(scan => scan.student.id === selectedId)) return;
        if (studentChange?.ids.length && !studentChange.ids.includes(String(selectedId))) return;
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const student = await request(`/api/students/${selectedId}`, { showErrorMessage: false });
                if (!cancelled) setSelected(current => current?.id === student.id ? { ...current, ...student } : current);
            } catch (error) {
                if (!cancelled && error.status === 404) setSelected(null);
            }
        }, 80);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [selectedId, studentChange, status, scans, request]);
    useEffect(() => {
        const sidebar = sidebarRef.current;
        const header = document.querySelector('header');
        const updateSticky = () => {
            const offset = (header?.getBoundingClientRect().height || 0) + 20;
            sidebar.closest('.live-page').style.setProperty('--live-sticky-top', `${offset}px`);
            // Oversized cards follow the page so every action remains reachable.
            sidebar.dataset.sticky = String(sidebar.offsetHeight + offset + 20 <= window.innerHeight);
        };
        const observer = new ResizeObserver(updateSticky);
        observer.observe(sidebar);
        if (header) observer.observe(header);
        window.addEventListener('resize', updateSticky);
        updateSticky();
        return () => { observer.disconnect(); window.removeEventListener('resize', updateSticky); };
    }, []);
    const selectStudent = useCallback((student, entry) => {
        lastScanRef.current = entry;
        setSelected(current => current?.id === student.id ? null : student);
        if (selectedId !== student.id && window.matchMedia('(max-width: 800px)').matches) {
            requestAnimationFrame(() => sidebarRef.current?.scrollIntoView({
                block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
            }));
        }
    }, [selectedId]);
    const classOptions = [...new Set([...classes, ...scans.map(scan => scan.student.klasse), ...(klasse.startsWith('class:') ? [klasse.slice(6)] : [])])].filter(Boolean);
    const classGroups = groupClassesByGrade(classOptions, classStructure).map(group => ({
        label: group.label,
        option: { value: `grade:${group.grade}`, label: group.label, shortLabel: 'Gesamte Stufe' },
        options: group.classes.map(name => ({ value: `class:${name}`, label: `Klasse ${name}`, shortLabel: name })),
    }));
    const filtered = laptop !== 'all' || klasse !== 'all' || Boolean(query.trim());
    return <div className="app-page page-container-wide live-page">
        <div className="student-page-heading live-page-heading"><div className="live-page-title"><span className="live-page-icon" aria-hidden="true"><i className="fa-solid fa-tower-broadcast" /></span><div><h1 className="page-title">Live-Panel</h1>
            </div>
            </div><Link href="/scan" className="btn btn-secondary"><i className="fa-solid fa-barcode" aria-hidden="true" /> Zum Scanner</Link></div>
        <div className="live-workspace">
        <section className="ui-surface live-toolbar" aria-label="Suche und Filter">
            <div className="live-search">
                <label className="sr-only" htmlFor="live-search">Scans suchen</label>
                <i className="fa-solid fa-magnifying-glass live-search-icon" aria-hidden="true" />
                <input ref={searchRef} id="live-search" type="text" className="form-control" value={query} maxLength={100}
                    placeholder="Scans suchen · Name, Klasse oder ID" autoComplete="off" onChange={event => setQuery(event.target.value)} />
                {query && <button type="button" className="live-search-clear" aria-label="Suche leeren" onClick={() => { setQuery(''); searchRef.current?.focus(); }}><i className="fa-solid fa-xmark" aria-hidden="true" /></button>}
            </div>
            <div className="live-filter-actions">
                <LiveFilterMenu label="Scanner" icon="fa-laptop" value={laptop} onChange={setLaptop}
                    options={[{ value: 'all', label: 'Alle Scanner' }, ...devices.map(device => ({ value: device.id, label: device.name || 'Unbenannter Scanner' }))]} />
                <LiveFilterMenu label="Klasse" icon="fa-users" value={klasse} onChange={setKlasse}
                    options={[{ value: 'all', label: 'Alle Klassen' }]} groups={classGroups} />
                {filtered && <button type="button" className="live-reset" aria-label="Zurücksetzen" title="Suche und Filter zurücksetzen" onClick={() => { setLaptop('all'); setKlasse('all'); setQuery(''); reset(); searchRef.current?.focus(); }}><i className="fa-solid fa-rotate-left" aria-hidden="true" /></button>}
            </div>
        </section>
        <div className="live-panel-layout">
            <div ref={feedRef} className="ui-surface live-feed-pane">
                <ScanHistory key={JSON.stringify([laptop, klasse, query])} scans={scans} status={loading && !scans.length ? 'connecting' : status} onSelect={selectStudent} title="Aktuelle Scans" showDevice selectedId={selected?.id ?? null}
                    description={total ? `${scans.length} von ${total} Scans` : 'Gesamter Scanverlauf'}
                    emptyMessage={filtered ? 'Keine Scans passen zu deiner Auswahl.' : undefined} />
                {error && <p className="live-page-error" role="alert">{error} <button type="button" className="btn btn-secondary btn-sm" onClick={reload}>Erneut versuchen</button></p>}
                <div className="live-load-more" role="group" aria-label="Weitere Scans" aria-busy={loading}>
                    <span role="status">{loading ? 'Lade Scans…' : total > 0 && scans.length >= total ? 'Alle Scans geladen' : `${scans.length} von ${total} Scans geladen`}</span>
                    {scans.length < total && <button type="button" disabled={loading} onClick={loadMore}>
                        <i className="fa-solid fa-plus" aria-hidden="true" /> {loading ? 'Lade Scans…' : '30 weitere laden'}
                    </button>}
                </div>
            </div>
            <aside ref={sidebarRef} className="ui-surface live-panel-sidebar" aria-label="Schülerauswahl und Aktionen">
                <section className="live-sidebar-search" aria-label="Schülerauswahl">
                    <StudentAutocomplete student={selected} onSelect={setSelected} />
                </section>
                <LiveStudentActions key={selected?.id || 'empty'} student={selected} onUpdate={setSelected} onClear={() => setSelected(null)} />
                <nav className="live-sidebar-navigation" aria-label="Navigation im Live-Panel">
                <button type="button" className="live-back-to-scans" onClick={() => {
                    const entry = lastScanRef.current;
                    if (entry?.isConnected) {
                        entry.focus({ preventScroll: true });
                        entry.scrollIntoView({ block: 'center' });
                    } else feedRef.current?.scrollIntoView({ block: 'start' });
                }}><i className="fa-solid fa-list" aria-hidden="true" /> Zur Scanliste</button>
                <button type="button" className="live-back-to-filters" onClick={() => {
                    searchRef.current?.focus({ preventScroll: true });
                    searchRef.current?.closest('section').scrollIntoView({ block: 'start' });
                }}>
                    <i className="fa-solid fa-arrow-up" aria-hidden="true" /> Zu Suche und Filtern
                </button>
                </nav>
            </aside>
        </div>
        </div>
    </div>;
}

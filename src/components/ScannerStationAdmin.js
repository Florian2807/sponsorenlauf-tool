import { useState, useContext } from 'react';
import { useScannerStation } from '../contexts/ScannerStationContext';
import { useApi } from '../hooks/useApi';
import { stationScopeLabel, stationModeLabel } from '../utils/stationDisplay';
import ScannerStationSettings from './ScannerStationSettings';
import { PanelNavigationContext } from '../contexts/PanelNavigationContext';

export default function ScannerStationAdmin() {
    const navigation = useContext(PanelNavigationContext);
    const persistDrafts = Boolean(navigation?.persistDrafts);
    const { stations, refresh, error } = useScannerStation();
    const { request } = useApi();
    const [dirty, setDirty] = useState(false);
    const [pendingId, setPendingId] = useState(null);
    const [selectedId, setSelectedId] = useState('default');
    const [visitedIds, setVisitedIds] = useState(['default']);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [busy, setBusy] = useState(false);
    const [createError, setCreateError] = useState('');
    const station = stations.find((item) => item.id === selectedId);
    const select = (id) => {
        if (id === selectedId) return;
        if (dirty && !persistDrafts) { setPendingId(id); return; }
        setVisitedIds(current => current.includes(id) ? current : [...current, id]);
        setSelectedId(id);
        setPendingId(null);
    };
    const create = async (event) => {
        event.preventDefault();
        setBusy(true);
        setCreateError('');
        try {
            const result = await request('/api/stations', { method: 'POST', data: { name: newName }, showErrorMessage: false });
            await refresh();
            select(result.id);
            setNewName('');
            setCreating(false);
        } catch (error) { setCreateError(error.message); }
        finally { setBusy(false); }
    };

    return <div className="station-admin-layout">
        <aside className="station-list-panel" aria-label="Stationsübersicht">
            <div className="station-list-heading"><h2>Stationen <span>{stations.length}</span></h2>
                <button type="button" className="station-add-button" onClick={() => setCreating(true)} aria-label="Neue Station anlegen">
                    <i className="fa-solid fa-plus" aria-hidden="true" /> Neue Station
                </button>
            </div>
            {creating && <form className="station-create-form" onSubmit={create}>
                <label htmlFor="new-station-name">Name der neuen Station</label>
                <input id="new-station-name" className="input" placeholder="z. B. Ziel links" value={newName}
                    maxLength={100} required autoFocus onChange={(event) => setNewName(event.target.value)} disabled={busy} />
                {createError && <p role="alert">{createError}</p>}
                <div><button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setCreating(false)}>Abbrechen</button>
                    <button type="submit" className="btn btn-sm" disabled={busy || !newName.trim()}>{busy ? 'Wird angelegt …' : 'Station anlegen'}</button></div>
            </form>}
            <div className="station-list">
                {stations.map((item) => <button type="button" key={item.id} className={`station-list-item ${selectedId === item.id ? 'is-selected' : ''}`}
                    onClick={() => select(item.id)} aria-pressed={selectedId === item.id}>
                    <span className="station-list-icon"><i className="fa-solid fa-laptop" aria-hidden="true" /></span>
                    <span className="station-list-copy"><strong>{item.name}</strong><small>{stationScopeLabel(item)}</small>
                        <span className={`station-list-mode mode-${item.mode}`}>{stationModeLabel(item)}</span></span>
                    <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </button>)}
            </div>
            <p className="station-list-hint">Ein Name kann von mehreren Laptops genutzt werden. Die Auswahl erfolgt auf der Scan-Seite.</p>
        </aside>
        <section className="station-detail-panel" aria-label="Station bearbeiten">
            <header className="station-detail-header">
                <div><span className="station-eyebrow">Station bearbeiten</span><h2>{station?.name || 'Stationen laden …'}</h2></div>
                {selectedId === 'default' && <span className="station-default-badge">Standard</span>}
            </header>
            {error && <div className="station-error" role="alert">{error}<button type="button" onClick={refresh}>Erneut laden</button></div>}
            {pendingId && <div className="station-unsaved" role="alert">
                <p>Diese Station hat ungespeicherte Änderungen.</p>
                <div><button type="button" onClick={() => setPendingId(null)}>Weiter bearbeiten</button>
                    <button type="button" onClick={() => { setDirty(false); setSelectedId(pendingId); setPendingId(null); }}>Verwerfen & wechseln</button></div>
            </div>}
            {(persistDrafts ? visitedIds : [selectedId]).map(id => <div key={id} hidden={id !== selectedId}>
                <ScannerStationSettings stationId={id} admin onDirtyChange={setDirty}
                    onSaved={() => { if (pendingId) { setSelectedId(pendingId); setPendingId(null); } }} />
            </div>)}
        </section>
    </div>;
}

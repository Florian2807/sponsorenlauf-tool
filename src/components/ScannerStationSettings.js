import { useState, useEffect, useRef, useId } from 'react';
import { useApi } from '../hooks/useApi';
import { useScannerStation } from '../contexts/ScannerStationContext';

const modes = [
    { value: 'allow', title: 'Alle zulassen', description: 'Jede Klasse kann hier scannen.', icon: 'fa-check' },
    { value: 'warn', title: 'Warnen', description: 'Andere Klassen zählen mit Hinweis.', icon: 'fa-triangle-exclamation' },
    { value: 'block', title: 'Blockieren', description: 'Andere Klassen erhalten keine Runde.', icon: 'fa-ban' },
];

export default function ScannerStationSettings({ stationId, admin = false, onSaved, onCancel, onDirtyChange }) {
    const { stations, classes, grades, refresh } = useScannerStation();
    const station = stations.find((item) => item.id === stationId);
    const { request } = useApi();
    const groupId = useId();
    const [draft, setDraft] = useState({ name: '', mode: 'allow', classes: [], grades: [] });
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [search, setSearch] = useState('');
    const dirtyRef = useRef(false);

    useEffect(() => {
        if (station && !dirtyRef.current) {
            setDraft({ name: station.name, mode: station.mode, classes: station.classes, grades: station.grades });
        }
    }, [station]);

    const change = (patch) => {
        const next = { ...draft, ...patch };
        const baseline = { name: station.name, mode: station.mode, classes: station.classes, grades: station.grades };
        dirtyRef.current = JSON.stringify(next) !== JSON.stringify(baseline);
        onDirtyChange?.(dirtyRef.current);
        setFeedback(null);
        setDraft(next);
    };
    const toggle = (key, value, checked) => change({
        [key]: checked ? [...draft[key], value] : draft[key].filter((item) => item !== value),
    });
    const save = async (event) => {
        event.preventDefault();
        setBusy(true);
        setFeedback(null);
        try {
            await request('/api/stations', {
                method: admin ? 'PATCH' : 'PUT',
                data: { id: stationId, ...draft },
                showErrorMessage: false,
            });
            dirtyRef.current = false;
            onDirtyChange?.(false);
            await refresh();
            setFeedback({ type: 'success', text: 'Änderungen gespeichert' });
            onSaved?.();
        } catch (error) {
            setFeedback({ type: 'error', text: error.message });
        } finally {
            setBusy(false);
        }
    };

    if (!station) return <div className="station-loading" role="status">Station wird geladen …</div>;
    const chosen = draft.classes.length + draft.grades.length;
    const classOptions = [...new Set([...classes, ...draft.classes])]
        .filter((name) => name.toLocaleLowerCase('de').includes(search.toLocaleLowerCase('de')));

    return <form className="station-editor" onSubmit={save}>
        <div className="station-editor-content">
            {admin && <div className="station-name-field">
                <label htmlFor={groupId + '-name'}>Stationsname</label>
                <input id={groupId + '-name'} className="input" value={draft.name} placeholder="z. B. Ziel links · Jahrgang 5"
                    required maxLength={100} disabled={busy} onChange={(event) => change({ name: event.target.value })} />
            </div>}
            <fieldset className="station-mode-fieldset" disabled={busy}>
                <legend>Welche Scans nimmt diese Station an?</legend>
                <div className="station-mode-options">
                    {modes.map((mode) => <label key={mode.value} className={`station-mode-option ${draft.mode === mode.value ? 'is-selected' : ''}`}>
                        <input type="radio" name={groupId + '-mode'} value={mode.value} checked={draft.mode === mode.value}
                            onChange={() => change({ mode: mode.value })} />
                        <i className={`fa-solid ${mode.icon}`} aria-hidden="true" />
                        <span><strong>{mode.title}</strong><small>{mode.description}</small></span>
                    </label>)}
                </div>
            </fieldset>
            {draft.mode !== 'allow' && <section className="station-class-selection" aria-label="Klassenzuordnung">
                <div className="station-section-heading">
                    <div><h3>Zuständige Klassen</h3><p>Wähle ganze Jahrgänge oder einzelne Klassen.</p></div>
                    <span className="station-selection-count">{chosen} ausgewählt</span>
                </div>
                <fieldset disabled={busy} className="station-chip-fieldset">
                    <legend>Jahrgänge</legend>
                    <div className="station-chips">
                        {[...new Set([...grades, ...draft.grades])].map((grade) => <label key={grade} className={`station-chip ${draft.grades.includes(grade) ? 'is-selected' : ''}`}>
                            <input type="checkbox" checked={draft.grades.includes(grade)} onChange={(event) => toggle('grades', grade, event.target.checked)} />
                            <span>Jahrgang {grade}</span>
                        </label>)}
                        {!grades.length && !draft.grades.length && <p>Keine Jahrgänge vorhanden.</p>}
                    </div>
                </fieldset>
                <fieldset disabled={busy} className="station-chip-fieldset">
                    <legend>Einzelne Klassen</legend>
                    {classes.length > 8 && <input className="input station-class-search" aria-label="Klassen suchen" type="search"
                        placeholder="Klasse suchen …" value={search} onChange={(event) => setSearch(event.target.value)} />}
                    <div className="station-chips">
                        {classOptions.map((name) => <label key={name} className={`station-chip ${draft.classes.includes(name) ? 'is-selected' : ''}`}>
                            <input type="checkbox" checked={draft.classes.includes(name)} onChange={(event) => toggle('classes', name, event.target.checked)} />
                            <span>{name}</span>
                        </label>)}
                        {!classOptions.length && <p>Keine passenden Klassen.</p>}
                    </div>
                </fieldset>
                <div className={`station-rule-preview ${chosen ? '' : 'is-empty'}`} role="note">
                    <i className={`fa-solid ${chosen ? 'fa-circle-info' : 'fa-triangle-exclamation'}`} aria-hidden="true" />
                    <p>{!chosen ? 'Noch keine Klasse ausgewählt. Aktuell dürfen weiterhin alle Klassen scannen.'
                        : draft.mode === 'warn' ? 'Andere Klassen werden gezählt. Die Station zeigt dabei einen Hinweis.'
                            : 'Andere Klassen werden abgewiesen. Es wird keine Runde gezählt.'}</p>
                </div>
            </section>}
            <p className="station-shared-note"><i className="fa-solid fa-laptop" aria-hidden="true" /> Gilt für alle Laptops mit dieser Station.</p>
        </div>
        <div className="station-editor-footer">
            <div className="station-editor-feedback">
                {feedback ? <span role={feedback.type === 'error' ? 'alert' : 'status'} className={feedback.type}>
                    <i className={`fa-solid ${feedback.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`} aria-hidden="true" /> {feedback.text}
                </span> : <span>Änderungen gelten nach dem Speichern.</span>}
            </div>
            <div className="station-editor-actions">
                {onCancel && <button type="button" className="btn btn-secondary" disabled={busy} onClick={onCancel} data-dialog-cancel-action="true">Abbrechen</button>}
                <button type="submit" className="btn" disabled={busy || (admin && !draft.name.trim())} data-dialog-primary-action="true">
                    {busy ? 'Wird gespeichert …' : 'Änderungen speichern'}
                </button>
            </div>
        </div>
    </form>;
}

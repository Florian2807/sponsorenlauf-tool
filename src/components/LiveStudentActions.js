import { useEffect, useRef, useState } from 'react';
import BaseDialog from './BaseDialog';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import { normalizeReplacementId } from '../utils/studentId';
import { useRoundHistory } from '../hooks/useRoundHistory';
import { createClientId } from '../utils/clientId';
import { formatDate } from '../utils/constants';

export default function LiveStudentActions({ student, onUpdate, onClear }) {
    const editRef = useRef(null);
    const replacementRef = useRef(null);
    const [form, setForm] = useState({});
    const [classes, setClasses] = useState([]);
    const [replacement, setReplacement] = useState('');
    const [created, setCreated] = useState(null);
    const [replacementStudent, setReplacementStudent] = useState(null);
    const [replacementOpen, setReplacementOpen] = useState(false);
    const replacementInput = useRef(null);
    const [error, setError] = useState('');
    const [profile, setProfile] = useState(student);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [deleteRequested, setDeleteRequested] = useState(null);
    const history = useRoundHistory(profile?.id, `${profile?.roundCount}:${profile?.roundVersion}`, historyOpen);
    const { request, loading } = useApi();
    const { showSuccess } = useGlobalError();
    useEffect(() => { setProfile(current => student ? { ...current, ...student } : null); }, [student]);
    useEffect(() => {
        if (replacementOpen) replacementRef.current.showModal();
    }, [replacementOpen]);
    useEffect(() => {
        if (replacementOpen && replacementStudent) replacementInput.current?.focus();
    }, [replacementOpen, replacementStudent]);
    const openReplacement = () => {
        if (!student || loading) return;
        setReplacementStudent(student || null); setReplacement(''); setError(''); setCreated(null);
        setReplacementOpen(true);
    };
    const edit = async () => {
        if (loading) return;
        try {
            const [data, availableClasses] = await Promise.all([
                request(`/api/students/${student.id}?summary=1`, { showErrorMessage: false }),
                request('/api/getAvailableClasses', { showErrorMessage: false, cacheMs: 30000 }),
            ]);
            setClasses(availableClasses);
            setProfile(data);
            onUpdate(data);
            setHistoryOpen(false);
            setDeleteRequested(null);
            setForm({ vorname: data.vorname, nachname: data.nachname, klasse: data.klasse, geschlecht: data.geschlecht || '' });
            setError(''); editRef.current.showModal();
        } catch (error) { setError(error.message); }
    };
    const changeRound = async roundId => {
        try {
            setError('');
            if (roundId) {
                await request(`/api/rounds/${roundId}`, { method: 'DELETE', data: { studentId: student.id }, showErrorMessage: false });
                const fresh = await request(`/api/students/${student.id}`, { showErrorMessage: false });
                setProfile(fresh); onUpdate(fresh);
            } else {
                const result = await request('/api/runden', { method: 'POST', showErrorMessage: false,
                    data: { id: student.id, scanId: createClientId('manual'), confirmDoubleScan: true } });
                const fresh = { ...profile, ...result.student, roundVersion: result.round.id };
                setProfile(fresh); onUpdate(fresh);
            }
            setDeleteRequested(null);
            history.reload();
            showSuccess(roundId ? 'Runde gelöscht' : 'Runde hinzugefügt');
        } catch (error) { setError(error.message); }
    };
    const save = async () => {
        try {
            await request(`/api/students/${student.id}`, { method: 'PUT', data: form, showErrorMessage: false });
            onUpdate({ ...student, ...form }); editRef.current.close();
            showSuccess('Schüler gespeichert');
        } catch (error) { setError(error.message); }
    };
    const addReplacement = async () => {
        if (!replacementStudent || loading) return;
        const customId = replacement.trim() ? normalizeReplacementId(replacement) : null;
        if (replacement.trim() && !customId) { setError('Bitte eine gültige Ersatz-ID eingeben, z. B. E12.'); return; }
        try {
            const data = await request('/api/addReplacements', { method: 'POST',
                data: { studentId: replacementStudent.id, ...(customId ? { customId } : { amount: 1 }) }, showErrorMessage: false });
            setCreated({ id: `E${data.newReplacements[0]}`, student: replacementStudent });
            replacementRef.current.close();
        } catch (error) { setError(error.message); }
    };
    return <>
        <section className="live-student-actions ui-surface" aria-label="Ausgewählter Schüler">
            <div className="live-inspector-heading"><i className="fa-regular fa-address-card" aria-hidden="true" /><span>Schülerdetails</span>{student && <button type="button" className="live-clear-selection" aria-label="Schüler abwählen" title="Schüler abwählen" onClick={onClear}><i className="fa-solid fa-xmark" aria-hidden="true" /></button>}</div>
            {student ? <>
                <div className="live-student-identity"><span className="live-student-avatar" aria-hidden="true">{student.vorname?.[0]}{student.nachname?.[0]}</span>
                    <h2>{student.vorname} {student.nachname}</h2><div className="live-student-tags"><span>Klasse {student.klasse}</span><span>ID {student.id}</span></div></div>
                <div className="live-student-count"><strong>{student.roundCount ?? '–'}</strong><span>gelaufene Runden</span></div>
            </> : <div className="live-selection-empty"><i className="fa-solid fa-user-pen" aria-hidden="true" /><h2>Kein Schüler ausgewählt</h2><p>Suche nach einem Schüler oder wähle einen Scan aus der Liste.</p></div>}
            <div className="live-action-buttons">
                <button className="btn" type="button" disabled={!student} aria-disabled={loading || !student} onClick={edit}><i className="fa-solid fa-pen" aria-hidden="true" /> Schüler bearbeiten</button>
                <button className="btn btn-secondary" type="button" disabled={loading || !student} onClick={openReplacement}><i className="fa-solid fa-ticket" aria-hidden="true" /> Ersatz-ID hinzufügen</button>
            </div>
            {created && <p className="message message-success" role="status">Ersatz-ID <strong>{created.id}</strong> ist {created.student.vorname} {created.student.nachname} zugeordnet.</p>}
            {error && !editRef.current?.open && !replacementRef.current?.open && <p role="alert" className="message message-error">{error}</p>}
        </section>
        <BaseDialog dialogRef={editRef} title="Schüler bearbeiten" size="large" className="live-student-editor" actions={[
            { label: 'Abbrechen', position: 'left', disabled: loading, onClick: () => editRef.current.close() },
            { label: 'Speichern', primary: true, disabled: loading || !form.vorname?.trim() || !form.nachname?.trim() || !form.klasse, onClick: save },
        ]}>
            <div className="manage-dialog-form-grid">
                {['vorname', 'nachname'].map(field => <div key={field}><label className="form-label" htmlFor={`live-${field}`}>{field === 'vorname' ? 'Vorname' : 'Nachname'}</label>
                    <input id={`live-${field}`} value={form[field] || ''} disabled={loading} onChange={event => setForm(current => ({ ...current, [field]: event.target.value }))} /></div>)}
                <div><label className="form-label" htmlFor="live-class">Klasse</label>
                    <select id="live-class" value={form.klasse || ''} disabled={loading} onChange={event => setForm(current => ({ ...current, klasse: event.target.value }))}>
                        {[...new Set([form.klasse, ...classes])].filter(Boolean).map(name => <option key={name}>{name}</option>)}
                    </select></div>
                <div><label className="form-label" htmlFor="live-gender">Geschlecht</label><select id="live-gender" disabled={loading}
                    value={form.geschlecht || ''} onChange={event => setForm(current => ({ ...current, geschlecht: event.target.value }))}>
                    <option value="">Keine Angabe</option>{['männlich', 'weiblich', 'divers'].map(value => <option key={value}>{value}</option>)}
                </select></div>
            </div>
            <details className="manage-dialog-section student-editor-details live-round-editor" open={historyOpen} onToggle={event => setHistoryOpen(event.currentTarget.open)}>
                <summary>Rundenverlauf <span>{profile?.roundCount || 0}</span></summary>
                <div className="rounds-header"><p className="text-muted">Rundenänderungen werden sofort gespeichert.</p>
                    <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => changeRound()}>Runde hinzufügen</button></div>
                {history.loading ? <p role="status">Rundenverlauf wird geladen…</p> : history.error ? <p role="alert">{history.error} <button type="button" className="btn btn-secondary btn-sm" onClick={history.reload}>Erneut versuchen</button></p> : history.rounds.length ?
                    <ul className="timestamp-list">{history.rounds.map((round, index) => <li key={round.id} className="timestamp-item">
                        <div className="timestamp-info"><strong>Runde {history.rounds.length - index}</strong><span className="timestamp-date">{formatDate(new Date(round.timestamp), 'de-DE')}</span>
                            </div>
                        {deleteRequested === round.id ? <div className="live-round-confirm"><span>Runde löschen?</span>
                            <button type="button" className="btn btn-danger btn-sm" disabled={loading} onClick={() => changeRound(round.id)}>Ja, löschen</button>
                            <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => setDeleteRequested(null)}>Behalten</button></div> :
                            <button type="button" className="delete-timestamp-btn" aria-label={`Runde ${history.rounds.length - index} löschen`} disabled={loading} onClick={() => setDeleteRequested(round.id)}>Löschen</button>}
                    </li>)}</ul> : <p className="empty-state">Noch keine Runden gelaufen.</p>}
            </details>
            {error && <p className="message message-error" role="alert">{error}</p>}
        </BaseDialog>
        <BaseDialog dialogRef={replacementRef} title="Ersatz-ID hinzufügen" className="live-replacement-dialog" onClose={() => setReplacementOpen(false)} actions={[
            { label: 'Abbrechen', position: 'left', disabled: loading, onClick: () => replacementRef.current.close() },
            { label: 'Hinzufügen', primary: true, disabled: loading || !replacementStudent, onClick: addReplacement },
        ]}>
            {replacementStudent && <div className="live-replacement-recipient">
                <div><strong>{replacementStudent.vorname} {replacementStudent.nachname}</strong><span>Klasse {replacementStudent.klasse} · ID {replacementStudent.id}</span></div>
            </div>}
            <div className="live-replacement-fields">
            <label className="form-label" htmlFor="live-replacement">Ersatz-ID (optional)</label>
            <input ref={replacementInput} id="live-replacement" value={replacement} disabled={loading || !replacementStudent} placeholder="z. B. E123" aria-describedby="live-replacement-hint" maxLength={30} onChange={event => setReplacement(event.target.value)} />
            <p id="live-replacement-hint" className="text-muted">Ohne Eingabe wird automatisch eine Ersatz-ID erstellt.</p></div>
            {error && <p className="message message-error" role="alert">{error}</p>}
        </BaseDialog>
    </>;
}

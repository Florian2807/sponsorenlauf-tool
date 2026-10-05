import { useCallback, useEffect, useRef, useState } from 'react';
import BaseDialog from '../../BaseDialog';
import { usePanelPresentation } from '../../../contexts/PanelNavigationContext';

export default function ClassStructureDialog({ dialogRef, tempClassStructure, saveClassStructure }) {
    const { inline, closePanel } = usePanelPresentation(dialogRef);
    const [grades, setGrades] = useState([]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [focusId, setFocusId] = useState(null);
    const initial = useRef(tempClassStructure);
    const nextId = useRef(0);
    initial.current = tempClassStructure;
    const id = useCallback(() => `structure-field-${nextId.current++}`, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        const initialize = () => {
            setGrades(Object.entries(initial.current).map(([name, classes]) => ({
                id: id(), name, classes: classes.map(name => ({ id: id(), name })),
            })));
            setError('');
        };
        if (inline) { initialize(); return undefined; }
        const observer = new MutationObserver(() => { if (dialog.open) initialize(); });
        observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
        return () => observer.disconnect();
    }, [dialogRef, id, inline]);

    useEffect(() => {
        if (focusId) document.getElementById(focusId)?.focus();
    }, [focusId]);

    const updateGrade = (gradeId, change) => {
        setError('');
        setGrades(current => current.map(grade => grade.id === gradeId ? { ...grade, ...change } : grade));
    };
    const addGrade = () => {
        const gradeId = id();
        let number = grades.length + 1;
        while (grades.some(grade => grade.name === `Jahrgang ${number}`)) number++;
        setGrades(current => [...current, { id: gradeId, name: `Jahrgang ${number}`, classes: [] }]);
        setFocusId(gradeId);
    };
    const addClass = (grade) => {
        const classId = id();
        const prefix = grade.name.match(/\d+/)?.[0];
        let number = 0;
        let name;
        do {
            name = prefix && number < 26 ? `${prefix}${String.fromCharCode(97 + number)}` : `Klasse ${number + 1}`;
            number++;
        } while (grades.some(item => item.classes.some(item => item.name === name)));
        updateGrade(grade.id, { classes: [...grade.classes, { id: classId, name }] });
        setFocusId(classId);
    };
    const save = async () => {
        const structure = Object.create(null);
        const names = new Set();
        for (const grade of grades) {
            const name = grade.name.trim();
            if (!name) return setError('Jeder Jahrgang braucht einen Namen.');
            if (Object.keys(structure).some(key => key.toLocaleLowerCase('de-DE') === name.toLocaleLowerCase('de-DE'))) return setError(`Der Jahrgang „${name}“ ist doppelt vorhanden.`);
            structure[name] = [];
            for (const item of grade.classes) {
                const className = item.name.trim();
                if (!className) return setError(`Eine Klasse in „${name}“ hat noch keinen Namen.`);
                const normalized = className.toLocaleLowerCase('de-DE');
                if (names.has(normalized)) return setError(`Die Klasse „${className}“ ist doppelt vorhanden.`);
                names.add(normalized);
                structure[name].push(className);
            }
        }
        setSaving(true);
        try { return await saveClassStructure(structure); } finally { setSaving(false); }
    };

    return <BaseDialog dialogRef={dialogRef} title="Klassenstruktur verwalten" size="large" className="class-structure-dialog" showDefaultClose={false} actions={[
        { label: 'Abbrechen', position: 'left', disabled: saving, onClick: () => closePanel() },
        { label: saving ? 'Speichert…' : 'Speichern', primary: true, disabled: saving, onClick: save },
    ]}>
        <div className="settings-section-heading">
            <div><h3>Jahrgänge und Klassen</h3><p>Lege Jahrgänge an und ordne ihre Klassen zu. Änderungen gelten nach dem Speichern.</p></div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addGrade} disabled={saving}><i className="fa-solid fa-plus" aria-hidden="true" /> Jahrgang hinzufügen</button>
        </div>
        {error && <p className="message message-error" role="alert">{error}</p>}
        <div className="structure-grade-list">
            {grades.map(grade => <section className="structure-grade-card" key={grade.id}>
                <div className="structure-grade-heading">
                    <label htmlFor={grade.id}><span>Jahrgang / Stufe</span><input id={grade.id} className="form-input" value={grade.name} required disabled={saving} onChange={event => updateGrade(grade.id, { name: event.target.value })} /></label>
                    <button type="button" className="btn btn-secondary btn-sm structure-remove" aria-label={`Jahrgang ${grade.name} entfernen`} title="Jahrgang entfernen" disabled={saving} onClick={() => setGrades(current => current.filter(item => item.id !== grade.id))}><i className="fa-solid fa-trash" aria-hidden="true" /></button>
                </div>
                <div className="structure-classes-heading"><span>{grade.classes.length} Klassen</span><button type="button" className="btn btn-secondary btn-sm" onClick={() => addClass(grade)} disabled={saving}>Klasse hinzufügen</button></div>
                <div className="structure-class-list">
                    {grade.classes.map((item, index) => <div className="structure-class-field" key={item.id}>
                        <label className="sr-only" htmlFor={item.id}>Klasse {index + 1} in {grade.name}</label>
                        <input id={item.id} className="form-input" value={item.name} required disabled={saving} onChange={event => updateGrade(grade.id, { classes: grade.classes.map(current => current.id === item.id ? { ...current, name: event.target.value } : current) })} />
                        <button type="button" className="btn btn-secondary btn-sm structure-remove" aria-label={`Klasse ${item.name || index + 1} entfernen`} disabled={saving} onClick={() => updateGrade(grade.id, { classes: grade.classes.filter(current => current.id !== item.id) })}><i className="fa-solid fa-xmark" aria-hidden="true" /></button>
                    </div>)}
                </div>
                {!grade.classes.length && <p className="settings-empty-copy">Füge die erste Klasse dieses Jahrgangs hinzu.</p>}
            </section>)}
        </div>
        {!grades.length && <div className="empty-state">Noch keine Jahrgänge angelegt. Starte mit „Jahrgang hinzufügen“.</div>}
    </BaseDialog>;
}

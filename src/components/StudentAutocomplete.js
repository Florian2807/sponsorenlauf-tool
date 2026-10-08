import { useEffect, useId, useRef, useState } from 'react';
import styles from '../styles/Donations.module.css';

export default function StudentAutocomplete({ student = null, onSelect, autoFocus = false, disabled = false }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);
    const [status, setStatus] = useState('');
    const listId = useId();
    const inputId = useId();
    const listRef = useRef(null);
    const expanded = open && !student && Boolean(query.trim());
    useEffect(() => {
        const controller = new AbortController();
        setResults([]);
        setIndex(0);
        if (!query.trim() || student) {
            if (student) setQuery('');
            setStatus(''); return () => controller.abort();
        }
        setStatus('Suche…');
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`/api/student-search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
                if (!response.ok) throw new Error('Schülersuche nicht erreichbar.');
                const data = await response.json();
                if (controller.signal.aborted) return;
                setResults(data.students);
                setStatus(data.students.length ? '' : 'Keine Schüler gefunden.');
            } catch (error) { if (!controller.signal.aborted) setStatus(error.message); }
        }, 100);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [query, student]);
    useEffect(() => { if (expanded) listRef.current?.children[index]?.scrollIntoView({ block: 'nearest' }); }, [index, expanded, results]);
    const select = chosen => { setOpen(false); onSelect(chosen); };
    return <div className={`student-autocomplete ${styles.formGroup} ${styles.searchGroup}`} onBlur={event => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
        <label className={styles.formLabel} htmlFor={inputId}>Schüler suchen</label>
        <input id={inputId} autoFocus={autoFocus} className={styles.formControl} role="combobox" aria-autocomplete="list"
            aria-expanded={expanded} aria-controls={expanded ? listId : undefined}
            aria-activedescendant={expanded && results[index] ? `${listId}-${results[index].id}` : undefined}
            value={student ? `${student.vorname} ${student.nachname}` : query} maxLength={100}
            placeholder="Name, Klasse oder ID" autoComplete="off" disabled={disabled}
            onFocus={() => setOpen(!student && Boolean(query.trim()))} onChange={event => {
                setQuery(event.target.value); setResults([]); setIndex(0); setStatus('');
                onSelect(null); setOpen(Boolean(event.target.value.trim()));
            }} onKeyDownCapture={event => {
                if (event.key === 'Escape' && expanded) {
                    setOpen(false); event.preventDefault(); event.stopPropagation();
                }
                if (expanded && results.length && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
                    event.preventDefault();
                    setIndex(current => (current + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
                }
                if (event.key === 'Enter' && !student) {
                    event.preventDefault();
                    if (expanded && results[index]) select(results[index]);
                }
            }} />
        <span className="sr-only" role="status">{expanded ? status || `${results.length} Treffer` : ''}</span>
        {expanded && <div id={listId} ref={listRef} role="listbox" aria-label="Gefundene Schüler" className={styles.suggestions}>
            {results.length ? results.map((result, position) => <button key={result.id} id={`${listId}-${result.id}`} type="button"
                role="option" aria-selected={index === position} tabIndex={-1}
                className={`${styles.suggestion} ${index === position ? styles.suggestionActive : ''}`}
                onMouseDown={event => event.preventDefault()} onClick={() => select(result)}>
                <span><strong>{result.vorname} {result.nachname}</strong><small>Klasse {result.klasse} · ID {result.id}</small></span>
            </button>) : <p className={styles.noSuggestions}>{status || 'Suche…'}</p>}
        </div>}
    </div>;
}

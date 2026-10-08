import { useCallback, useEffect, useRef, useState } from 'react';

// Cache only this mounted view; a changed round count/version requires fresh data.
export function useRoundHistory(studentId, version, open) {
    const cache = useRef(new Map());
    const [revision, setRevision] = useState(0);
    const [state, setState] = useState({ key: null, rounds: [], loading: false, error: '' });
    const key = studentId ? `${studentId}:${version}:${revision}` : null;
    useEffect(() => {
        if (!key || !open) return;
        if (cache.current.has(key)) { setState({ key, rounds: cache.current.get(key), loading: false, error: '' }); return; }
        const controller = new AbortController();
        setState({ key, rounds: [], loading: true, error: '' });
        fetch(`/api/students/${studentId}/timestamps`, { signal: controller.signal })
            .then(async response => {
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || 'Rundenverlauf konnte nicht geladen werden.');
                if (controller.signal.aborted) return;
                const rounds = result.data.rounds;
                if (cache.current.size >= 25) cache.current.delete(cache.current.keys().next().value);
                cache.current.set(key, rounds);
                setState({ key, rounds, loading: false, error: '' });
            }).catch(error => {
                if (!controller.signal.aborted) setState({ key, rounds: [], loading: false, error: error.message });
            });
        return () => controller.abort();
    }, [key, open, studentId]);
    const reload = useCallback(() => setRevision(value => value + 1), []);
    return { ...(state.key === key ? state : { rounds: [], loading: !!open, error: '' }), reload };
}

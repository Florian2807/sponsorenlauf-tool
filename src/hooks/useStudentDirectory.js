import { useCallback, useEffect, useState } from 'react';

export function useStudentDirectory({ search, klasse, grade = '', filter, sort, direction }) {
    const params = new URLSearchParams({ search, klasse, grade, filter, sort, direction });
    const key = params.toString();
    const [request, setRequest] = useState({ key: null, page: 0, revision: 0 });
    const page = request.key === key ? request.page : 0;
    const revision = request.revision;
    const [state, setState] = useState({ key: null, students: [], total: 0, filtered: 0, nextId: 1, loading: true, error: '' });
    useEffect(() => {
        const controller = new AbortController();
        const requestedPage = page;
        const timer = setTimeout(async () => {
            setState(current => ({ ...current, ...(current.key === key ? {} : { key, students: [], filtered: 0, page: 0 }), loading: true, error: '' }));
            try {
                const response = await fetch(`/api/getAllStudents?${key}&page=${requestedPage}`, { signal: controller.signal });
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || 'Schülerliste konnte nicht geladen werden.');
                if (controller.signal.aborted) return;
                const data = result.data;
                setState(current => ({ ...data, key, revision, loading: false, error: '',
                    students: requestedPage ? [...current.students, ...data.students] : data.students }));
            } catch (error) {
                if (!controller.signal.aborted) setState(current => ({ ...current, key, revision, loading: false, error: error.message }));
            }
        }, search.trim() ? 200 : 0);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [key, page, revision, search]);
    const refresh = useCallback(() => setRequest(current => ({ key, page: 0, revision: current.revision + 1 })), [key]);
    const setStudents = useCallback(update => setState(current => ({ ...current, students: typeof update === 'function' ? update(current.students) : update })), []);
    const current = state.key === key ? state : { ...state, students: [], filtered: 0, loading: true, error: '' };
    return { ...current, setStudents, refresh, hasMore: current.students.length < current.filtered,
        loadMore: () => { if (!current.loading && current.students.length < current.filtered) { setState(value => ({ ...value, loading: true })); setRequest(value => ({ key, page: (current.page || 0) + 1, revision: value.revision + 1 })); } } };
}

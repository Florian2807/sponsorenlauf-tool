import { useEffect, useRef, useState } from 'react';

const emptyScans = [];

export const useScanPages = ({ laptop, klasse, query, status, studentChange, deviceMetadata }) => {
    const [position, setPosition] = useState({ page: 1 });
    const [result, setResult] = useState({ scans: [], total: 0, page: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    const filterKey = JSON.stringify([laptop, klasse, query]);
    const current = position.filterKey === filterKey ? position : { page: 1, filterKey };
    const latest = useRef(result);
    useEffect(() => {
        setPosition(value => value.filterKey === filterKey ? value : { page: 1, filterKey });
    }, [filterKey]);
    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams({ page: String(current.page), expand: '1', q: query });
        if (laptop !== 'all') params.set('device', laptop);
        if (klasse.startsWith('class:')) params.set('klasse', klasse.slice(6));
        if (klasse.startsWith('grade:')) params.set('grade', klasse.slice(6));
        if (current.page > 1 && current.through !== undefined) params.set('through', String(current.through));
        setLoading(true);
        setError('');
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`/api/scan-feed?${params}`, { signal: controller.signal });
                if (!response.ok) throw new Error('Scans konnten nicht geladen werden.');
                const data = await response.json();
                if (controller.signal.aborted) return;
                latest.current = data;
                setResult({ ...data, filterKey });
            } catch (err) {
                if (!controller.signal.aborted) setError(err.message);
            } finally { if (!controller.signal.aborted) setLoading(false); }
        }, 80);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [filterKey, laptop, klasse, query, current.page, current.through, status, studentChange, deviceMetadata, revision]);
    const matching = result.filterKey === filterKey;
    const goToPage = page => {
        setPosition({ filterKey, page, through: page > 1 ? latest.current.snapshotId : undefined });
        setRevision(value => value + 1);
    };
    return { scans: matching ? result.scans : emptyScans, total: matching ? result.total : 0,
        loading, error, loadMore: () => goToPage(latest.current.page + 1), reset: () => goToPage(1), reload: () => setRevision(value => value + 1) };
};

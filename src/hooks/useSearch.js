import { useState, useMemo } from 'react';

export const useSearch = (data, searchFields = ['vorname', 'nachname', 'klasse']) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = useMemo(() => {
        const terms = searchTerm.trim().toLocaleLowerCase('de-DE').split(/\s+/).filter(Boolean);
        if (!terms.length) return data;

        return data.filter(item => terms.every(term =>
            searchFields.some(field =>
                String(item?.[field] ?? '').toLocaleLowerCase('de-DE').includes(term)
            )
        ));
    }, [data, searchTerm, searchFields]);

    return {
        searchTerm,
        setSearchTerm,
        filteredData
    };
};

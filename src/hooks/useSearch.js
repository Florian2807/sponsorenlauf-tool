import { useState, useMemo } from 'react';

export const useSearch = (data, searchFields = ['vorname', 'nachname', 'klasse']) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        const searchLower = searchTerm.toLowerCase();
        return data.filter(item =>
            searchFields.some(field =>
                item?.[field]?.toLowerCase().includes(searchLower)
            )
        );
    }, [data, searchTerm, searchFields]);

    return {
        searchTerm,
        setSearchTerm,
        filteredData
    };
};

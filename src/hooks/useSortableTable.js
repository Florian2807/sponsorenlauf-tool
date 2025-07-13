import { useState, useMemo } from 'react';

export const useSortableTable = (data, availableClasses = []) => {
    const [sortField, setSortField] = useState('id');
    const [sortDirection, setSortDirection] = useState('asc');

    const sortData = (field) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
    };

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (sortField === 'klasse' && availableClasses.length > 0) {
                const aIndex = availableClasses.indexOf(aValue);
                const bIndex = availableClasses.indexOf(bValue);
                return sortDirection === 'asc' ? aIndex - bIndex : bIndex - aIndex;
            }

            if (sortField === 'id') {
                const aNum = parseInt(aValue);
                const bNum = parseInt(bValue);
                return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortField, sortDirection, availableClasses]);

    return { sortField, sortDirection, sortData, sortedData };
};

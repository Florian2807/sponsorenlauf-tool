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
        const sorted = [...data];
        sorted.sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (sortField === 'klasse' && availableClasses.length > 0) {
                const aClass = availableClasses.indexOf(aValue);
                const bClass = availableClasses.indexOf(bValue);
                return sortDirection === 'asc' ? aClass - bClass : bClass - aClass;
            }

            if (sortField === 'id') {
                return sortDirection === 'asc'
                    ? parseInt(aValue) - parseInt(bValue)
                    : parseInt(bValue) - parseInt(aValue);
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [data, sortField, sortDirection, availableClasses]);

    return {
        sortField,
        sortDirection,
        sortData,
        sortedData
    };
};

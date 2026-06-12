import { useState, useMemo } from 'react';

export const useSortableTable = (data, availableClasses = []) => {
    const [sortField, setSortField] = useState('id');
    const [sortDirection, setSortDirection] = useState('asc');

    const getComparableValue = (item, field) => {
        const value = item?.[field];

        if (Array.isArray(value)) {
            return value.length;
        }

        if (value === null || value === undefined) {
            return '';
        }

        return value;
    };

    const sortData = (field) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
    };

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            const aValue = getComparableValue(a, sortField);
            const bValue = getComparableValue(b, sortField);

            if (sortField === 'klasse' && availableClasses.length > 0) {
                const aIndex = availableClasses.indexOf(aValue);
                const bIndex = availableClasses.indexOf(bValue);
                return sortDirection === 'asc' ? aIndex - bIndex : bIndex - aIndex;
            }

            if (sortField === 'id' || typeof aValue === 'number' || typeof bValue === 'number') {
                const aNum = parseInt(aValue);
                const bNum = parseInt(bValue);
                return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
            }

            if (String(aValue).localeCompare(String(bValue), 'de') < 0) return sortDirection === 'asc' ? -1 : 1;
            if (String(aValue).localeCompare(String(bValue), 'de') > 0) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortField, sortDirection, availableClasses]);

    return { sortField, sortDirection, sortData, sortedData };
};

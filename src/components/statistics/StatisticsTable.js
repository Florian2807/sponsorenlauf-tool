import React, { useState } from 'react';

const StatisticsTable = ({
    data,
    columns,
    title,
    defaultSort,
    maxRows = 50,
    searchable = false,
    className = '',
    allData = null, // Alle verfügbaren Daten für erweiterte Suche
    onSearchEnhance = null // Callback für erweiterte Suche
}) => {
    const [sortConfig, setSortConfig] = useState(defaultSort || { key: null, direction: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');

    // Enhanced data with search
    const enhancedData = React.useMemo(() => {
        if (!searchTerm || !onSearchEnhance || !allData) return data;
        return onSearchEnhance(data, searchTerm, allData);
    }, [data, searchTerm, onSearchEnhance, allData]);

    const handleSort = (key) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕️';
        return sortConfig.direction === 'desc' ? '↓' : '↑';
    };

    const sortedData = React.useMemo(() => {
        const dataToSort = enhancedData || data;
        if (!sortConfig.key) return dataToSort;

        return [...dataToSort].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
            }

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortConfig.direction === 'desc'
                    ? bVal.localeCompare(aVal)
                    : aVal.localeCompare(bVal);
            }

            return 0;
        });
    }, [enhancedData, data, sortConfig]);

    const filteredData = React.useMemo(() => {
        if (!searchable || !searchTerm) return sortedData;

        return sortedData.filter(row =>
            Object.values(row).some(value =>
                value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [sortedData, searchTerm, searchable]);

    const displayData = filteredData.slice(0, maxRows);

    return (
        <div className={`statistics-table ${className}`}>
            <div className="statistics-table__header">
                <h3>{title}</h3>
                {searchable && (
                    <input
                        type="text"
                        placeholder="Suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="statistics-table__search"
                    />
                )}
            </div>
            <div className="statistics-table__wrapper">
                <table className="table statistics-table__table">
                    <thead>
                        <tr>
                            {columns.map(column => (
                                <th
                                    key={column.key}
                                    className={`${column.sortable ? 'sortable' : ''} ${sortConfig.key === column.key ? sortConfig.direction : ''}`}
                                    onClick={column.sortable ? () => handleSort(column.key) : undefined}
                                >
                                    {column.label}
                                    {column.sortable && (
                                        <span className="statistics-table__sort-icon">{getSortIcon(column.key)}</span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.map((row, index) => (
                            <tr key={row.id || index}>
                                {columns.map(column => (
                                    <td key={column.key}>
                                        {column.format ? column.format(row[column.key], row) : row[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredData.length > maxRows && (
                    <div className="statistics-table__pagination">
                        Zeige {maxRows} von {filteredData.length} Einträgen
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatisticsTable;

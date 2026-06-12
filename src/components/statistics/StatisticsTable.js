import React, { useState } from 'react';

const StatisticsTable = ({
    data,
    columns,
    title,
    description,
    defaultSort,
    maxRows = 50,
    searchable = false,
    className = '',
    emptyMessage = 'Keine Daten für die aktuelle Suche gefunden.',
    highlightTopRows = false,
    allData = null, // Alle verfügbaren Daten für erweiterte Suche
    onSearchEnhance = null // Callback für erweiterte Suche
}) => {
    const [sortConfig, setSortConfig] = useState(defaultSort || { key: null, direction: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleRows, setVisibleRows] = useState(maxRows);

    // Enhanced data with search
    const enhancedData = React.useMemo(() => {
        if (!searchTerm || !onSearchEnhance || !allData) return data;
        return onSearchEnhance(data, searchTerm, allData);
    }, [data, searchTerm, onSearchEnhance, allData]);

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        const dataToSort = enhancedData || data;
        if (!sortConfig.key) return dataToSort;

        return [...dataToSort].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                const primarySort = sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;

                // Sekundäre Sortierung für bessere Übersicht
                if (primarySort === 0) {
                    // Bei gleichen Werten: erst nach Klasse, dann nach Nachname
                    const klasseDiff = (a.klasse || '').localeCompare(b.klasse || '');
                    if (klasseDiff !== 0) return klasseDiff;
                    return (a.nachname || '').localeCompare(b.nachname || '');
                }
                return primarySort;
            }

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                const primarySort = sortConfig.direction === 'desc'
                    ? bVal.localeCompare(aVal)
                    : aVal.localeCompare(bVal);

                // Bei gleichen Werten: sekundäre Sortierung nach Runden (absteigend)
                if (primarySort === 0 && a.rounds !== undefined && b.rounds !== undefined) {
                    return (b.rounds || 0) - (a.rounds || 0);
                }
                return primarySort;
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

    React.useEffect(() => {
        setVisibleRows(maxRows);
    }, [data, maxRows, searchTerm]);

    const displayData = filteredData.slice(0, visibleRows);
    const remainingRows = Math.max(filteredData.length - visibleRows, 0);
    const searchInputId = `statistics-search-${String(title || 'table')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`;
    const getAriaSort = (columnKey) => {
        if (sortConfig.key !== columnKey) return 'none';
        return sortConfig.direction === 'asc' ? 'ascending' : 'descending';
    };

    return (
        <div className={`statistics-table ${className}`}>
            <div className="statistics-table__header">
                <h3>{title}</h3>
                {searchable ? (
                    <div style={{ textAlign: 'center' }}>
                        <label className="sr-only" htmlFor={searchInputId}>{title} durchsuchen</label>
                        <input
                            id={searchInputId}
                            type="text"
                            placeholder="Suchen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="statistics-table__search"
                        />
                    </div>
                ) : (
                    <div></div>
                )}
                <div className="statistics-table__count">{filteredData.length} Einträge</div>
            </div>
            {description && (
                <div className="statistics-table__description">
                    {description}
                </div>
            )}
            <div className="statistics-table__wrapper">
                <table className="table statistics-table__table">
                    <thead>
                        <tr>
                            {columns.map(column => (
                                <th key={column.key} aria-sort={column.sortable ? getAriaSort(column.key) : undefined}>
                                    {column.sortable ? (
                                        <button
                                            type="button"
                                            className={`table-sort-button sortable ${sortConfig.key === column.key ? sortConfig.direction : ''}`}
                                            onClick={() => handleSort(column.key)}
                                        >
                                            {column.label}
                                        </button>
                                    ) : (
                                        column.label
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.map((row, index) => (
                            <tr key={row.id || index} className={highlightTopRows && index < 3 ? `statistics-table__row--rank-${index + 1}` : undefined}>
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
                        Zeige {displayData.length} von {filteredData.length} Einträgen
                        {remainingRows > 0 ? (
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm statistics-table__load-more"
                                onClick={() => setVisibleRows((current) => current + maxRows)}
                            >
                                Weitere {Math.min(remainingRows, maxRows)} anzeigen
                            </button>
                        ) : null}
                    </div>
                )}
                {filteredData.length === 0 && (
                    <div className="empty-state">{emptyMessage}</div>
                )}
            </div>
        </div>
    );
};

export default StatisticsTable;

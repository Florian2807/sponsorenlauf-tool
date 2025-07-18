import React from 'react';
import { formatCurrency } from '../../utils/constants';

const StatisticsWidget = ({
    title,
    value,
    subvalue,
    icon,
    color = 'primary',
    trend,
    format = 'number',
    className = ''
}) => {
    const formatValue = (val, formatType) => {
        if (val === null || val === undefined) return '0';

        switch (formatType) {
            case 'currency':
                return formatCurrency(val);
            case 'percentage':
                return `${val.toFixed(1)}%`;
            case 'decimal':
                return val.toFixed(2);
            default:
                return val.toString();
        }
    };

    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend > 0) return '📈';
        if (trend < 0) return '📉';
        return '➡️';
    };

    return (
        <div className={`statistics-widget statistics-widget--${color} ${className}`}>
            <div className="statistics-widget__header">
                <div className="statistics-widget__icon">{icon}</div>
                <div className="statistics-widget__trend">{getTrendIcon()}</div>
            </div>
            <div className="statistics-widget__content">
                <div className="statistics-widget__title">{title}</div>
                <div className="statistics-widget__value">{formatValue(value, format)}</div>
                {subvalue && (
                    <div className="statistics-widget__subvalue">{subvalue}</div>
                )}
            </div>
        </div>
    );
};

export default StatisticsWidget;

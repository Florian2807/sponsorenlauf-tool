// Konstanten für häufig verwendete API-Endpunkte
export const API_ENDPOINTS = {
    STUDENTS: '/api/getAllStudents',
    TEACHERS: '/api/getAllTeachers',
    CLASSES: '/api/getAvailableClasses',
    CLASS_STRUCTURE: '/api/classStructure',
    STATISTICS: '/api/statistics',
    GENERATE_LABELS: '/api/generate-labels',
    DELETE_ALL_STUDENTS: '/api/deleteAllStudents',
    EXPORT_EXCEL: '/api/exportExcel',
    EXPORT_SPENDEN: '/api/exportSpenden',
    EXPORT_STATISTICS_HTML: '/api/exportStatisticsHtml',
    SEND_MAILS: '/api/send-mails',
    DONATIONS: '/api/donations'
};

// Database configuration
export const DATABASE_PATH = './database.db';

// Utility-Funktionen für Downloads
export const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

// Formatierungs-Funktionen
export const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0,00€';
    const numericValue = parseFloat(value).toFixed(2);
    const [euros, cents] = numericValue.split('.');
    return `${euros},${cents}€`;
};

export const formatDate = (timestamp) => {
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
    };
    return timestamp.toLocaleTimeString(undefined, timeOptions);
};

export const timeAgo = (now, pastDate) => {
    const diffInSeconds = Math.floor((now - new Date(pastDate)) / 1000);

    if (diffInSeconds < 2) return "jetzt";
    if (diffInSeconds < 60) return `vor ${diffInSeconds} Sekunden`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `vor ${diffInMinutes} Minuten`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `vor ${diffInHours} Stunden`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `vor ${diffInDays} Tagen`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `vor ${diffInMonths} Monaten`;

    return `vor ${Math.floor(diffInMonths / 12)} Jahren`;
};

export const getNextId = (items) => {
    return Math.max(...items.map(item => parseInt(item.id, 10)), 0) + 1;
};

// Funktion zur Berechnung der Zeit zwischen Runden
export const calculateTimeDifference = (currentTimestamp, previousTimestamp) => {
    if (!previousTimestamp || !currentTimestamp) return null;
    
    const diffInMs = new Date(currentTimestamp) - new Date(previousTimestamp);
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    
    if (diffInSeconds < 60) {
        return `${diffInSeconds} Sek.`;
    } else if (diffInMinutes < 60) {
        const remainingSeconds = diffInSeconds % 60;
        return remainingSeconds > 0 ? 
            `${diffInMinutes} Min. ${remainingSeconds} Sek.` : 
            `${diffInMinutes} Min.`;
    } else if (diffInHours < 24) {
        const remainingMinutes = diffInMinutes % 60;
        return remainingMinutes > 0 ? 
            `${diffInHours} Std. ${remainingMinutes} Min.` : 
            `${diffInHours} Std.`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        const remainingHours = diffInHours % 24;
        return remainingHours > 0 ? 
            `${diffInDays} Tag(e) ${remainingHours} Std.` : 
            `${diffInDays} Tag(e)`;
    }
};

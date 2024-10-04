export function formatDate(timestamp) {
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
    };

    return timestamp.toLocaleTimeString(undefined, timeOptions);
}

export function timeAgo(now, pastDate) {
    const diffInSeconds = Math.floor((now - new Date(pastDate)) / 1000);

    if (diffInSeconds < 2) {
        return "jetzt";
    }

    if (diffInSeconds < 60) {
        return `vor ${diffInSeconds} Sekunden`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `vor ${diffInMinutes} Minuten`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `vor ${diffInHours} Stunden`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `vor ${diffInDays} Tagen`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `vor ${diffInMonths} Monaten`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `vor ${diffInYears} Jahren`;
}
export const formatMailDate = (date = new Date()) => date.toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
});

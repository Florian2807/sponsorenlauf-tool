import { useEffect, useState } from 'react';
import styles from '../styles/Topbar.module.css';

const applyTheme = (darkMode, persist = false) => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    if (persist) localStorage.setItem('theme', theme);
};

export default function ThemeToggle({ className, showLabel = false }) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const darkMode = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
        setIsDarkMode(darkMode);
        applyTheme(darkMode);
    }, []);
    const label = `Zu ${isDarkMode ? 'Hell' : 'Dunkel'}modus wechseln`;
    return <button className={className || styles.themeToggle} type="button" aria-label={label}
        aria-pressed={isDarkMode} title={label} onClick={() => {
            const darkMode = !isDarkMode;
            setIsDarkMode(darkMode);
            applyTheme(darkMode, true);
        }}>{showLabel ? <><i className={`fa-solid fa-${isDarkMode ? 'sun' : 'moon'}`} aria-hidden="true" /><span>{isDarkMode ? 'Hellmodus' : 'Dunkelmodus'}</span></> : isDarkMode ? '☀️' : '🌙'}</button>;
}

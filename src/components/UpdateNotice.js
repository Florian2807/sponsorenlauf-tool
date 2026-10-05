import { useEffect, useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import useNotificationPopover from './NotificationPopover';
import { createPortal } from 'react-dom';

const CHECK_INTERVAL = 6 * 60 * 60 * 1000;

export default function UpdateNotice() {
    const { authenticated } = useAdminAuth();
    const [latestVersion, setLatestVersion] = useState(null);
    const [popoverRef, dialog] = useNotificationPopover(Boolean(authenticated && latestVersion));

    useEffect(() => {
        if (!authenticated) return undefined;
        let active = true;
        let lastChecked = 0;

        const check = async () => {
            if (document.hidden || Date.now() - lastChecked < CHECK_INTERVAL) return;
            lastChecked = Date.now();
            try {
                const response = await fetch('/api/update-availability', { cache: 'no-store' });
                if (!response.ok) return;
                const result = await response.json();
                if (active) setLatestVersion(result.available && sessionStorage.getItem('dismissed-update') !== result.latestVersion ? result.latestVersion : null);
            } catch {
                // An unavailable server or network is not an update signal.
            }
        };

        check();
        document.addEventListener('visibilitychange', check);
        const interval = window.setInterval(check, CHECK_INTERVAL);
        return () => {
            active = false;
            document.removeEventListener('visibilitychange', check);
            window.clearInterval(interval);
        };
    }, [authenticated]);

    if (!authenticated || !latestVersion) return null;

    return createPortal(
        <div ref={popoverRef} popover="manual" className="update-notice" role="status">
            <span>Ein Update ist verfügbar. Installation unter Admin → System Check, Backups & Wartung.</span>
            <button type="button" onClick={() => { sessionStorage.setItem('dismissed-update', latestVersion); setLatestVersion(null); }} aria-label="Update-Hinweis schließen">×</button>
            <style jsx>{`
                .update-notice {
                    position: fixed;
                    inset: auto;
                    top: 88px;
                    right: 20px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    max-width: 400px;
                    margin: 0;
                    padding: 12px 16px;
                    border: 1px solid var(--ui-accent-border);
                    border-left: 4px solid var(--ui-accent);
                    border-radius: 8px;
                    background: var(--ui-surface);
                    color: var(--ui-text);
                    box-shadow: var(--ui-dialog-shadow);
                    z-index: 9999;
                }
                .update-notice button {
                    border: 0;
                    background: transparent;
                    color: inherit;
                    cursor: pointer;
                    font-size: 20px;
                }
                @media (max-width: 480px) {
                    .update-notice { top: 88px; left: 16px; right: 16px; max-width: none; }
                }
            `}</style>
        </div>,
        dialog || document.body
    );
}

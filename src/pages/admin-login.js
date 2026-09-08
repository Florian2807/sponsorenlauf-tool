import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useApi } from '../hooks/useApi';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const safeDestination = (value) => (
    typeof value === 'string' && /^\/(setup|manage|teachers|mails|donations)(?:\/|$)/.test(value)
        ? value
        : '/setup'
);

export default function AdminLogin() {
    const router = useRouter();
    const { request } = useApi();
    const { configured, authenticated, loading, refresh } = useAdminAuth();
    const [pin, setPin] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && authenticated) router.replace(safeDestination(router.query.next));
    }, [authenticated, loading, router]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            await request('/api/admin-auth', {
                method: 'POST',
                data: configured
                    ? { action: 'login', pin }
                    : { action: 'setup', pin, confirmation },
                errorContext: configured ? 'Bei der Administrator-Anmeldung' : 'Beim Einrichten der Administrator-PIN',
            });
            await refresh();
            await router.replace(safeDestination(router.query.next));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || configured === null) return <div className="page-container"><p>Status wird geladen…</p></div>;

    return (
        <div className="page-container admin-login-page">
            <form className="admin-login-card" onSubmit={handleSubmit}>
                <div className="admin-login-icon">🔐</div>
                <h1>{configured ? 'Administrator entsperren' : 'Administrator-PIN einrichten'}</h1>
                <p>{configured
                    ? 'Die Verwaltung und alle verändernden Funktionen sind geschützt.'
                    : 'Legen Sie einmalig eine PIN aus Ziffern fest.'}</p>
                <label htmlFor="admin-pin">Administrator-PIN</label>
                <input
                    id="admin-pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]+"
                    autoComplete={configured ? 'current-password' : 'new-password'}
                    value={pin}
                    onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
                    className="input"
                    autoFocus
                    required
                />
                {!configured && (
                    <>
                        <label htmlFor="admin-pin-confirmation">PIN wiederholen</label>
                        <input
                            id="admin-pin-confirmation"
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]+"
                            autoComplete="new-password"
                            value={confirmation}
                            onChange={(event) => setConfirmation(event.target.value.replace(/\D/g, ''))}
                            className="input"
                            required
                        />
                    </>
                )}
                <button className="btn btn-primary" type="submit" disabled={submitting || pin.length === 0 || (!configured && pin !== confirmation)}>
                    {submitting ? 'Bitte warten…' : configured ? 'Entsperren' : 'PIN speichern'}
                </button>
            </form>
        </div>
    );
}

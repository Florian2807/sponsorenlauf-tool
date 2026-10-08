import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function ScanDeviceNameForm({ device, onSaved, onCancel }) {
    const [name, setName] = useState('');
    const [dirty, setDirty] = useState(false);
    const [message, setMessage] = useState('');
    const { request, loading } = useApi();
    useEffect(() => { if (!dirty) setName(device?.name || ''); }, [device?.name, dirty]);
    return <form className="scanner-name-form" onKeyDownCapture={event => {
        if (event.key === 'Enter' && !event.isComposing && event.target.matches('input')) {
            event.preventDefault(); event.stopPropagation(); event.currentTarget.requestSubmit();
        }
    }} onSubmit={async event => {
        event.preventDefault();
        if (!device || loading || !dirty || !name.trim()) return;
        try {
            const response = await request('/api/scan-devices', { method: 'PUT',
                data: { deviceId: device.id, name: name.trim() }, showErrorMessage: false });
            onSaved(response.device);
            setDirty(false);
        } catch (error) { setMessage(error.message); }
    }}>
        <label className="form-label" htmlFor="scan-device-name">Scanner-Name</label>
        <input id="scan-device-name" value={name} required maxLength={60} disabled={!device || loading}
            placeholder={device ? 'z. B. Eingang links' : 'Scanner wird registriert …'}
            aria-describedby="scanner-name-hint" onChange={event => { setName(event.target.value); setDirty(true); setMessage(''); }} />
        <p id="scanner-name-hint" className="text-muted">Mit diesem Namen kannst du den Scanner eindeutig zuordnen.</p>
        {message && <p className="scanner-name-error" role="alert">{message}</p>}
        <div className="scanner-name-actions">
            <button type="button" className="btn btn-secondary" disabled={loading} onClick={onCancel} data-dialog-cancel-action="true">Abbrechen</button>
            <button className="btn" type="submit" disabled={!device || loading || !dirty || !name.trim() || name.trim() === device.name}
                data-dialog-primary-action="true">{loading ? 'Speichert …' : 'Speichern'}</button>
        </div>
    </form>;
}

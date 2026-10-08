import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useModuleConfig } from '../contexts/ModuleConfigContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useScannerStation } from '../contexts/ScannerStationContext';
import ScannerRulesDialog from './ScannerRulesDialog';
import BaseDialog from './BaseDialog';
import ScanDeviceNameForm from './ScanDeviceNameForm';
import ScannerDisplayDialog from './ScannerDisplayDialog';
import { useScannerDevice } from '../hooks/useScannerDevice';
import ThemeToggle from './ThemeToggle';
import styles from '../styles/Topbar.module.css';

export default function HeaderSettings() {
    const router = useRouter();
    const { config, isLoading: configLoading } = useModuleConfig();
    const displayEnabled = !configLoading && config.roundDisplay === true;
    const { authenticated, logout } = useAdminAuth();
    const { refresh } = useScannerStation();
    const isScannerPage = router.pathname === '/scan';
    const { deviceId, device, error: deviceError, refreshDevice, updateDevice } = useScannerDevice(true);
    const [open, setOpen] = useState(false);
    const [editorVersion, setEditorVersion] = useState(0);
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const nameTriggerRef = useRef(null);
    const nameReturnFocusRef = useRef(null);
    const dialogRef = useRef(null);
    const nameDialogRef = useRef(null);
    const displayDialogRef = useRef(null);
    const [nameEditorVersion, setNameEditorVersion] = useState(0);
    const [displayVersion, setDisplayVersion] = useState(0);
    const panelId = useId();
    const openNameDialog = returnFocusRef => {
        nameReturnFocusRef.current = returnFocusRef.current;
        setOpen(false);
        setNameEditorVersion(version => version + 1);
        nameDialogRef.current?.showModal();
        refreshDevice();
    };
    useEffect(() => {
        if (!open) return;
        const outside = event => {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        const escape = event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
                triggerRef.current?.focus();
            }
        };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('pointerdown', outside);
            document.removeEventListener('keydown', escape);
        };
    }, [open]);
    return <div className={styles.headerActions} ref={rootRef} data-scanner-controls onKeyDown={event => {
        if (event.key === 'Tab') requestAnimationFrame(() => {
            if (!rootRef.current?.contains(document.activeElement)) setOpen(false);
        });
    }}>
        <div className={styles.scannerIdentityGroup}>
            {displayEnabled && deviceId ? <Link href={{ pathname: '/display', query: { device: deviceId } }} prefetch={false} target="_blank" rel="noopener noreferrer"
                className={styles.scannerDisplayLink} title="Rundenanzeige öffnen"
                aria-label={`Rundenanzeige für ${device?.name || 'diesen Scanner'} öffnen`}>
                <i className="fa-solid fa-laptop" aria-hidden="true" />
            </Link> : <span className={styles.scannerDisplayLink} aria-hidden="true"><i className="fa-solid fa-laptop" /></span>}
            <button ref={nameTriggerRef} type="button" className={styles.scannerIdentity}
                title={device ? `${device.name} – Scanner-Name ändern` : 'Scanner-Name ändern'} aria-label={`Scanner-Name ändern: ${device?.name || 'Scanner'}`}
                aria-haspopup="dialog" onClick={() => openNameDialog(nameTriggerRef)}>
                <span className={styles.scannerName}>{device?.name || 'Scanner …'}</span>
                <i className={`fa-solid fa-pen ${styles.scannerEditIcon}`} aria-hidden="true" />
            </button>
        </div>
        <button ref={triggerRef} type="button" className={styles.settingsTrigger} aria-label="Einstellungen öffnen"
            title="Einstellungen" aria-expanded={open} aria-controls={panelId}
            onClick={() => setOpen(value => !value)}>
            <i className="fa-solid fa-gear" aria-hidden="true" />
        </button>

        <div id={panelId} className={styles.settingsPanel} hidden={!open}>
            <span className={styles.settingsHeading}>Einstellungen</span>
            <>
                {displayEnabled && <button type="button" className={styles.settingsAction} aria-haspopup="dialog" onClick={() => {
                    setOpen(false);
                    setDisplayVersion(version => version + 1);
                    displayDialogRef.current?.showModal();
                }}><i className="fa-solid fa-display" aria-hidden="true" /><span>Rundenanzeige verbinden</span></button>}
            </>
            {isScannerPage && <button type="button" className={styles.settingsAction}
                aria-label="Scanner-Regeln öffnen" aria-haspopup="dialog" onClick={() => {
                    setOpen(false);
                    setEditorVersion(version => version + 1);
                    dialogRef.current?.showModal();
                    refresh();
                }}><i className="fa-solid fa-sliders" aria-hidden="true" /><span>Scanner-Regeln</span></button>}
            <ThemeToggle className={styles.settingsAction} showLabel />
            {authenticated && <button type="button" className={styles.settingsAction} onClick={async () => {
                await logout();
                setOpen(false);
                triggerRef.current?.focus();
                router.push('/scan');
            }}><i className="fa-solid fa-lock" aria-hidden="true" /><span>Sperren</span></button>}
        </div>
        {isScannerPage && <ScannerRulesDialog dialogRef={dialogRef} editorVersion={editorVersion}
            onClose={() => triggerRef.current?.focus()} />}
        <>
            <BaseDialog dialogRef={nameDialogRef} title="Scanner umbenennen" size="small" className="scanner-name-dialog" showDefaultClose={false} onClose={() => nameReturnFocusRef.current?.focus()}>
                {deviceError && <p role="alert">{deviceError} <button type="button" className="btn btn-secondary btn-sm" onClick={refreshDevice}>Erneut laden</button></p>}
                <ScanDeviceNameForm key={nameEditorVersion} device={device}
                    onCancel={() => nameDialogRef.current?.close()}
                    onSaved={nextDevice => { updateDevice(nextDevice); nameDialogRef.current?.close(); }} />
            </BaseDialog>
            {displayEnabled && <ScannerDisplayDialog dialogRef={displayDialogRef} deviceId={deviceId} device={device} openVersion={displayVersion}
                onClose={() => triggerRef.current?.focus()} />}
        </>
    </div>;
}

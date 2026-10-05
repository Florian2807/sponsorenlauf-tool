import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import BaseDialog from '../../BaseDialog';
import { usePanelPresentation } from '../../../contexts/PanelNavigationContext';
import { useApi } from '../../../hooks/useApi';
import { useGlobalError } from '../../../contexts/ErrorContext';
import { useModuleConfig } from '../../../contexts/ModuleConfigContext';

const DetailedDeleteDialog = ({
    dialogRef,
    onDeleteSuccess
}) => {
    const { inline, closePanel } = usePanelPresentation(dialogRef);
    const router = useRouter();
    const [selectedOptions, setSelectedOptions] = useState({
        students: false,
        teachers: false,
        rounds: false,
        replacements: false,
        expectedDonations: false,
        receivedDonations: false,
        fullReset: false
    });

    const [confirmationText, setConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();
    const { isTeachersEnabled, isDonationsEnabled } = useModuleConfig();

    useEffect(() => {
        if (inline) return undefined;
        const dialog = dialogRef.current;
        if (!dialog) return;
        const observer = new MutationObserver(() => {
            if (!dialog.open) return;
            setSelectedOptions({ students: false, teachers: false, rounds: false, replacements: false, expectedDonations: false, receivedDonations: false, fullReset: false });
            setConfirmationText('');
        });
        observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
        return () => observer.disconnect();
    }, [dialogRef, inline]);

    const handleOptionChange = (option) => {
        setSelectedOptions(prev => {
            if (option === 'fullReset') {
                return Object.fromEntries(
                    Object.keys(prev).map((key) => [key, key === 'fullReset' ? !prev.fullReset : false])
                );
            }

            const newOptions = { ...prev, [option]: !prev[option] };
            newOptions.fullReset = false;

            // Wenn Schüler gelöscht werden, müssen auch alle zugehörigen Daten gelöscht werden
            if (option === 'students' && newOptions.students) {
                newOptions.rounds = true;
                newOptions.replacements = true;
                newOptions.expectedDonations = true;
                newOptions.receivedDonations = true;
            }

            return newOptions;
        });
    };

    const getSelectedCount = () => {
        return Object.values(selectedOptions).filter(Boolean).length;
    };

    const getDeleteDescription = () => {
        const selected = Object.keys(selectedOptions).filter(key => selectedOptions[key]);
        if (selected.length === 0) return '';

        const descriptions = {
            students: 'Alle Schüler',
            teachers: 'Alle Lehrer',
            rounds: 'Alle Runden-Daten',
            replacements: 'Alle Ersatz-IDs',
            expectedDonations: 'Alle erwarteten Spenden',
            receivedDonations: 'Alle erhaltenen Spenden',
            fullReset: 'Kompletter Reset'
        };

        return selected.map(key => descriptions[key]).join(', ');
    };

    const isConfirmValid = () => {
        const requiredConfirmation = selectedOptions.fullReset ? 'ALLES LÖSCHEN' : 'LÖSCHEN';
        return confirmationText === requiredConfirmation && getSelectedCount() > 0;
    };

    const handleDelete = async () => {
        if (!isConfirmValid() || isDeleting) return;

        setIsDeleting(true);

        try {
            const selectedTypes = Object.keys(selectedOptions).filter((key) => selectedOptions[key]);
            const result = await request('/api/detailedDelete', {
                method: 'DELETE',
                data: {
                    types: selectedTypes,
                    confirmation: confirmationText,
                }
            });

            const successMessage = `Die ausgewählten Daten wurden gelöscht. Sicherheitskopie: ${result.backupFilename}`;

            showSuccess(successMessage, 'Löschvorgang abgeschlossen');

            if (inline) { setSelectedOptions(current => Object.fromEntries(Object.keys(current).map(key => [key, false]))); setConfirmationText(''); }
            closePanel();

            if (result.fullReset) {
                router.push('/setup?tour=1');
                return;
            }

            if (onDeleteSuccess) {
                onDeleteSuccess();
            }

        } catch (error) {
            showError(error, 'Beim Löschen der Daten');
        } finally {
            setIsDeleting(false);
        }
    };

    const actions = [
        {
            label: inline ? 'Auswahl zurücksetzen' : 'Abbrechen',
            position: 'left',
            onClick: () => { if (inline) { setSelectedOptions(current => Object.fromEntries(Object.keys(current).map(key => [key, false]))); setConfirmationText(''); } else closePanel(); },
            disabled: isDeleting
        },
        {
            label: isDeleting ? 'Lösche...' : 'Löschen',
            variant: 'danger',
            onClick: handleDelete,
            disabled: !isConfirmValid() || isDeleting
        }
    ];

    const options = [
        { key: 'rounds', title: 'Runden-Daten zurücksetzen', description: 'Alle gelaufenen Runden entfernen. Schüler bleiben erhalten.', icon: 'person-running', linked: true },
        { key: 'replacements', title: 'Ersatz-IDs zurücksetzen', description: 'Alternative Barcodes aller Schüler entfernen.', icon: 'barcode', linked: true },
        ...(isDonationsEnabled ? [
            { key: 'expectedDonations', title: 'Erwartete Spenden zurücksetzen', description: 'Alle zugesagten Beträge entfernen.', icon: 'coins', linked: true },
            { key: 'receivedDonations', title: 'Erhaltene Spenden zurücksetzen', description: 'Alle eingegangenen Beträge entfernen.', icon: 'coins', linked: true },
        ] : []),
        { key: 'students', title: 'Alle Schüler', description: 'Entfernt auch ihre Runden, Ersatz-IDs und Spenden.', icon: 'users' },
        ...(isTeachersEnabled ? [{ key: 'teachers', title: 'Alle Lehrer', description: 'Lehrerdaten und E-Mail-Zuordnungen entfernen.', icon: 'chalkboard-user' }] : []),
    ];
    const confirmation = selectedOptions.fullReset ? 'ALLES LÖSCHEN' : 'LÖSCHEN';

    return <BaseDialog dialogRef={dialogRef} title="Daten löschen" actions={actions} showDefaultClose={false} size="large" className="data-delete-dialog">
        <div className="settings-notice"><i className="fa-solid fa-circle-info" aria-hidden="true" /><p>Vor dem Löschen wird eine Sicherheitskopie erstellt. Prüfe die Auswahl: Gelöschte Daten lassen sich nur aus einem Backup wiederherstellen.</p></div>
        <h3 className="settings-section-title">Was möchtest du entfernen?</h3>
        <div className="data-delete-options">
            {options.map(option => <label className="data-delete-option" key={option.key}>
                <input type="checkbox" checked={selectedOptions[option.key]} onChange={() => handleOptionChange(option.key)} disabled={isDeleting || (option.linked && selectedOptions.students)} />
                <span className="ui-icon" aria-hidden="true"><i className={`fa-solid fa-${option.icon}`} /></span>
                <span><strong>{option.title}</strong><small>{option.description}{option.linked && selectedOptions.students ? ' Wird zusammen mit den Schülern gelöscht.' : ''}</small></span>
            </label>)}
        </div>
        <details className="data-reset-details">
            <summary>Gesamte Anwendung zurücksetzen</summary>
            <label className="data-delete-option data-delete-option--reset">
                <input type="checkbox" checked={selectedOptions.fullReset} onChange={() => handleOptionChange('fullReset')} disabled={isDeleting} />
                <span><strong>Kompletter Reset</strong><small>Entfernt alle Daten und Einstellungen. Anschließend beginnt die Einrichtung von vorn.</small></span>
            </label>
        </details>
        {getSelectedCount() > 0 && <section className="data-delete-confirmation">
            <h3>Auswahl bestätigen</h3><p>{getDeleteDescription()}</p>
            <label className="form-label" htmlFor="delete-confirmation">Zum Bestätigen <strong>{confirmation}</strong> eingeben</label>
            <input id="delete-confirmation" className="form-input" value={confirmationText} onChange={event => setConfirmationText(event.target.value)} disabled={isDeleting} autoComplete="off" spellCheck={false} />
        </section>}
    </BaseDialog>;
};

export default DetailedDeleteDialog;

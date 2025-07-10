import React, { useState, useRef } from 'react';
import BaseDialog from '../../BaseDialog';
import { useApi } from '../../../hooks/useApi';
import styles from '../../../styles/DataImport.module.css';

const DataImportDialog = ({ dialogRef, onImportSuccess, onClose }) => {
    const [importMethod, setImportMethod] = useState('manual');
    const [manualData, setManualData] = useState([
        { vorname: '', nachname: '', geschlecht: 'männlich', klasse: '' }
    ]);
    const [excelFile, setExcelFile] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);
    const { request } = useApi();

    const addManualRow = () => {
        setManualData([...manualData, { vorname: '', nachname: '', geschlecht: 'männlich', klasse: '' }]);
    };

    const removeManualRow = (index) => {
        if (manualData.length > 1) {
            setManualData(manualData.filter((_, i) => i !== index));
        }
    };

    const updateManualRow = (index, field, value) => {
        const updatedData = [...manualData];
        updatedData[index][field] = value;
        setManualData(updatedData);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        setExcelFile(file);
        setImportResult(null);
    };

    const validateManualData = () => {
        const errors = [];
        manualData.forEach((row, index) => {
            if (!row.vorname.trim()) errors.push(`Zeile ${index + 1}: Vorname fehlt`);
            if (!row.nachname.trim()) errors.push(`Zeile ${index + 1}: Nachname fehlt`);
            if (!row.klasse.trim()) errors.push(`Zeile ${index + 1}: Klasse fehlt`);
        });
        return errors;
    };

    const submitManualImport = async () => {
        const errors = validateManualData();
        if (errors.length > 0) {
            setImportResult({
                success: false,
                message: 'Validierungsfehler',
                errors: errors
            });
            return;
        }

        setIsImporting(true);
        try {
            const response = await request('/api/importStudents', {
                method: 'POST',
                body: JSON.stringify({ students: manualData }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.success) {
                setImportResult({
                    success: true,
                    message: `${response.insertedCount} Schüler erfolgreich hinzugefügt`
                });
                onImportSuccess(response.insertedCount);
            } else {
                setImportResult({
                    success: false,
                    message: response.message || 'Import fehlgeschlagen'
                });
            }
        } catch (error) {
            setImportResult({
                success: false,
                message: 'Fehler beim Import: ' + error.message
            });
        } finally {
            setIsImporting(false);
        }
    };

    const submitExcelImport = async () => {
        if (!excelFile) {
            setImportResult({
                success: false,
                message: 'Bitte wählen Sie eine Excel-Datei aus'
            });
            return;
        }

        const formData = new FormData();
        formData.append('file', excelFile);

        setIsImporting(true);
        try {
            const response = await request('/api/uploadExcel', {
                method: 'POST',
                body: formData
            });

            if (response.success) {
                setImportResult({
                    success: true,
                    message: `${response.insertedCount} Schüler erfolgreich hinzugefügt`
                });
                onImportSuccess(response.insertedCount);
            } else {
                setImportResult({
                    success: false,
                    message: response.message || 'Import fehlgeschlagen',
                    errors: response.errors
                });
            }
        } catch (error) {
            setImportResult({
                success: false,
                message: 'Fehler beim Import: ' + error.message
            });
        } finally {
            setIsImporting(false);
        }
    };

    const resetForm = () => {
        setImportMethod('manual');
        setManualData([{ vorname: '', nachname: '', geschlecht: 'männlich', klasse: '' }]);
        setExcelFile(null);
        setImportResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const actions = [
        {
            label: 'Zurücksetzen',
            onClick: resetForm,
            variant: 'secondary'
        },
        {
            label: 'Abbrechen',
            onClick: handleClose,
            variant: 'danger'
        },
        {
            label: isImporting ? 'Importiere...' : 'Importieren',
            onClick: importMethod === 'manual' ? submitManualImport : submitExcelImport,
            variant: 'primary',
            disabled: isImporting
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Schüler importieren"
            onClose={handleClose}
            size="large"
            actions={actions}
            showDefaultClose={false}
        >
            {/* Method Selector */}
            <div className={styles.methodSelector}>
                <label className={`${styles.methodOption} ${importMethod === 'manual' ? styles.active : ''}`}>
                    <input
                        type="radio"
                        name="importMethod"
                        value="manual"
                        checked={importMethod === 'manual'}
                        onChange={(e) => setImportMethod(e.target.value)}
                    />
                    <div className={styles.methodIcon}>✏️</div>
                    <div>
                        <strong>Manuell eingeben</strong>
                        <p>Schüler einzeln hinzufügen</p>
                    </div>
                </label>

                <label className={`${styles.methodOption} ${importMethod === 'excel' ? styles.active : ''}`}>
                    <input
                        type="radio"
                        name="importMethod"
                        value="excel"
                        checked={importMethod === 'excel'}
                        onChange={(e) => setImportMethod(e.target.value)}
                    />
                    <div className={styles.methodIcon}>📊</div>
                    <div>
                        <strong>Excel importieren</strong>
                        <p>Aus Excel-Datei importieren</p>
                    </div>
                </label>
            </div>

            {/* Manual Import */}
            {importMethod === 'manual' && (
                <div className={styles.manualImport}>
                    <div className={styles.manualHeader}>
                        <h3>Schüler manuell hinzufügen</h3>
                        <button className={styles.addButton} onClick={addManualRow}>
                            + Zeile hinzufügen
                        </button>
                    </div>

                    <div className={styles.manualTable}>
                        <div className={styles.tableHeader}>
                            <span>Vorname</span>
                            <span>Nachname</span>
                            <span>Geschlecht</span>
                            <span>Klasse</span>
                            <span></span>
                        </div>

                        {manualData.map((row, index) => (
                            <div key={index} className={styles.tableRow}>
                                <input
                                    type="text"
                                    placeholder="Vorname"
                                    value={row.vorname}
                                    onChange={(e) => updateManualRow(index, 'vorname', e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Nachname"
                                    value={row.nachname}
                                    onChange={(e) => updateManualRow(index, 'nachname', e.target.value)}
                                />
                                <select
                                    value={row.geschlecht}
                                    onChange={(e) => updateManualRow(index, 'geschlecht', e.target.value)}
                                >
                                    <option value="männlich">Männlich</option>
                                    <option value="weiblich">Weiblich</option>
                                    <option value="divers">Divers</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Klasse"
                                    value={row.klasse}
                                    onChange={(e) => updateManualRow(index, 'klasse', e.target.value)}
                                />
                                <button
                                    className={styles.removeButton}
                                    onClick={() => removeManualRow(index)}
                                    disabled={manualData.length === 1}
                                    title="Zeile entfernen"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Excel Import */}
            {importMethod === 'excel' && (
                <div className={styles.excelImport}>
                    <div className={styles.excelInfo}>
                        <h3>Excel-Import</h3>

                        <div className={styles.formatInfo}>
                            <strong>Erwartetes Format:</strong>
                            <div className={styles.exampleTable}>
                                <div className={styles.exampleHeader}>
                                    <span>Vorname</span>
                                    <span>Nachname</span>
                                    <span>Geschlecht</span>
                                    <span>Klasse</span>
                                </div>
                                <div className={styles.exampleRow}>
                                    <span>Max</span>
                                    <span>Mustermann</span>
                                    <span>männlich</span>
                                    <span>5a</span>
                                </div>
                                <div className={styles.exampleRow}>
                                    <span>Anna</span>
                                    <span>Schmidt</span>
                                    <span>weiblich</span>
                                    <span>5b</span>
                                </div>
                            </div>
                            <p className={styles.formatNote}>
                                Die erste Zeile sollte die Spaltenüberschriften enthalten.
                            </p>
                        </div>

                        <div className={styles.fileUpload}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                className={styles.fileInput}
                            />
                            <div className={styles.fileInfo}>
                                {excelFile ? (
                                    <span className={styles.selectedFile}>
                                        Ausgewählt: {excelFile.name}
                                    </span>
                                ) : (
                                    <span className={styles.noFile}>
                                        Keine Datei ausgewählt
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Result */}
            {importResult && (
                <div className={`${styles.result} ${importResult.success ? styles.success : styles.error}`}>
                    <div className={styles.resultMessage}>
                        {importResult.message}
                    </div>
                    {importResult.errors && (
                        <div className={styles.errorList}>
                            <strong>Fehler:</strong>
                            <ul>
                                {importResult.errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </BaseDialog>
    );
};

export default DataImportDialog;

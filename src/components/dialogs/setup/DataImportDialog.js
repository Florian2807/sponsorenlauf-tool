import React, { useState, useRef } from 'react';
import BaseDialog from '../../BaseDialog';
import { useApi } from '../../../hooks/useApi';


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
            position: 'left',
            onClick: resetForm,
            variant: 'secondary'
        },
        {
            label: isImporting ? 'Importiere...' : 'Importieren',
            onClick: importMethod === 'manual' ? submitManualImport : submitExcelImport,
            variant: 'success',
            position: 'right',
            disabled: isImporting
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Schüler importieren"
            onClose={handleClose}
            size="xl"
            actions={actions}
            actionLayout="split"
            showDefaultClose={false}
        >
            {/* Method Selector */}
            <div className="method-selector">
                <label className={`method-option ${importMethod === 'manual' ? 'active' : ''}`}>
                    <input
                        type="radio"
                        name="importMethod"
                        value="manual"
                        checked={importMethod === 'manual'}
                        onChange={(e) => setImportMethod(e.target.value)}
                    />
                    <div className="method-icon">✏️</div>
                    <div>
                        <strong>Manuell eingeben</strong>
                        <p>Schüler einzeln hinzufügen</p>
                    </div>
                </label>

                <label className={`method-option ${importMethod === 'excel' ? 'active' : ''}`}>
                    <input
                        type="radio"
                        name="importMethod"
                        value="excel"
                        checked={importMethod === 'excel'}
                        onChange={(e) => setImportMethod(e.target.value)}
                    />
                    <div className="method-icon">📊</div>
                    <div>
                        <strong>Excel importieren</strong>
                        <p>Aus Excel-Datei importieren</p>
                    </div>
                </label>
            </div>

            {/* Manual Import */}
            {importMethod === 'manual' && (
                <div className="manual-import">
                    <div className="manual-header">
                        <h3>Schüler manuell hinzufügen</h3>
                        <button className="add-button" onClick={addManualRow}>
                            + Zeile hinzufügen
                        </button>
                    </div>

                    <table className="table">
                        <thead>
                            <tr>
                                <th>Vorname</th>
                                <th>Nachname</th>
                                <th>Geschlecht</th>
                                <th>Klasse</th>
                                <th style={{ width: '60px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {manualData.map((row, index) => (
                                <tr key={index}>
                                    <td>
                                        <input
                                            type="text"
                                            placeholder="Vorname"
                                            value={row.vorname}
                                            onChange={(e) => updateManualRow(index, 'vorname', e.target.value)}
                                            className="form-input"
                                            style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            placeholder="Nachname"
                                            value={row.nachname}
                                            onChange={(e) => updateManualRow(index, 'nachname', e.target.value)}
                                            className="form-input"
                                            style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                        />
                                    </td>
                                    <td>
                                        <select
                                            value={row.geschlecht}
                                            onChange={(e) => updateManualRow(index, 'geschlecht', e.target.value)}
                                            className="form-select"
                                            style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                        >
                                            <option value="männlich">Männlich</option>
                                            <option value="weiblich">Weiblich</option>
                                            <option value="divers">Divers</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            placeholder="Klasse"
                                            value={row.klasse}
                                            onChange={(e) => updateManualRow(index, 'klasse', e.target.value)}
                                            className="form-input"
                                            style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                        />
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => removeManualRow(index)}
                                            disabled={manualData.length === 1}
                                            title="Zeile entfernen"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Excel Import */}
            {importMethod === 'excel' && (
                <div className="excel-import">
                    <div className="excel-info">
                        <h3>Excel-Import</h3>

                        <div className="format-info">
                            <strong>Erwartetes Format:</strong>
                            <div className="example-table">
                                <div className="example-header">
                                    <span>Vorname</span>
                                    <span>Nachname</span>
                                    <span>Geschlecht</span>
                                    <span>Klasse</span>
                                </div>
                                <div className="example-row">
                                    <span>Max</span>
                                    <span>Mustermann</span>
                                    <span>männlich</span>
                                    <span>5a</span>
                                </div>
                                <div className="example-row">
                                    <span>Anna</span>
                                    <span>Schmidt</span>
                                    <span>weiblich</span>
                                    <span>5b</span>
                                </div>
                            </div>
                            <p className="format-note">
                                Die erste Zeile sollte die Spaltenüberschriften enthalten.
                            </p>
                        </div>

                        <div className="file-upload">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                className="file-input"
                            />
                            <div className="file-info">
                                {excelFile ? (
                                    <span className="selected-file">
                                        Ausgewählt: {excelFile.name}
                                    </span>
                                ) : (
                                    <span className="no-file">
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
                <div className={`result ${importResult.success ? 'success' : 'error'}`}>
                    <div className="result-message">
                        {importResult.message}
                    </div>
                    {importResult.errors && (
                        <div className="error-list">
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

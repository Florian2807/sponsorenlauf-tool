import React, { useState, useRef, useEffect } from 'react';
import BaseDialog from '../../BaseDialog';
import { useApi } from '../../../hooks/useApi';
import { useGlobalError } from '../../../contexts/ErrorContext';
import * as XLSX from 'xlsx';


const DataImportDialog = ({ dialogRef, onImportSuccess, onClose }) => {
    const [importMethod, setImportMethod] = useState('manual');
    const [manualData, setManualData] = useState([
        { vorname: '', nachname: '', geschlecht: '', klasse: '' }
    ]);
    const [excelFile, setExcelFile] = useState(null);
    const [excelData, setExcelData] = useState([]);
    const [showExcelPreview, setShowExcelPreview] = useState(false);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);
    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();

    const addManualRow = () => {
        const newRow = {
            vorname: '',
            nachname: '',
            geschlecht: 'Wähle...',
            klasse: 'Wähle...'
        };
        setManualData([...manualData, newRow]);
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

    // Excel data manipulation
    const addExcelRow = () => {
        const newRow = {
            vorname: '',
            nachname: '',
            geschlecht: 'Wähle...',
            klasse: 'Wähle...'
        };
        setExcelData([...excelData, newRow]);
    };

    const removeExcelRow = (index) => {
        if (excelData.length > 1) {
            setExcelData(excelData.filter((_, i) => i !== index));
        }
    };

    const updateExcelRow = (index, field, value) => {
        const updatedData = [...excelData];
        updatedData[index][field] = value;
        setExcelData(updatedData);
    };

    // Function to set class for all rows in current data
    const setClassForAllRows = (className, isManual = true) => {
        if (isManual) {
            const updatedData = manualData.map(row => ({ ...row, klasse: className }));
            setManualData(updatedData);
        } else {
            const updatedData = excelData.map(row => ({ ...row, klasse: className }));
            setExcelData(updatedData);
        }
    };

    // Load available classes
    useEffect(() => {
        const fetchAvailableClasses = async () => {
            try {
                const classes = await request('/api/getAvailableClasses');
                setAvailableClasses(classes);
            } catch (error) {
                console.warn('Konnte verfügbare Klassen nicht laden:', error);
                setAvailableClasses([]);
            }
        };
        fetchAvailableClasses();
    }, [request]);

    // Parse Excel file
    const parseExcelFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length < 2) {
                        reject(new Error('Excel-Datei muss mindestens eine Kopfzeile und eine Datenzeile enthalten'));
                        return;
                    }

                    // Skip header row and convert to our format
                    const students = jsonData.slice(1).map((row, index) => {
                        const [vorname, nachname, geschlecht, klasse] = row;
                        return {
                            vorname: vorname ? String(vorname).trim() : '',
                            nachname: nachname ? String(nachname).trim() : '',
                            geschlecht: geschlecht ? String(geschlecht).trim().toLowerCase() : 'Wähle...',
                            klasse: klasse ? String(klasse).trim() : ''
                        };
                    }).filter(student => student.vorname || student.nachname); // Filter empty rows

                    resolve(students);
                } catch (error) {
                    reject(new Error('Fehler beim Lesen der Excel-Datei: ' + error.message));
                }
            };

            reader.onerror = () => reject(new Error('Fehler beim Laden der Datei'));
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setExcelFile(file);

        try {
            const parsedData = await parseExcelFile(file);
            setExcelData(parsedData);
            setShowExcelPreview(true);
            showSuccess(`${parsedData.length} Datensätze aus Excel-Datei geladen und zur Bearbeitung bereit`, 'Excel-Parsing');
        } catch (error) {
            showError(error.message, 'Excel-Parsing');
            setExcelFile(null);
            setExcelData([]);
            setShowExcelPreview(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const submitManualImport = async () => {
        const errors = [];
        manualData.forEach((row, index) => {
            if (!row.vorname.trim()) errors.push(`Zeile ${index + 1}: Vorname fehlt`);
            if (!row.nachname.trim()) errors.push(`Zeile ${index + 1}: Nachname fehlt`);
            if (!row.klasse.trim() || row.klasse === 'Wähle...' || row.klasse === '') {
                errors.push(`Zeile ${index + 1}: Klasse muss ausgewählt werden`);
            }
        });

        if (errors.length > 0) {
            showError(errors.join('\n'), 'Validierungsfehler beim manuellen Import');
            return;
        }

        setIsImporting(true);
        try {
            const response = await request('/api/importStudents', {
                method: 'POST',
                data: JSON.stringify({ students: manualData }),
                headers: { 'Content-Type': 'application/json' },
                errorContext: 'Beim manuellen Import von Schülern'
            });
            resetForm();
            dialogRef.current.close();
            showSuccess(`${response.count} Schüler erfolgreich hinzugefügt`, 'Manueller Import');
            onImportSuccess(response.count);
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        } finally {
            setIsImporting(false);
        }
    };

    const submitExcelImport = async () => {
        if (!showExcelPreview || excelData.length === 0) {
            showError('Keine Excel-Daten zum Importieren verfügbar', 'Excel-Import');
            return;
        }

        // Validate excel data
        const errors = [];
        excelData.forEach((row, index) => {
            if (!row.vorname.trim()) errors.push(`Zeile ${index + 1}: Vorname fehlt`);
            if (!row.nachname.trim()) errors.push(`Zeile ${index + 1}: Nachname fehlt`);
            if (!row.klasse.trim() || row.klasse === 'Wähle...' || row.klasse === '') {
                errors.push(`Zeile ${index + 1}: Klasse muss ausgewählt werden`);
            }
        });

        if (errors.length > 0) {
            showError(errors.join('\n'), 'Validierungsfehler beim Excel-Import');
            return;
        }

        setIsImporting(true);
        try {
            const response = await request('/api/importStudents', {
                method: 'POST',
                data: JSON.stringify({ students: excelData }),
                headers: { 'Content-Type': 'application/json' },
                errorContext: 'Beim Excel-Import von Schülern'
            });
            resetForm();
            dialogRef.current.close();
            showSuccess(`${response.count} Schüler erfolgreich hinzugefügt`, 'Excel-Import');
            onImportSuccess(response.count);
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        } finally {
            setIsImporting(false);
        }
    };

    const resetForm = () => {
        setImportMethod('manual');
        setManualData([{ vorname: '', nachname: '', geschlecht: '', klasse: '' }]);
        setExcelFile(null);
        setExcelData([]);
        setShowExcelPreview(false);
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
            label: 'Abbrechen',
            onClick: () => dialogRef.current.close()
        },
        {
            label: 'Zurücksetzen',
            onClick: resetForm,
            variant: 'secondary'
        },
        {
            label: isImporting ? 'Importiere...' : 'Importieren',
            onClick: importMethod === 'manual' ? submitManualImport : submitExcelImport,
            variant: 'success',
            position: 'right',
            disabled: isImporting || (importMethod === 'excel' && !showExcelPreview)
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Schüler importieren"
            onClose={handleClose}
            size="xl"
            actions={actions}
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
                                            <option value="">Wähle...</option>
                                            <option value="männlich">Männlich</option>
                                            <option value="weiblich">Weiblich</option>
                                            <option value="divers">Divers</option>
                                        </select>
                                    </td>
                                    <td>
                                        <select
                                            value={row.klasse}
                                            onChange={(e) => updateManualRow(index, 'klasse', e.target.value)}
                                            className="form-select"
                                            style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                        >
                                            <option value="">Wähle...</option>
                                            {availableClasses.map(className => (
                                                <option key={className} value={className}>
                                                    {className}
                                                </option>
                                            ))}
                                        </select>
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
                    {!showExcelPreview ? (
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
                    ) : (
                        <div className="excel-preview">
                            <div className="manual-header">
                                <h3>📊 Excel-Daten bearbeiten ({excelData.length} Datensätze)</h3>
                                <div>
                                    <button
                                        className="add-button"
                                        onClick={addExcelRow}
                                        type="button"
                                    >
                                        + Zeile hinzufügen
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowExcelPreview(false);
                                            setExcelData([]);
                                            setExcelFile(null);
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                            }
                                        }}
                                        type="button"
                                    >
                                        Neue Datei wählen
                                    </button>
                                </div>
                            </div>

                            <div className="import-info-box">
                                <p><strong>✅ Excel-Datei erfolgreich geladen!</strong></p>
                                <p>Sie können die Daten jetzt bearbeiten, Zeilen hinzufügen oder entfernen.
                                    Klicken Sie auf "Importieren", wenn Sie fertig sind.</p>
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
                                    {excelData.map((row, index) => (
                                        <tr key={index}>
                                            <td>
                                                <input
                                                    type="text"
                                                    placeholder="Vorname"
                                                    value={row.vorname}
                                                    onChange={(e) => updateExcelRow(index, 'vorname', e.target.value)}
                                                    className="form-input"
                                                    style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    placeholder="Nachname"
                                                    value={row.nachname}
                                                    onChange={(e) => updateExcelRow(index, 'nachname', e.target.value)}
                                                    className="form-input"
                                                    style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    value={row.geschlecht}
                                                    onChange={(e) => updateExcelRow(index, 'geschlecht', e.target.value)}
                                                    className="form-select"
                                                    style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                                >
                                                    <option value="männlich">Männlich</option>
                                                    <option value="weiblich">Weiblich</option>
                                                    <option value="divers">Divers</option>
                                                </select>
                                            </td>
                                            <td>
                                                <select
                                                    value={row.klasse}
                                                    onChange={(e) => updateExcelRow(index, 'klasse', e.target.value)}
                                                    className="form-select"
                                                    style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                                >
                                                    <option value="">Wähle...</option>
                                                    {availableClasses.map(className => (
                                                        <option key={className} value={className}>
                                                            {className}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => removeExcelRow(index)}
                                                    disabled={excelData.length === 1}
                                                    title="Zeile entfernen"
                                                    type="button"
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
                </div>
            )}
        </BaseDialog>
    );
};

export default DataImportDialog;

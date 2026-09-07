import React, { useState, useRef, useEffect } from 'react';
import BaseDialog from '../../BaseDialog';
import { useApi } from '../../../hooks/useApi';
import { useGlobalError } from '../../../contexts/ErrorContext';
import { Workbook } from 'exceljs';

const CombinedImportDialog = ({ dialogRef, onImportSuccess, onClose }) => {
    const [importType, setImportType] = useState(''); // 'students', 'teachers', or ''
    const [importMethod, setImportMethod] = useState('manual');
    
    // Student data
    const [studentManualData, setStudentManualData] = useState([
        { vorname: '', nachname: '', geschlecht: '', klasse: '' }
    ]);
    const [studentExcelData, setStudentExcelData] = useState([]);
    
    // Teacher data
    const [teacherManualData, setTeacherManualData] = useState([
        { vorname: '', nachname: '', klasse: '', email: '' }
    ]);
    const [teacherExcelData, setTeacherExcelData] = useState([]);
    
    const [excelFile, setExcelFile] = useState(null);
    const [showExcelPreview, setShowExcelPreview] = useState(false);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);
    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();

    const getCurrentData = () => {
        if (importType === 'students') {
            return importMethod === 'manual' ? studentManualData : studentExcelData;
        } else {
            return importMethod === 'manual' ? teacherManualData : teacherExcelData;
        }
    };

    const setCurrentData = (data) => {
        if (importType === 'students') {
            if (importMethod === 'manual') {
                setStudentManualData(data);
            } else {
                setStudentExcelData(data);
            }
        } else {
            if (importMethod === 'manual') {
                setTeacherManualData(data);
            } else {
                setTeacherExcelData(data);
            }
        }
    };

    const getEmptyRow = () => {
        if (importType === 'students') {
            return { vorname: '', nachname: '', geschlecht: '', klasse: '' };
        } else {
            return { vorname: '', nachname: '', klasse: '', email: '' };
        }
    };

    const addManualRow = () => {
        const currentData = getCurrentData();
        const newRow = getEmptyRow();
        setCurrentData([...currentData, newRow]);
    };

    const removeManualRow = (index) => {
        const currentData = getCurrentData();
        if (currentData.length > 1) {
            setCurrentData(currentData.filter((_, i) => i !== index));
        }
    };

    const updateRow = (index, field, value) => {
        const currentData = getCurrentData();
        const updatedData = [...currentData];
        updatedData[index][field] = value;
        setCurrentData(updatedData);
    };

    const addExcelRow = () => {
        const currentData = getCurrentData();
        const newRow = getEmptyRow();
        setCurrentData([...currentData, newRow]);
    };

    const removeExcelRow = (index) => {
        const currentData = getCurrentData();
        if (currentData.length > 1) {
            setCurrentData(currentData.filter((_, i) => i !== index));
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
    const parseExcelFile = async (file) => {
        try {
            const workbook = new Workbook();
            await workbook.xlsx.load(await file.arrayBuffer());
            const worksheet = workbook.worksheets[0];
            if (!worksheet || worksheet.rowCount < 2) {
                throw new Error('Excel-Datei muss mindestens eine Kopfzeile und eine Datenzeile enthalten');
            }

            const rows = [];
            for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
                const row = worksheet.getRow(rowNumber);
                rows.push([1, 2, 3, 4].map((column) => row.getCell(column).text.trim()));
            }

            if (importType === 'students') {
                return rows.map(([vorname, nachname, geschlecht, klasse]) => ({
                    vorname,
                    nachname,
                    geschlecht: geschlecht.toLowerCase(),
                    klasse,
                })).filter((item) => item.vorname || item.nachname);
            }
            return rows.map(([vorname, nachname, klasse, email]) => ({
                vorname,
                nachname,
                klasse,
                email,
            })).filter((item) => item.vorname || item.nachname || item.email);
        } catch (error) {
            if (error.message.startsWith('Excel-Datei')) throw error;
            throw new Error(`Fehler beim Lesen der Excel-Datei: ${error.message}`);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setExcelFile(file);

        try {
            const parsedData = await parseExcelFile(file);
            setCurrentData(parsedData);
            setShowExcelPreview(true);
            showSuccess(`${parsedData.length} Datensätze aus Excel-Datei geladen und zur Bearbeitung bereit`, 'Excel-Parsing');
        } catch (error) {
            showError(error.message, 'Excel-Parsing');
            setExcelFile(null);
            setCurrentData([]);
            setShowExcelPreview(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const submitImport = async () => {
        const currentData = getCurrentData();
        const errors = [];

        if (importType === 'students') {
            currentData.forEach((row, index) => {
                if (!row.vorname.trim()) errors.push(`Zeile ${index + 1}: Vorname fehlt`);
                if (!row.nachname.trim()) errors.push(`Zeile ${index + 1}: Nachname fehlt`);
                if (!row.klasse.trim() || row.klasse === 'Wähle...') {
                    errors.push(`Zeile ${index + 1}: Klasse muss ausgewählt werden`);
                }
            });
        } else {
            currentData.forEach((row, index) => {
                if (!row.vorname.trim()) errors.push(`Zeile ${index + 1}: Vorname fehlt`);
                if (!row.nachname.trim()) errors.push(`Zeile ${index + 1}: Nachname fehlt`);
                if (!row.email.trim()) errors.push(`Zeile ${index + 1}: E-Mail fehlt`);
            });
        }

        if (errors.length > 0) {
            showError(errors.join('\\n'), `Validierungsfehler beim ${importMethod === 'manual' ? 'manuellen' : 'Excel'}-Import`);
            return;
        }

        setIsImporting(true);
        try {
            const endpoint = importType === 'students' ? '/api/importStudents' : '/api/importTeachers';
            const dataKey = importType === 'students' ? 'students' : 'teachers';
            
            const response = await request(endpoint, {
                method: 'POST',
                data: JSON.stringify({ [dataKey]: currentData }),
                headers: { 'Content-Type': 'application/json' },
                errorContext: `Beim ${importMethod === 'manual' ? 'manuellen' : 'Excel'}-Import von ${importType === 'students' ? 'Schülern' : 'Lehrern'}`
            });
            
            resetForm();
            dialogRef.current.close();
            showSuccess(`${response.count} ${importType === 'students' ? 'Schüler' : 'Lehrer'} erfolgreich hinzugefügt`, `${importMethod === 'manual' ? 'Manueller' : 'Excel'}-Import`);
            onImportSuccess(response.count, importType);
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        } finally {
            setIsImporting(false);
        }
    };

    const resetForm = () => {
        setImportType('');
        setImportMethod('manual');
        setStudentManualData([{ vorname: '', nachname: '', geschlecht: '', klasse: '' }]);
        setStudentExcelData([]);
        setTeacherManualData([{ vorname: '', nachname: '', klasse: '', email: '' }]);
        setTeacherExcelData([]);
        setExcelFile(null);
        setShowExcelPreview(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleTypeChange = (newType) => {
        setImportType(newType);
        setImportMethod('manual');
        setExcelFile(null);
        setShowExcelPreview(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const resetToTypeSelection = () => {
        setImportType('');
        setImportMethod('manual');
        setStudentManualData([{ vorname: '', nachname: '', geschlecht: '', klasse: '' }]);
        setStudentExcelData([]);
        setTeacherManualData([{ vorname: '', nachname: '', klasse: '', email: '' }]);
        setTeacherExcelData([]);
        setExcelFile(null);
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
        // Only show back button when a type is selected
        ...(importType ? [{
            label: 'Zurück',
            onClick: resetToTypeSelection,
            variant: 'secondary'
        }] : []),
        // Only show reset button when a type is selected
        ...(importType ? [{
            label: 'Zurücksetzen',
            onClick: () => {
                if (importType === 'students') {
                    setStudentManualData([{ vorname: '', nachname: '', geschlecht: '', klasse: '' }]);
                    setStudentExcelData([]);
                } else {
                    setTeacherManualData([{ vorname: '', nachname: '', klasse: '', email: '' }]);
                    setTeacherExcelData([]);
                }
                setImportMethod('manual');
                setExcelFile(null);
                setShowExcelPreview(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
            variant: 'secondary'
        }] : []),
        // Only show import button when a type is selected
        ...(importType ? [{
            label: isImporting ? 'Importiere...' : 'Importieren',
            onClick: submitImport,
            variant: 'success',
            position: 'right',
            disabled: isImporting || (importMethod === 'excel' && !showExcelPreview)
        }] : [])
    ];

    const getDialogTitle = () => {
        if (!importType) return 'Daten importieren';
        if (importType === 'students') return 'Schüler importieren';
        if (importType === 'teachers') return 'Lehrer importieren';
        return 'Daten importieren';
    };

    const currentData = getCurrentData();

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title={getDialogTitle()}
            onClose={handleClose}
            size="xl"
            actions={actions}
            showDefaultClose={false}
        >
            {/* Type Selector - only shown when no type is selected */}
            {!importType && (
                <div className="type-selection">
                    <h3 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
                        Was möchten Sie importieren?
                    </h3>
                    
                    <div className="method-selector">
                        <label 
                            className="method-option" 
                            onClick={() => handleTypeChange('students')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="method-icon" style={{ fontSize: '3rem' }}>👨‍🎓</div>
                            <div>
                                <strong>Schüler importieren</strong>
                                <p>Schülerdaten hinzufügen</p>
                            </div>
                        </label>

                        <label 
                            className="method-option" 
                            onClick={() => handleTypeChange('teachers')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="method-icon" style={{ fontSize: '3rem' }}>👩‍🏫</div>
                            <div>
                                <strong>Lehrer importieren</strong>
                                <p>Lehrerdaten hinzufügen</p>
                            </div>
                        </label>
                    </div>
                </div>
            )}

            {/* Import interface - only shown when a type is selected */}
            {importType && (
                <div className="import-content">
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
                                <p>{importType === 'students' ? 'Schüler' : 'Lehrer'} einzeln hinzufügen</p>
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
                        <h3>{importType === 'students' ? 'Schüler' : 'Lehrer'} manuell hinzufügen</h3>
                        <button className="add-button" onClick={addManualRow}>
                            + Zeile hinzufügen
                        </button>
                    </div>

                    <table className="table">
                        <thead>
                            <tr>
                                <th>Vorname</th>
                                <th>Nachname</th>
                                {importType === 'students' && <th>Geschlecht</th>}
                                <th>Klasse{importType === 'teachers' ? ' (optional)' : ''}</th>
                                {importType === 'teachers' && <th>E-Mail</th>}
                                <th style={{ width: '60px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((row, index) => (
                                <tr key={index}>
                                    <td>
                                        <input
                                            type="text"
                                            placeholder="Vorname"
                                            value={row.vorname}
                                            onChange={(e) => updateRow(index, 'vorname', e.target.value)}
                                            className="form-input"
                                            style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            placeholder="Nachname"
                                            value={row.nachname}
                                            onChange={(e) => updateRow(index, 'nachname', e.target.value)}
                                            className="form-input"
                                            style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                        />
                                    </td>
                                    {importType === 'students' && (
                                        <td>
                                            <select
                                                value={row.geschlecht}
                                                onChange={(e) => updateRow(index, 'geschlecht', e.target.value)}
                                                className="form-select"
                                                style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                            >
                                                <option value="">Wähle...</option>
                                                <option value="männlich">Männlich</option>
                                                <option value="weiblich">Weiblich</option>
                                                <option value="divers">Divers</option>
                                            </select>
                                        </td>
                                    )}
                                    <td>
                                        <select
                                            value={row.klasse}
                                            onChange={(e) => updateRow(index, 'klasse', e.target.value)}
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
                                    {importType === 'teachers' && (
                                        <td>
                                            <input
                                                type="email"
                                                placeholder="E-Mail"
                                                value={row.email}
                                                onChange={(e) => updateRow(index, 'email', e.target.value)}
                                                className="form-input"
                                                style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                            />
                                        </td>
                                    )}
                                    <td>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => removeManualRow(index)}
                                            disabled={currentData.length === 1}
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
                            <h3>Excel-Import für {importType === 'students' ? 'Schüler' : 'Lehrer'}</h3>

                            <div className="format-info">
                                <strong>Erwartetes Format:</strong>
                                <div className="example-table">
                                    <div className="example-header">
                                        <span>Vorname</span>
                                        <span>Nachname</span>
                                        {importType === 'students' && <span>Geschlecht</span>}
                                        <span>Klasse{importType === 'teachers' ? ' (optional)' : ''}</span>
                                        {importType === 'teachers' && <span>E-Mail</span>}
                                    </div>
                                    <div className="example-row">
                                        {importType === 'students' ? (
                                            <>
                                                <span>Max</span>
                                                <span>Mustermann</span>
                                                <span>männlich</span>
                                                <span>5a</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Max</span>
                                                <span>Mustermann</span>
                                                <span>5a</span>
                                                <span>max.mustermann@schule.de</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="example-row">
                                        {importType === 'students' ? (
                                            <>
                                                <span>Anna</span>
                                                <span>Schmidt</span>
                                                <span>weiblich</span>
                                                <span>5b</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Anna</span>
                                                <span>Schmidt</span>
                                                <span>6b</span>
                                                <span>anna.schmidt@schule.de</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <p className="format-note">
                                    Die erste Zeile sollte die Spaltenüberschriften enthalten.
                                    {importType === 'teachers' && ' Die Klasse ist optional.'}
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
                                <h3>📊 Excel-Daten bearbeiten ({currentData.length} Datensätze)</h3>
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
                                            setCurrentData([]);
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
                                    Klicken Sie auf &quot;Importieren&quot;, wenn Sie fertig sind.</p>
                            </div>

                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Vorname</th>
                                        <th>Nachname</th>
                                        {importType === 'students' && <th>Geschlecht</th>}
                                        <th>Klasse{importType === 'teachers' ? ' (optional)' : ''}</th>
                                        {importType === 'teachers' && <th>E-Mail</th>}
                                        <th style={{ width: '60px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentData.map((row, index) => (
                                        <tr key={index}>
                                            <td>
                                                <input
                                                    type="text"
                                                    placeholder="Vorname"
                                                    value={row.vorname}
                                                    onChange={(e) => updateRow(index, 'vorname', e.target.value)}
                                                    className="form-input"
                                                    style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    placeholder="Nachname"
                                                    value={row.nachname}
                                                    onChange={(e) => updateRow(index, 'nachname', e.target.value)}
                                                    className="form-input"
                                                    style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                                />
                                            </td>
                                            {importType === 'students' && (
                                                <td>
                                                    <select
                                                        value={row.geschlecht}
                                                        onChange={(e) => updateRow(index, 'geschlecht', e.target.value)}
                                                        className="form-select"
                                                        style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                                    >
                                                        <option value="">Wähle...</option>
                                                        <option value="männlich">Männlich</option>
                                                        <option value="weiblich">Weiblich</option>
                                                        <option value="divers">Divers</option>
                                                    </select>
                                                </td>
                                            )}
                                            <td>
                                                <select
                                                    value={row.klasse}
                                                    onChange={(e) => updateRow(index, 'klasse', e.target.value)}
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
                                            {importType === 'teachers' && (
                                                <td>
                                                    <input
                                                        type="email"
                                                        placeholder="E-Mail"
                                                        value={row.email}
                                                        onChange={(e) => updateRow(index, 'email', e.target.value)}
                                                        className="form-input"
                                                        style={{ width: '100%', margin: 0, padding: '0.5rem' }}
                                                    />
                                                </td>
                                            )}
                                            <td>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => removeExcelRow(index)}
                                                    disabled={currentData.length === 1}
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
            </div>
            )}
        </BaseDialog>
    );
};

export default CombinedImportDialog;

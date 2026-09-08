import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Workbook } from 'exceljs';
import BaseDialog from '../../BaseDialog';
import { useApi } from '../../../hooks/useApi';
import { useGlobalError } from '../../../contexts/ErrorContext';
import { parseCsv } from '../../../utils/fileImport';
import { IMPORT_FIELDS, mapImportedRows, stripImportMetadata, suggestColumnMappings, validateMappedRows } from '../../../utils/importHelpers';

const EMPTY_ROWS = {
    students: { vorname: '', nachname: '', geschlecht: '', klasse: '' },
    teachers: { vorname: '', nachname: '', klasse: '', email: '' },
};

const CombinedImportDialog = ({ dialogRef, onImportSuccess, onClose }) => {
    const [importType, setImportType] = useState('');
    const [importMethod, setImportMethod] = useState('manual');
    const [manualData, setManualData] = useState({ students: [{ ...EMPTY_ROWS.students }], teachers: [{ ...EMPTY_ROWS.teachers }] });
    const [fileStage, setFileStage] = useState('upload');
    const [fileName, setFileName] = useState('');
    const [sourceHeaders, setSourceHeaders] = useState([]);
    const [sourceRows, setSourceRows] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [defaultClass, setDefaultClass] = useState('');
    const [mappedRows, setMappedRows] = useState([]);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [existingStudentIds, setExistingStudentIds] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);
    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();

    useEffect(() => {
        request('/api/getAvailableClasses')
            .then((classes) => setAvailableClasses(Array.isArray(classes) ? classes : []))
            .catch(() => setAvailableClasses([]));
        request('/api/getAllStudents', { showErrorMessage: false })
            .then((students) => setExistingStudentIds(Array.isArray(students) ? students.map((student) => student.id) : []))
            .catch(() => setExistingStudentIds([]));
    }, [request]);

    const fields = useMemo(() => IMPORT_FIELDS[importType] || [], [importType]);
    const validatedRows = useMemo(() => validateMappedRows({ rows: mappedRows, importType, availableClasses, existingStudentIds }), [mappedRows, importType, availableClasses, existingStudentIds]);
    const errorCount = validatedRows.filter((row) => row._errors.length > 0).length;
    const warningCount = validatedRows.filter((row) => row._warnings.length > 0).length;
    const validCount = validatedRows.length - errorCount;
    const mappingErrors = useMemo(() => {
        const errors = [];
        fields.filter((field) => field.required).forEach((field) => {
            if (!mappings.includes(field.key) && !(field.key === 'klasse' && defaultClass)) errors.push(`${field.label} muss zugeordnet werden`);
        });
        fields.forEach((field) => {
            if (mappings.filter((mapping) => mapping === field.key).length > 1) errors.push(`${field.label} wurde mehrfach zugeordnet`);
        });
        return errors;
    }, [defaultClass, fields, mappings]);

    const resetFile = () => {
        setFileStage('upload'); setFileName(''); setSourceHeaders([]); setSourceRows([]); setMappings([]); setDefaultClass(''); setMappedRows([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    const resetForm = () => {
        setImportType(''); setImportMethod('manual');
        setManualData({ students: [{ ...EMPTY_ROWS.students }], teachers: [{ ...EMPTY_ROWS.teachers }] });
        resetFile();
    };

    const readFile = async (file) => {
        if (file.name.toLocaleLowerCase().endsWith('.csv')) {
            const buffer = await file.arrayBuffer();
            let text = new TextDecoder('utf-8').decode(buffer);
            if (text.includes('\uFFFD')) text = new TextDecoder('windows-1252').decode(buffer);
            return parseCsv(text);
        }
        const workbook = new Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const worksheet = workbook.worksheets[0];
        if (!worksheet) throw new Error('Die Excel-Datei enthält kein Tabellenblatt');
        const rows = [];
        for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
            const row = worksheet.getRow(rowNumber);
            const values = Array.from({ length: worksheet.actualColumnCount }, (_, index) => row.getCell(index + 1).text.trim());
            if (values.some(Boolean)) rows.push(values);
        }
        return rows;
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const rows = await readFile(file);
            if (rows.length < 2) throw new Error('Die Datei muss eine Kopfzeile und mindestens eine Datenzeile enthalten');
            const headers = rows[0].map((header, index) => header || `Spalte ${index + 1}`);
            const dataRows = rows.slice(1).map((row) => Array.from({ length: headers.length }, (_, index) => row[index] ?? ''));
            setFileName(file.name); setSourceHeaders(headers); setSourceRows(dataRows);
            setMappings(suggestColumnMappings(headers, importType)); setFileStage('mapping');
        } catch (error) {
            showError(`Datei konnte nicht gelesen werden: ${error.message}`, 'Datei-Import'); resetFile();
        }
    };

    const openPreview = () => {
        if (mappingErrors.length) return showError(mappingErrors.join('\n'), 'Spaltenzuordnung');
        const rows = mapImportedRows(sourceRows, mappings).map((row) => (
            !mappings.includes('klasse') && defaultClass ? { ...row, klasse: defaultClass } : row
        ));
        if (!rows.length) return showError('Die zugeordneten Spalten enthalten keine Datensätze', 'Datei-Import');
        setMappedRows(rows); setFileStage('preview');
    };

    const downloadExampleFile = async () => {
        try {
            const workbook = new Workbook();
            workbook.creator = 'Sponsorenlauf-Tool';
            workbook.created = new Date();
            const worksheet = workbook.addWorksheet(importType === 'students' ? 'Schüler' : 'Lehrer', {
                views: [{ state: 'frozen', ySplit: 1 }],
            });
            const firstClass = '5a';
            const secondClass = '7c';

            if (importType === 'students') {
                worksheet.columns = [
                    { header: 'ID (optional)', key: 'id', width: 16 },
                    { header: 'Vorname', key: 'vorname', width: 22 },
                    { header: 'Nachname', key: 'nachname', width: 24 },
                    { header: 'Geschlecht (optional)', key: 'geschlecht', width: 24 },
                    { header: 'Klasse', key: 'klasse', width: 18 },
                ];
                worksheet.addRows([
                    { id: 1001, vorname: 'Anna', nachname: 'Schmidt', geschlecht: 'weiblich', klasse: firstClass },
                    { id: '', vorname: 'Max', nachname: 'Müller', geschlecht: 'männlich', klasse: secondClass },
                ]);
                worksheet.dataValidations.add('D2:D1000', {
                    type: 'list', allowBlank: true, formulae: ['"männlich,weiblich,divers"'],
                });
            } else {
                worksheet.columns = [
                    { header: 'Vorname', key: 'vorname', width: 22 },
                    { header: 'Nachname', key: 'nachname', width: 24 },
                    { header: 'Klasse (optional)', key: 'klasse', width: 20 },
                    { header: 'E-Mail', key: 'email', width: 34 },
                ];
                worksheet.addRows([
                    { vorname: 'Anna', nachname: 'Schmidt', klasse: firstClass, email: 'anna.schmidt@schule.de' },
                    { vorname: 'Max', nachname: 'Müller', klasse: '', email: 'sekretariat@schule.de' },
                ]);
            }

            worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: worksheet.columnCount } };
            worksheet.getRow(1).height = 26;
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A90E2' } };
                cell.alignment = { vertical: 'middle' };
            });
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) row.alignment = { vertical: 'middle' };
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = importType === 'students' ? 'beispiel-schueler-import.xlsx' : 'beispiel-lehrer-import.xlsx';
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 0);
        } catch (error) {
            showError(`Beispieldatei konnte nicht erstellt werden: ${error.message}`, 'Datei-Import');
        }
    };
    const updateMappedRow = (index, field, value) => setMappedRows((rows) => {
        const repeatedValue = ['klasse', 'geschlecht'].includes(field) ? rows[index]?.[field] : null;
        return rows.map((row, rowIndex) => (
            rowIndex === index || (repeatedValue && row[field] === repeatedValue)
                ? { ...row, [field]: value }
                : row
        ));
    });
    const updateManualRow = (index, field, value) => setManualData((data) => ({ ...data, [importType]: data[importType].map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row) }));

    const submitImport = async () => {
        let rows;
        if (importMethod === 'file') {
            if (!validatedRows.length || errorCount > 0) return showError('Bitte beheben Sie alle markierten Fehler vor dem Import.', 'Importprüfung');
            rows = validatedRows.map(stripImportMetadata);
        } else {
            rows = manualData[importType];
            const errors = [];
            rows.forEach((row, index) => {
                if (!row.vorname.trim()) errors.push(`Zeile ${index + 1}: Vorname fehlt`);
                if (!row.nachname.trim()) errors.push(`Zeile ${index + 1}: Nachname fehlt`);
                if (importType === 'students' && !row.klasse.trim()) errors.push(`Zeile ${index + 1}: Klasse fehlt`);
                if (importType === 'teachers' && !row.email.trim()) errors.push(`Zeile ${index + 1}: E-Mail fehlt`);
            });
            if (errors.length) return showError(errors.join('\n'), 'Validierungsfehler');
        }
        setIsImporting(true);
        try {
            const endpoint = importType === 'students' ? '/api/importStudents' : '/api/importTeachers';
            const dataKey = importType === 'students' ? 'students' : 'teachers';
            const response = await request(endpoint, { method: 'POST', data: JSON.stringify({ [dataKey]: rows }), headers: { 'Content-Type': 'application/json' }, errorContext: `Import von ${importType === 'students' ? 'Schülern' : 'Lehrern'}` });
            const importedType = importType;
            resetForm(); dialogRef.current.close();
            showSuccess(`${response.count} ${importedType === 'students' ? 'Schüler' : 'Lehrer'} erfolgreich hinzugefügt`, 'Daten-Import');
            onImportSuccess(response.count, importedType);
        } catch { /* useApi displays server validation errors */ } finally { setIsImporting(false); }
    };

    const goBack = () => {
        if (importMethod === 'file' && fileStage === 'preview') setFileStage('mapping');
        else if (importMethod === 'file' && fileStage === 'mapping') resetFile();
        else { setImportType(''); resetFile(); }
    };
    const actions = [
        importType
            ? { label: 'Zurück', variant: 'secondary', position: 'left', onClick: goBack }
            : { label: 'Abbrechen', variant: 'secondary', position: 'left', onClick: () => dialogRef.current.close() },
        ...(importType && importMethod === 'file' && fileStage === 'mapping' ? [{ label: 'Daten prüfen', variant: 'success', position: 'right', onClick: openPreview }] : []),
        ...(importType && (importMethod === 'manual' || fileStage === 'preview') ? [{ label: isImporting ? 'Importiere…' : 'Importieren', variant: 'success', position: 'right', onClick: submitImport, disabled: isImporting || (importMethod === 'file' && errorCount > 0) }] : []),
    ];
    const manualRows = importType ? manualData[importType] : [];

    return <BaseDialog dialogRef={dialogRef} title={!importType ? 'Daten importieren' : `${importType === 'students' ? 'Schüler' : 'Lehrer'} importieren`} onClose={() => { resetForm(); onClose(); }} size="xl" actions={actions} showDefaultClose={false}>
        {!importType ? <div className="type-selection"><h3 className="import-centered-title">Was möchten Sie importieren?</h3><div className="method-selector">
            <button type="button" className="method-option" onClick={() => setImportType('students')}><span className="method-icon">👨‍🎓</span><span><strong>Schüler importieren</strong><small>Schülerdaten hinzufügen</small></span></button>
            <button type="button" className="method-option" onClick={() => setImportType('teachers')}><span className="method-icon">👩‍🏫</span><span><strong>Lehrer importieren</strong><small>Lehrerdaten hinzufügen</small></span></button>
        </div></div> : <div className="import-content">
            <div className="method-selector">
                <label className={`method-option ${importMethod === 'manual' ? 'active' : ''}`}><input type="radio" name="importMethod" checked={importMethod === 'manual'} onChange={() => setImportMethod('manual')} /><span className="method-icon">✏️</span><span><strong>Manuell eingeben</strong><small>Datensätze einzeln hinzufügen</small></span></label>
                <label className={`method-option ${importMethod === 'file' ? 'active' : ''}`}><input type="radio" name="importMethod" checked={importMethod === 'file'} onChange={() => setImportMethod('file')} /><span className="method-icon">📊</span><span><strong>Datei importieren</strong><small>Excel- oder CSV-Datei verwenden</small></span></label>
            </div>
            {importMethod === 'manual' ? <div className="manual-import"><div className="manual-header"><h3>Manuell hinzufügen</h3><button type="button" className="add-button" onClick={() => setManualData((data) => ({ ...data, [importType]: [...data[importType], { ...EMPTY_ROWS[importType] }] }))}>+ Zeile hinzufügen</button></div>
                <ImportTable rows={manualRows} importType={importType} availableClasses={availableClasses} onChange={updateManualRow} onRemove={(index) => setManualData((data) => ({ ...data, [importType]: data[importType].filter((_, rowIndex) => rowIndex !== index) }))} canRemove={manualRows.length > 1} /></div>
                : fileStage === 'upload' ? <div className="excel-info">
                    <h3>Excel- oder CSV-Datei auswählen</h3>
                    <p>Die erste Zeile muss Spaltenüberschriften enthalten. Die Namen und Reihenfolge können im nächsten Schritt frei zugeordnet werden.</p>
                    <ExpectedFileFormat importType={importType} onDownload={downloadExampleFile} />
                    <div className="import-file-divider">Eigene Datei auswählen</div>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.csv,text/csv" onChange={handleFileSelect} className="file-input" />
                </div>
                : fileStage === 'mapping' ? <ColumnMapping fileName={fileName} headers={sourceHeaders} rows={sourceRows} mappings={mappings} fields={fields} errors={mappingErrors} importType={importType} availableClasses={availableClasses} defaultClass={defaultClass} onDefaultClassChange={setDefaultClass} onChange={(index, value) => setMappings((current) => current.map((mapping, mapIndex) => mapIndex === index ? value : mapping))} />
                : <ValidationPreview rows={validatedRows} importType={importType} availableClasses={availableClasses} validCount={validCount} warningCount={warningCount} errorCount={errorCount} onChange={updateMappedRow} onRemove={(index) => setMappedRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} />}
        </div>}
    </BaseDialog>;
};

const ExpectedFileFormat = ({ importType, onDownload }) => {
    const fields = IMPORT_FIELDS[importType];
    const examples = importType === 'students'
        ? [
            { id: '1042', vorname: 'Anna', nachname: 'Schmidt', geschlecht: 'W', klasse: '5a' },
            { id: '', vorname: 'Max', nachname: 'Müller', geschlecht: 'männlich', klasse: '7c' },
        ]
        : [
            { vorname: 'Anna', nachname: 'Schmidt', klasse: '5a', email: 'anna.schmidt@schule.de' },
            { vorname: 'Max', nachname: 'Müller', klasse: '7c', email: 'sekretariat@schule.de' },
        ];

    return <section className="expected-import-format" aria-labelledby="expected-import-heading">
        <div className="expected-import-heading-row">
            <div><h4 id="expected-import-heading">Benötigte Daten</h4><p>Mit * markierte Felder sind erforderlich.</p></div>
            <button type="button" className="import-example-download" onClick={onDownload}>
                <span className="import-download-icon" aria-hidden="true">↓</span>
                <span className="import-download-copy"><strong>Beispieldatei herunterladen</strong><small>Excel-Arbeitsmappe (.xlsx)</small></span>
            </button>
        </div>
        <div className="expected-field-list">{fields.map((field) => <span key={field.key} className={field.required ? 'required' : ''}>{field.label}{field.required ? ' *' : ' (optional)'}</span>)}</div>
        <div className="import-table-scroll"><table className="table expected-import-table">
            <thead><tr>{fields.map((field) => <th key={field.key}>{field.label}{field.required ? ' *' : ''}</th>)}</tr></thead>
            <tbody>{examples.map((example, index) => <tr key={index}>{fields.map((field) => <td key={field.key}>{example[field.key] || '—'}</td>)}</tr>)}</tbody>
        </table></div>
        <p className="expected-format-note">Weitere Spalten sind erlaubt und können später auf „Ignorieren“ gesetzt werden. Bitte ersetzen oder löschen Sie die zwei Beispieldatensätze vor dem Import.</p>
    </section>;
};

const ColumnMapping = ({ fileName, headers, rows, mappings, fields, errors, importType, availableClasses, defaultClass, onDefaultClassChange, onChange }) => <div className="column-mapping">
    <div className="manual-header"><h3>Spalten zuordnen</h3><span className="selected-file">{fileName}</span></div><p>Wählen Sie für jede Dateispalte im Tabellenkopf das passende Feld. Nicht benötigte Spalten können ignoriert werden.</p>
    {errors.length > 0 && <div className="import-summary error">{errors.join(' · ')}</div>}
    <div className="mapping-preview-label">Vorschau: {Math.min(rows.length, 5)} von {rows.length} Datenzeilen</div>
    <div className="import-table-scroll"><table className="table mapping-table">
        <thead><tr>{headers.map((header, columnIndex) => <th key={`${header}-${columnIndex}`}>
            <span className="mapping-source-header" title={header}>{header}</span>
            <select className="form-select mapping-field-select" aria-label={`Zuweisung für ${header}`} value={mappings[columnIndex]} onChange={(event) => onChange(columnIndex, event.target.value)}>
                <option value="">Ignorieren</option>
                {fields.map((field) => <option key={field.key} value={field.key} disabled={mappings.includes(field.key) && mappings[columnIndex] !== field.key}>{field.label}{field.required ? ' *' : ''}</option>)}
            </select>
        </th>)}{!mappings.includes('klasse') && <th className="mapping-added-column">
            <span className="mapping-source-header">Nicht in der Datei</span>
            <select className="form-select mapping-field-select" aria-label="Zusätzliche Klassenspalte" value="klasse" disabled><option value="klasse">Klasse{importType === 'students' ? ' *' : ''}</option></select>
        </th>}</tr></thead>
        <tbody>{rows.slice(0, 5).map((row, rowIndex) => <tr key={rowIndex}>{headers.map((header, columnIndex) => <td key={`${header}-${columnIndex}`} title={row[columnIndex] || ''}>{row[columnIndex] || '—'}</td>)}{!mappings.includes('klasse') && <td className="mapping-added-column">{defaultClass || '—'}</td>}</tr>)}</tbody>
    </table></div>
    {!mappings.includes('klasse') && <div className="missing-class-mapping">
        <div><strong>Keine Klassenspalte zugeordnet</strong><p>{importType === 'students' ? 'Wählen Sie eine Klasse für alle Schüler oder ordnen Sie oben eine Dateispalte zu.' : 'Optional können Sie allen Lehrern dieselbe Klasse geben. Eine individuelle Zuordnung ist im nächsten Schritt weiterhin möglich.'}</p></div>
        <label><span>Klasse für alle</span><select className="form-select" value={defaultClass} onChange={(event) => onDefaultClassChange(event.target.value)}><option value="">{importType === 'students' ? 'Klasse wählen…' : 'Keine Klasse'}</option>{availableClasses.map((className) => <option key={className} value={className}>{className}</option>)}</select></label>
    </div>}
</div>;

const ImportTable = ({ rows, importType, availableClasses, onChange, onRemove, canRemove }) => <div className="import-table-scroll"><table className="table"><thead><tr><th>Vorname</th><th>Nachname</th>{importType === 'students' && <th>Geschlecht</th>}<th>Klasse</th>{importType === 'teachers' && <th>E-Mail</th>}<th /></tr></thead><tbody>{rows.map((row, index) => <tr key={index}><td><input type="text" className="form-input import-cell" value={row.vorname} onChange={(event) => onChange(index, 'vorname', event.target.value)} /></td><td><input type="text" className="form-input import-cell" value={row.nachname} onChange={(event) => onChange(index, 'nachname', event.target.value)} /></td>{importType === 'students' && <td><select className="form-select import-cell" value={row.geschlecht} onChange={(event) => onChange(index, 'geschlecht', event.target.value)}><option value="">—</option><option value="männlich">Männlich</option><option value="weiblich">Weiblich</option><option value="divers">Divers</option></select></td>}<td><select className="form-select import-cell" value={row.klasse} onChange={(event) => onChange(index, 'klasse', event.target.value)}><option value="">—</option>{availableClasses.map((className) => <option key={className}>{className}</option>)}</select></td>{importType === 'teachers' && <td><input type="email" className="form-input import-cell" value={row.email} onChange={(event) => onChange(index, 'email', event.target.value)} /></td>}<td><button type="button" className="btn btn-danger btn-sm" disabled={!canRemove} onClick={() => onRemove(index)}>🗑️</button></td></tr>)}</tbody></table></div>;

const ValidationPreview = ({ rows, importType, availableClasses, validCount, warningCount, errorCount, onChange, onRemove }) => {
    const showStudentId = importType === 'students' && rows.some((row) => (
        row.id !== undefined && row.id !== null && String(row.id).trim() !== ''
    ));

    return <div className="validation-preview">
    <div className="manual-header"><h3>Daten prüfen</h3><div className="import-counts"><span className="valid">✓ {validCount} gültig</span><span className="warning">⚠ {warningCount} Hinweise</span><span className="error">✕ {errorCount} Fehler</span></div></div><p>Automatisch erkannte Klassen werden mit dem Namen aus der Klassenstruktur gespeichert. Eine Klassen- oder Geschlechtskorrektur gilt automatisch für alle Zeilen mit demselben Ausgangswert.</p>
    <div className="import-table-scroll"><table className="table validation-table"><thead><tr><th>Status</th>{showStudentId && <th>ID</th>}<th>Vorname</th><th>Nachname</th>{importType === 'students' && <th>Geschlecht</th>}<th>Klasse</th>{importType === 'teachers' && <th>E-Mail</th>}<th>Hinweis</th><th /></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row._sourceIndex}-${index}`} className={row._errors.length ? 'import-row-error' : row._warnings.length ? 'import-row-warning' : ''}><td>{row._errors.length ? '✕' : row._warnings.length ? '⚠' : '✓'}</td>{showStudentId && <td><input type="text" className="form-input import-cell import-id-cell" value={row.id ?? ''} onChange={(event) => onChange(index, 'id', event.target.value)} /></td>}<td><input type="text" className="form-input import-cell" value={row.vorname || ''} onChange={(event) => onChange(index, 'vorname', event.target.value)} /></td><td><input type="text" className="form-input import-cell" value={row.nachname || ''} onChange={(event) => onChange(index, 'nachname', event.target.value)} /></td>{importType === 'students' && <td><select className="form-select import-cell" value={['männlich', 'weiblich', 'divers'].includes(row.geschlecht) ? row.geschlecht : ''} onChange={(event) => onChange(index, 'geschlecht', event.target.value)}><option value="">—</option><option value="männlich">Männlich</option><option value="weiblich">Weiblich</option><option value="divers">Divers</option></select></td>}<td><select className="form-select import-cell" value={availableClasses.includes(row.klasse) ? row.klasse : ''} onChange={(event) => onChange(index, 'klasse', event.target.value)}><option value="">Klasse wählen…</option>{availableClasses.map((className) => <option key={className} value={className}>{className}</option>)}</select></td>{importType === 'teachers' && <td><input type="email" className="form-input import-cell" value={row.email || ''} onChange={(event) => onChange(index, 'email', event.target.value)} /></td>}<td className="import-messages">{[...row._errors, ...row._warnings].join(' · ') || 'Gültig'}</td><td><button type="button" className="btn btn-danger btn-sm" onClick={() => onRemove(index)}>🗑️</button></td></tr>)}</tbody></table></div>
</div>;
};

export default CombinedImportDialog;

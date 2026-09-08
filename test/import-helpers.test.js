import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectCsvDelimiter, parseCsv } from '../src/utils/fileImport.js';
import {
    mapImportedRows,
    matchClassName,
    normalizeImportedGender,
    suggestColumnMappings,
    tokenizeClassName,
    validateMappedRows,
} from '../src/utils/importHelpers.js';

test('class tokenizer preserves structural numeric boundaries', () => {
    assert.deepEqual(tokenizeClassName('05-A'), ['5', 'a']);
    assert.deepEqual(tokenizeClassName('5.A'), ['5', 'a']);
    assert.deepEqual(tokenizeClassName('E-02b'), ['e', '2', 'b']);
    assert.notDeepEqual(tokenizeClassName('5.1'), tokenizeClassName('51'));
});

test('class matching returns the configured canonical spelling', () => {
    const classes = ['05-A', '5.1', '51', 'E-2b'];
    assert.deepEqual(matchClassName('5a', classes), { status: 'token', value: '05-A', matches: ['05-A'] });
    assert.equal(matchClassName('05-a', classes).value, '05-A');
    assert.equal(matchClassName('E02B', classes).value, 'E-2b');
    assert.equal(matchClassName('5.1', classes).value, '5.1');
    assert.equal(matchClassName('51', classes).value, '51');
});

test('class matching refuses ambiguous token matches', () => {
    const result = matchClassName('05.a', ['5-A', '5A']);
    assert.equal(result.status, 'ambiguous');
    assert.deepEqual(result.matches, ['5-A', '5A']);
});

test('CSV parser supports semicolons, quotes, BOM and embedded delimiters', () => {
    const csv = '\uFEFFVorname;Nachname;Klasse\r\n"Anna;Maria";Schmidt;05-A\r\nMax;Müller;5A';
    assert.equal(detectCsvDelimiter(csv), ';');
    assert.deepEqual(parseCsv(csv), [
        ['Vorname', 'Nachname', 'Klasse'],
        ['Anna;Maria', 'Schmidt', '05-A'],
        ['Max', 'Müller', '5A'],
    ]);
});

test('column suggestions and mappings support variable source headings', () => {
    const headers = ['Familienname', 'Klassenbez.', 'Rufname', 'Sex', 'Notiz'];
    const mappings = suggestColumnMappings(headers, 'students');
    assert.deepEqual(mappings, ['nachname', 'klasse', 'vorname', 'geschlecht', '']);
    assert.deepEqual(mapImportedRows([['Schmidt', '05A', 'Anna', 'w', 'x']], mappings)[0], {
        _sourceIndex: 2,
        nachname: 'Schmidt',
        klasse: '05A',
        vorname: 'Anna',
        geschlecht: 'w',
    });
    assert.deepEqual(
        suggestColumnMappings(['ID (optional)', 'Vorname', 'Nachname', 'Geschlecht (optional)', 'Klasse'], 'students'),
        ['id', 'vorname', 'nachname', 'geschlecht', 'klasse']
    );
    assert.deepEqual(
        suggestColumnMappings(['Vorname', 'Nachname', 'Klasse (optional)', 'E-Mail'], 'teachers'),
        ['vorname', 'nachname', 'klasse', 'email']
    );
    assert.deepEqual(
        suggestColumnMappings(['Kürzel', 'Nachname', 'Vorname', 'E-Mail (Dienstlich)'], 'teachers'),
        ['', 'nachname', 'vorname', 'email']
    );
});

test('preview validation normalizes safe values and rejects unknown values', () => {
    const [valid, invalid] = validateMappedRows({
        importType: 'students',
        availableClasses: ['5-A'],
        existingStudentIds: [7],
        rows: [
            { id: '8', vorname: ' Anna ', nachname: 'Schmidt', klasse: '05.a', geschlecht: 'W' },
            { id: '7', vorname: 'Max', nachname: 'Müller', klasse: '5-X', geschlecht: '?' },
        ],
    });
    assert.equal(valid.klasse, '5-A');
    assert.equal(valid.geschlecht, 'weiblich');
    assert.deepEqual(valid._errors, []);
    assert.ok(valid._warnings.length >= 2);
    assert.ok(invalid._errors.some((error) => error.includes('existiert nicht')));
    assert.ok(invalid._errors.some((error) => error.includes('ungültig')));
    assert.ok(invalid._errors.some((error) => error.includes('bereits vergeben')));
});

test('gender aliases normalize without accepting arbitrary values', () => {
    assert.equal(normalizeImportedGender('female').value, 'weiblich');
    assert.equal(normalizeImportedGender('M').value, 'männlich');
    assert.equal(normalizeImportedGender('unknown').status, 'unknown');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { stationAllowsClass, validateStationRules } from '../src/utils/stationRules.js';

test('Stationsregeln erlauben Klassen oder Jahrgänge und eine leere Auswahl erlaubt alle', () => {
    const station = { mode: 'block', classes: ['5a'], grades: ['6'] };
    assert.equal(stationAllowsClass(station, '5a', '5'), true);
    assert.equal(stationAllowsClass(station, '6c', '6'), true);
    assert.equal(stationAllowsClass(station, '5b', '5'), false);
    assert.equal(stationAllowsClass({ ...station, mode: 'allow' }, '7a', '7'), true);
    assert.equal(stationAllowsClass({ mode: 'warn', classes: [], grades: [] }, '7a', '7'), true);
});

test('Stationsregeln weisen ungültige Modi und fehlerhafte Auswahlen zurück', () => {
    assert.equal(validateStationRules({ mode: 'warn', classes: ['5a'], grades: ['6'] }), true);
    for (const rules of [null, { mode: 'confirm', classes: [], grades: [] },
        { mode: 'block', classes: '5a', grades: [] }, { mode: 'warn', classes: [5], grades: [] },
        { mode: 'block', classes: [], grades: [''] }]) {
        assert.equal(validateStationRules(rules), false);
    }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { findStudentSuggestions, getStudentPaymentState, parseCurrencyInput, shiftCurrencyInput } from '../src/utils/donationWorkflow.js';

test('donation states distinguish all reconciliation cases', () => {
    assert.equal(getStudentPaymentState({ spenden: 0, spendenKonto: [] }).status, 'unset');
    assert.equal(getStudentPaymentState({ spenden: 20, spendenKonto: [] }).status, 'open');
    assert.equal(getStudentPaymentState({ spenden: 20, spendenKonto: [5] }).status, 'partial');
    assert.equal(getStudentPaymentState({ spenden: 20, spendenKonto: [5, 15] }).status, 'settled');
    assert.equal(getStudentPaymentState({ spenden: 20, spendenKonto: [25] }).status, 'overpaid');
    assert.equal(getStudentPaymentState({ spenden: 0, spendenKonto: [5] }).status, 'unexpected');
});

test('currency input supports German amounts and rounds to cents', () => {
    assert.equal(parseCurrencyInput('18,50 €'), 18.5);
    assert.equal(parseCurrencyInput('12.34'), 12.34);
});

test('banking-style currency input shifts digits from right to left', () => {
    let value = '0,00';
    value = shiftCurrencyInput(value, '1');
    assert.equal(value, '0,01');
    value = shiftCurrencyInput(value, '2');
    assert.equal(value, '0,12');
    value = shiftCurrencyInput(value, '3');
    assert.equal(value, '1,23');
    assert.equal(shiftCurrencyInput(value, 'Backspace'), '0,12');
    assert.equal(shiftCurrencyInput(value, '4', true), '0,04');
});

test('autocomplete matches names, reversed names, classes and IDs', () => {
    const students = [
        { id: 12, vorname: 'Max', nachname: 'Mustermann', klasse: '8b' },
        { id: 41, vorname: 'Marie', nachname: 'Muster', klasse: '7a' }
    ];
    assert.equal(findStudentSuggestions(students, 'max')[0].id, 12);
    assert.equal(findStudentSuggestions(students, 'mustermann max')[0].id, 12);
    assert.equal(findStudentSuggestions(students, '7a')[0].id, 41);
    assert.equal(findStudentSuggestions(students, '12')[0].id, 12);
});

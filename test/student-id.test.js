import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanScannedStudentId, normalizeReplacementId } from '../src/utils/studentId.js';

test('cleanScannedStudentId removes the configured event year', () => {
    assert.equal(cleanScannedStudentId('2026-E2', 2026), 'E2');
    assert.equal(cleanScannedStudentId('2026-123', 2026), '123');
});

test('normalizeReplacementId accepts event labels and plain replacement IDs', () => {
    assert.equal(normalizeReplacementId('2026-E2', 2026), '2');
    assert.equal(normalizeReplacementId('2026E2', 2026), '2');
    assert.equal(normalizeReplacementId('E2', 2026), '2');
    assert.equal(normalizeReplacementId('2', 2026), '2');
});

test('normalizeReplacementId rejects malformed and zero replacement IDs', () => {
    assert.equal(normalizeReplacementId('2026-E0', 2026), '');
    assert.equal(normalizeReplacementId('E-2', 2026), '');
    assert.equal(normalizeReplacementId('replacement', 2026), '');
});

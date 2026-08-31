import { createDatabaseBackup } from './backupService.js';
import { dbImmediateTransaction } from './database.js';

export const DELETE_CONFIRMATION_PHRASE = 'LÖSCHEN';

const SUPPORTED_TYPES = new Set([
    'students',
    'teachers',
    'rounds',
    'replacements',
    'expectedDonations',
    'receivedDonations',
]);

const runDelete = (db, query) => new Promise((resolve, reject) => {
    db.run(query, function onDelete(error) {
        if (error) reject(error);
        else resolve(this.changes);
    });
});

export class DataDeletionError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.name = 'DataDeletionError';
        this.status = status;
    }
}

export const deleteData = async ({ types, confirmation }) => {
    if (confirmation !== DELETE_CONFIRMATION_PHRASE) {
        throw new DataDeletionError(`Zur Bestätigung muss exakt „${DELETE_CONFIRMATION_PHRASE}“ eingegeben werden`);
    }

    const requestedTypes = [...new Set(Array.isArray(types) ? types : [types])].filter(Boolean);
    if (requestedTypes.length === 0 || requestedTypes.some((type) => !SUPPORTED_TYPES.has(type))) {
        throw new DataDeletionError('Mindestens ein gültiger Löschtyp ist erforderlich');
    }

    return dbImmediateTransaction(async (db) => {
        // BEGIN IMMEDIATE prevents a scanner write from slipping in between the
        // recovery snapshot and the destructive transaction.
        const backup = await createDatabaseBackup({
            reason: `before-delete-${requestedTypes.join('-')}`,
        });
        const deletedCounts = {};
        const deletingStudents = requestedTypes.includes('students');

        if (deletingStudents) {
            deletedCounts.rounds = await runDelete(db, 'DELETE FROM rounds');
            deletedCounts.replacements = await runDelete(db, 'DELETE FROM replacements');
            deletedCounts.expectedDonations = await runDelete(db, 'DELETE FROM expected_donations');
            deletedCounts.receivedDonations = await runDelete(db, 'DELETE FROM received_donations');
            deletedCounts.students = await runDelete(db, 'DELETE FROM students');
        } else {
            if (requestedTypes.includes('rounds')) {
                deletedCounts.rounds = await runDelete(db, 'DELETE FROM rounds');
            }
            if (requestedTypes.includes('replacements')) {
                deletedCounts.replacements = await runDelete(db, 'DELETE FROM replacements');
            }
            if (requestedTypes.includes('expectedDonations')) {
                deletedCounts.expectedDonations = await runDelete(db, 'DELETE FROM expected_donations');
            }
            if (requestedTypes.includes('receivedDonations')) {
                deletedCounts.receivedDonations = await runDelete(db, 'DELETE FROM received_donations');
            }
        }

        if (requestedTypes.includes('teachers')) {
            deletedCounts.teachers = await runDelete(db, 'DELETE FROM teachers');
        }

        return {
            deletedCounts,
            backupFilename: backup.filename,
        };
    });
};

import { createDatabaseBackup } from './backupService.js';
import { dbImmediateTransaction } from './database.js';

export const DELETE_CONFIRMATION_PHRASE = 'LÖSCHEN';
export const FULL_RESET_CONFIRMATION_PHRASE = 'ALLES LÖSCHEN';

const SUPPORTED_TYPES = new Set([
    'students',
    'teachers',
    'rounds',
    'replacements',
    'expectedDonations',
    'receivedDonations',
    'fullReset',
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
    const requestedTypes = [...new Set(Array.isArray(types) ? types : [types])].filter(Boolean);
    if (requestedTypes.length === 0 || requestedTypes.some((type) => !SUPPORTED_TYPES.has(type))) {
        throw new DataDeletionError('Mindestens ein gültiger Löschtyp ist erforderlich');
    }

    const isFullReset = requestedTypes.includes('fullReset');
    if (isFullReset && requestedTypes.length !== 1) {
        throw new DataDeletionError('Der komplette Reset kann nicht mit anderen Löschoptionen kombiniert werden');
    }

    const requiredConfirmation = isFullReset
        ? FULL_RESET_CONFIRMATION_PHRASE
        : DELETE_CONFIRMATION_PHRASE;
    if (confirmation !== requiredConfirmation) {
        throw new DataDeletionError(`Zur Bestätigung muss exakt „${requiredConfirmation}“ eingegeben werden`);
    }

    return dbImmediateTransaction(async (db) => {
        // BEGIN IMMEDIATE prevents a scanner write from slipping in between the
        // recovery snapshot and the destructive transaction.
        const backup = await createDatabaseBackup({
            reason: `before-delete-${requestedTypes.join('-')}`,
        });
        const deletedCounts = {};

        if (isFullReset) {
            deletedCounts.rounds = await runDelete(db, 'DELETE FROM rounds');
            deletedCounts.replacements = await runDelete(db, 'DELETE FROM replacements');
            deletedCounts.expectedDonations = await runDelete(db, 'DELETE FROM expected_donations');
            deletedCounts.receivedDonations = await runDelete(db, 'DELETE FROM received_donations');
            deletedCounts.students = await runDelete(db, 'DELETE FROM students');
            deletedCounts.teachers = await runDelete(db, 'DELETE FROM teachers');
            deletedCounts.classes = await runDelete(db, 'DELETE FROM classes');
            deletedCounts.settings = await runDelete(db, 'DELETE FROM settings');
            deletedCounts.smtpConfiguration = await runDelete(db, 'DELETE FROM smtp_configuration');
            deletedCounts.stationActivity = await runDelete(db, 'DELETE FROM station_activity');
            deletedCounts.loginAttempts = await runDelete(db, 'DELETE FROM admin_login_attempts');

            return {
                deletedCounts,
                backupFilename: backup.filename,
                fullReset: true,
            };
        }

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

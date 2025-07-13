import { dbGet, dbRun, dbAll } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError, handleSuccess, handleValidationError } from '../../utils/apiHelpers.js';

const getMaxReplacementID = async () => {
	const result = await dbGet('SELECT MAX(id) AS maxRID FROM replacements');
	return result?.maxRID || 0;
};

const checkReplacementExists = async (customId) => {
	const result = await dbGet('SELECT id FROM replacements WHERE id = ?', [customId]);
	return !!result;
};

const insertReplacement = async (replacementId, studentId) => {
	return await dbRun(
		'INSERT INTO replacements (id, studentID) VALUES (?, ?)',
		[replacementId, studentId]
	);
};

const deleteReplacement = async (replacementId) => {
	return await dbRun('DELETE FROM replacements WHERE id = ?', [replacementId]);
};

const getReplacementsByStudentId = async (studentId) => {
	const rows = await dbAll('SELECT id FROM replacements WHERE studentID = ?', [studentId]);
	return rows.map(row => row.id);
};

export default async function handler(req, res) {
	try {
		switch (req.method) {
			case 'POST':
				return await handleCreateReplacement(req, res);
			case 'DELETE':
				return await handleDeleteReplacement(req, res);
			case 'GET':
				return await handleGetReplacements(req, res);
			default:
				return handleMethodNotAllowed(res, ['POST', 'DELETE', 'GET']);
		}
	} catch (error) {
		return handleError(res, error, 500, 'Fehler bei der Ersatz-ID Verarbeitung');
	}
}

async function handleCreateReplacement(req, res) {
	const { amount, customId, studentId } = req.body;

	if (!studentId) {
		return handleValidationError(res, ['Student-ID ist erforderlich']);
	}

	if (customId) {
		// Spezifische Ersatz-ID verwenden
		const exists = await checkReplacementExists(customId);
		if (exists) {
			return handleError(res, new Error('Diese Ersatz-ID ist bereits vergeben'), 409);
		}

		await insertReplacement(customId, studentId);
		return handleSuccess(res, {
			count: 1,
			newReplacements: [customId]
		}, `Ersatz-ID "${customId}" erfolgreich erstellt`);
	} else {
		// Automatische Ersatz-IDs erstellen
		if (!amount || typeof amount !== 'number' || amount <= 0) {
			return handleValidationError(res, ['Ungültige Anzahl']);
		}

		const maxRID = await getMaxReplacementID();
		const newReplacements = [];

		for (let i = 0; i < amount; i++) {
			const newId = maxRID + i + 1;
			await insertReplacement(newId, studentId);
			newReplacements.push(newId.toString());
		}

		return handleSuccess(res, {
			count: amount,
			newReplacements
		}, `${amount} Ersatz-ID(s) erfolgreich erstellt`);
	}
}

async function handleDeleteReplacement(req, res) {
	const { replacementId } = req.body;

	if (!replacementId) {
		return handleValidationError(res, ['Ersatz-ID ist erforderlich']);
	}

	const exists = await checkReplacementExists(replacementId);
	if (!exists) {
		return handleError(res, new Error('Ersatz-ID nicht gefunden'), 404);
	}

	await deleteReplacement(replacementId);
	return handleSuccess(res, { deletedId: replacementId }, 'Ersatz-ID erfolgreich gelöscht');
}

async function handleGetReplacements(req, res) {
	const { studentId } = req.query;

	if (!studentId) {
		return handleValidationError(res, ['Student-ID ist erforderlich']);
	}

	const replacements = await getReplacementsByStudentId(studentId);
	return handleSuccess(res, { replacements }, 'Ersatz-IDs erfolgreich abgerufen');
}
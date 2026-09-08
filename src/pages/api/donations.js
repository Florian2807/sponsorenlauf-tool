import {
    getStudentForDonation,
    getStudentDonationDetails,
    setExpectedDonation,
    addReceivedDonation,
    deleteDonation
} from '../../utils/donationService.js';
import {
    handleMethodNotAllowed,
    handleError,
    handleSuccess,
    handleValidationError,
    validateRequiredFields
} from '../../utils/apiHelpers.js';
import { validateAmount, parseAmount } from '../../utils/validation.js';

export default async function handler(req, res) {
    try {
        switch (req.method) {
            case 'GET':
                return await handleGetDonationDetails(res, req.query);

            case 'POST':
                return await handleAddDonation(res, req.body);

            case 'DELETE':
                return await handleDeleteDonation(res, req.body);

            default:
                return handleMethodNotAllowed(res, ['GET', 'POST', 'DELETE']);
        }
    } catch (error) {
        return handleError(res, error, 500, 'Fehler bei der Spenden-Verarbeitung');
    }
}

async function handleGetDonationDetails(res, query) {
    const studentId = Number(Array.isArray(query.studentId) ? query.studentId[0] : query.studentId);
    if (!Number.isInteger(studentId) || studentId <= 0) {
        return handleValidationError(res, ['Ungültige Schüler-ID']);
    }

    const details = await getStudentDonationDetails(studentId);
    if (!details) return handleError(res, new Error('Schüler nicht gefunden'), 404);
    return handleSuccess(res, details);
}

async function handleAddDonation(res, body) {
    const { studentId, amount, isSpendenMode, mode } = body;

    const missing = validateRequiredFields({ body }, ['studentId', 'amount']);
    if (missing.length > 0) {
        return handleValidationError(res, missing.map(field => `${field} ist erforderlich`));
    }

    if (!validateAmount(amount)) {
        return handleValidationError(res, ['Ungültiger Spendenbetrag']);
    }

    const student = await getStudentForDonation(studentId);
    if (!student) {
        return handleError(res, new Error('Schüler nicht gefunden'), 404);
    }

    const formattedAmount = parseAmount(amount);
    const donationMode = mode || (isSpendenMode ? 'expected' : 'received');

    if (!['expected', 'received'].includes(donationMode)) {
        return handleValidationError(res, ['Ungültiger Spendenmodus']);
    }

    if (donationMode === 'expected') {
        await setExpectedDonation(studentId, formattedAmount);
    } else {
        await addReceivedDonation(studentId, formattedAmount);
    }

    return handleSuccess(res, null, 'Spende erfolgreich gespeichert', 201);
}

async function handleDeleteDonation(res, body) {
    const { donationId, type } = body;

    const missing = validateRequiredFields({ body }, ['donationId', 'type']);
    if (missing.length > 0) {
        return handleValidationError(res, missing.map(field => `${field} ist erforderlich`));
    }

    if (!['expected', 'received'].includes(type)) {
        return handleValidationError(res, ['Ungültiger Spenden-Typ']);
    }

    const result = await deleteDonation(donationId, type);
    if (result.changes === 0) {
        return handleError(res, new Error('Spende nicht gefunden'), 404);
    }

    return handleSuccess(res, null, 'Spende erfolgreich gelöscht');
}

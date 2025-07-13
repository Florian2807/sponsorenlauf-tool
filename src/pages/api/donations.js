import {
    getStudentForDonation,
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
            case 'POST':
                return await handleAddDonation(res, req.body);

            case 'DELETE':
                return await handleDeleteDonation(res, req.body);

            default:
                return handleMethodNotAllowed(res, ['POST', 'DELETE']);
        }
    } catch (error) {
        return handleError(res, error, 500, 'Fehler bei der Spenden-Verarbeitung');
    }
}

async function handleAddDonation(res, body) {
    const { studentId, amount, isSpendenMode } = body;

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

    if (isSpendenMode) {
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

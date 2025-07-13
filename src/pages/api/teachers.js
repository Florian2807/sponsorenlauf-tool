import { promises as fs } from 'fs';
import path from 'path';
import { handleMethodNotAllowed, handleError, handleSuccess } from '../../utils/apiHelpers.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return handleMethodNotAllowed(res, ['GET']);
    }

    try {
        const filePath = path.join(process.cwd(), 'data', 'teacherMails.json');
        const jsonData = await fs.readFile(filePath, 'utf-8');
        const teacherEmails = JSON.parse(jsonData);

        return handleSuccess(res, teacherEmails, 'Lehrer-E-Mails erfolgreich geladen');
    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Laden der E-Mail-Adressen');
    }
}
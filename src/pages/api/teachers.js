import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
    try {
        const filePath = path.join(process.cwd(), 'data', 'teacherMails.json');
        const jsonData = await fs.readFile(filePath, 'utf-8');
        const teacherEmails = JSON.parse(jsonData);
        res.status(200).json(teacherEmails);
    } catch (error) {
        console.error('Error reading the JSON file:', error);
        res.status(500).json({ message: 'Fehler beim Laden der E-Mail-Adressen' });
    }
}
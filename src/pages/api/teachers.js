import fs from 'fs';

export default function handler(req, res) {
    try {
        const jsonData = fs.readFileSync('data/teacherMails.json', 'utf-8');
        const teacherEmails = JSON.parse(jsonData);
        res.status(200).json(teacherEmails);
    } catch (error) {
        console.error('Error reading the JSON file:', error);
        res.status(500).json({ message: 'Fehler beim Laden der E-Mail-Adressen' });
    }
}

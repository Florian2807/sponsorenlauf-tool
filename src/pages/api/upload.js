import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

export const config = {
    api: {
        bodyParser: false, // Disable body parsing to handle file uploads
    },
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const form = new IncomingForm({ uploadDir: 'data/exportFiles', keepExtensions: true });

        await form.parse(req, (err, fields, files) => {
            if (err) {
                console.error('Upload Error:', err); // Log the error for debugging
                return res.status(500).json({ message: 'Fehler beim Hochladen der Datei' });
            }

            const uploadedFile = files.zipfile[0].filepath

            if (!uploadedFile) {
                console.error('No file uploaded:', files); // Log files object if no file is found
                return res.status(400).json({ message: 'Keine gültige Datei hochgeladen' });
            }
            const zip = new AdmZip(uploadedFile);
            const zipEntries = zip.getEntries();
            const teacherFiles = {};

            zipEntries.forEach((entry) => {
                if (entry.entryName.endsWith('.xlsx')) {
                    const className = path.basename(entry.entryName, '.xlsx'); // Extract class name
                    const filePath = path.join('./data/exportFiles', entry.entryName);
                    fs.writeFileSync(filePath, entry.getData()); // Save the file

                    // Add class name and file path to teacherFiles
                    teacherFiles[className] = filePath;
                }
            });

            res.status(200).json({ message: 'Dateien hochgeladen', teacherFiles });
        });
    } else {
        res.status(405).json({ message: 'Methode nicht erlaubt' });
    }
}

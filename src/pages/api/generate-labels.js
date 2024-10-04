// pages/api/generate-labels.js
import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/students.db');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      db.all('SELECT * FROM students', async (err, rows) => {
        if (err) {
          console.error('Fehler beim Abrufen der Daten:', err);
          return res.status(500).json({ message: 'Fehler beim Abrufen der Daten.' });
        }

        if (rows.length === 0) {
          console.error('Keine Daten in der Datenbank gefunden.');
          return res.status(400).send('Keine Daten in der Datenbank gefunden.');
        }

        const doc = new PDFDocument({ size: 'A4', margin: 30 });
        let pdfChunks = [];
        doc.on('data', chunk => pdfChunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(pdfChunks);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=labels.pdf');
          res.send(pdfBuffer);
        });

        const labelWidth = 250;
        const labelHeight = 120;
        const xOffset = 30;
        const yOffset = 20;

        let xPos = 30;
        let yPos = 30;
        let labelCount = 0;

        for (const row of rows) {
          const { id: ID, vorname: Vorname, nachname: Nachname, klasse: Klasse } = row;

          const barcodeBuffer = await bwipjs.toBuffer({
            bcid: 'code128',       
            text: `${new Date().getFullYear()}-${ID}`,
            scale: 2,
            height: 15,
            includetext: true,
            textxalign: 'center',
          });

          // Zeichne das Label-Rahmen
          // doc.rect(xPos, yPos, labelWidth, labelHeight).stroke();

          // Zentriere den Namen im Label
          doc.fontSize(14);
          const nameText = `${Nachname}, ${Vorname}`;
          const nameTextWidth = doc.widthOfString(nameText);
          doc.text(nameText, xPos + (labelWidth - nameTextWidth) / 2, yPos + 10);

          const klasseTextWidth = doc.widthOfString(Klasse);
          doc.text(Klasse, xPos + (labelWidth - klasseTextWidth) / 2, yPos + 30);

          const barcodeX = xPos + (labelWidth - 100) / 2;
          const barcodeY = yPos + 60;
          doc.image(barcodeBuffer, barcodeX, barcodeY, { width: 100 });

          if (labelCount % 2 === 0) {
            xPos += labelWidth + xOffset; 
          } else {
            xPos = 30;
            yPos += labelHeight + yOffset;
          }

          labelCount++;

          // Seitenumbruch nach 10 Labels (5 Zeilen x 2 Spalten)
          if (labelCount % 10 === 0) {
            doc.addPage();
            xPos = 30;
            yPos = 30;
          }
        }

        doc.end();
      });
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Datenbank:', error);
      return res.status(500).json({ message: 'Fehler beim Verarbeiten der Datenbank.' });
    }
  } else {
    res.status(405).send({ message: 'Nur POST-Anfragen erlaubt' });
  }
}

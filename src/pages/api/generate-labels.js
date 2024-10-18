import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/students.db');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (req.method === 'POST') {
    db.all('SELECT * FROM students', async (err, rows) => {
      if (err) {
        console.error('Fehler beim Abrufen der Daten:', err);
        return res.status(500).json({ message: 'Fehler beim Abrufen der Daten.' });
      }

      if (rows.length === 0) {
        console.error('Keine Daten in der Datenbank gefunden.');
        return res.status(400).send('Keine Daten in der Datenbank gefunden.');
      }

      try {
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

          // Wandle Barcode-Generierung in eine Funktion um, um mit await korrekt zu arbeiten
          const barcodeBuffer = await generateBarcode(ID);

          // Zeichne den Namen und die Klasse auf das PDF
          doc.fontSize(14);
          const nameText = `${Nachname}, ${Vorname}`;
          const nameTextWidth = doc.widthOfString(nameText);
          doc.text(nameText, xPos + (labelWidth - nameTextWidth) / 2, yPos + 10);

          const klasseTextWidth = doc.widthOfString(Klasse);
          doc.text(Klasse, xPos + (labelWidth - klasseTextWidth) / 2, yPos + 30);

          const barcodeX = xPos + (labelWidth - 100) / 2;
          const barcodeY = yPos + 60;
          doc.image(barcodeBuffer, barcodeX, barcodeY, { width: 100 });

          // Update der Position für das nächste Label
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
      } catch (error) {
        console.error('Fehler bei der PDF-Erstellung:', error);
        return res.status(500).json({ message: 'Fehler bei der PDF-Erstellung.' });
      }
    });
  } else {
    res.status(405).json({ message: 'Nur POST-Anfragen erlaubt' });
  }
}

// Hilfsfunktion zur Barcode-Erstellung
async function generateBarcode(ID) {
  return await bwipjs.toBuffer({
    bcid: 'code128',
    text: `${new Date().getFullYear()}-${ID}`,
    scale: 2,
    height: 15,
    includetext: true,
    textxalign: 'center',
  });
}

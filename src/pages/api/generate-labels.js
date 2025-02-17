import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/students.db');

const generateBarcode = async (ID) => {
  return await bwipjs.toBuffer({
    bcid: 'code128',
    text: `${new Date().getFullYear()}-${ID}`,
    scale: 2,
    height: 15,
    includetext: true,
    textxalign: 'center',
  });
};

export default function handler(req, res) {
  if (req.method === 'GET') {
    const replacementAmount = parseInt(req.query.replacementAmount, 10) || 0;
    const selectedClasses = req.query.selectedClasses ? req.query.selectedClasses.split(',') : [];
    let query = 'SELECT * FROM students';
    const params = [];
    console.log(selectedClasses)
    const placeholders = selectedClasses.map(() => '?');
    query += ` WHERE klasse IN (${placeholders})`;
    params.push(...selectedClasses);


    db.all(query, params, async (err, rows) => {
      if (err) {
        console.error('Fehler beim Abrufen der Daten:', err);
        return res.status(500).json({ message: 'Fehler beim Abrufen der Daten.' });
      }

      for (let i = 1; i <= replacementAmount; i++) {
        rows.push({
          id: `E${i}`,
          vorname: i.toString(),
          nachname: 'Ersatz',
          klasse: 'Ersatz',
        });
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

          // create Barcode
          const barcodeBuffer = await generateBarcode(ID);

          // add label to PDF
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
    res.status(405).json({ message: 'Nur GET-Anfragen erlaubt' });
  }
}
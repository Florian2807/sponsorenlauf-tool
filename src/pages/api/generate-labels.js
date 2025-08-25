import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import { dbAll } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError, parseQueryArray } from '../../utils/apiHelpers.js';

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

const getStudentsForLabels = async (selectedClasses) => {
  if (!selectedClasses || selectedClasses.length === 0) {
    return [];
  }

  const placeholders = selectedClasses.map(() => '?').join(',');
  const query = `SELECT * FROM students WHERE klasse IN (${placeholders})`;

  return await dbAll(query, selectedClasses);
};

const addReplacementLabels = (students, replacementAmount) => {
  const replacements = [];
  for (let i = 1; i <= replacementAmount; i++) {
    replacements.push({
      id: `E${i}`,
      vorname: i.toString(),
      nachname: 'Ersatz',
      klasse: 'Ersatz',
    });
  }
  return [...students, ...replacements];
};

const createLabelsPDF = async (students) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      const pdfChunks = [];

      doc.on('data', chunk => pdfChunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(pdfChunks)));
      doc.on('error', reject);

      const labelWidth = 250;
      const labelHeight = 120;
      const xOffset = 30;
      const yOffset = 20;

      let xPos = 30;
      let yPos = 30;
      let labelCount = 0;

      for (const student of students) {
        const { id: ID, vorname: Vorname, nachname: Nachname, klasse: Klasse } = student;

        // Create Barcode
        const barcodeBuffer = await generateBarcode(ID);

        // Add label to PDF
        doc.fontSize(14);
        const nameText = `${Nachname}, ${Vorname}`;
        const nameTextWidth = doc.widthOfString(nameText);
        doc.text(nameText, xPos + (labelWidth - nameTextWidth) / 2, yPos + 10);

        const klasseTextWidth = doc.widthOfString(Klasse);
        doc.text(Klasse, xPos + (labelWidth - klasseTextWidth) / 2, yPos + 30);

        const barcodeX = xPos + (labelWidth - 100) / 2;
        const barcodeY = yPos + 60;
        doc.image(barcodeBuffer, barcodeX, barcodeY, { width: 100 });

        // Position calculation for next label
        if (labelCount % 2 === 0) {
          xPos += labelWidth + xOffset;
        } else {
          xPos = 30;
          yPos += labelHeight + yOffset;
        }

        labelCount++;

        // New page every 10 labels
        if (labelCount % 10 === 0) {
          doc.addPage();
          xPos = 30;
          yPos = 30;
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return handleMethodNotAllowed(res, ['GET']);
  }

  try {
    const { replacementAmount = 0, selectedClasses } = req.query;
    const numReplacementAmount = parseInt(replacementAmount, 10) || 0;
    const classArray = parseQueryArray(selectedClasses);

    if (classArray.length === 0 && numReplacementAmount === 0) {
      return handleError(res, new Error('Keine Klassen ausgewählt'), 400);
    }

    let students = await getStudentsForLabels(classArray);

    if (numReplacementAmount > 0) {
      students = addReplacementLabels(students, numReplacementAmount);
    }

    if (students.length === 0) {
      return handleError(res, new Error('Keine Schüler für die Labels gefunden'), 400);
    }

    const pdfBuffer = await createLabelsPDF(students);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=labels.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    return handleError(res, error, 500, 'Fehler bei der PDF-Erstellung');
  }
}

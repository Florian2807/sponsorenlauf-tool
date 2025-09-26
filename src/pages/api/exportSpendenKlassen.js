import { dbAll } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError } from '../../utils/apiHelpers.js';
import { Workbook } from 'exceljs';

/**
 * Erstellt klassenweise Spendenauswertungen im Format des ursprünglichen Systems
 * Jede Klasse bekommt ein separates Arbeitsblatt mit Titel und spezieller Formatierung
 */

const getClassDataForSpendenExport = async () => {
  const query = `
    SELECT 
      s.klasse, 
      s.vorname, 
      s.nachname,
      COALESCE((SELECT COUNT(*) FROM rounds WHERE student_id = s.id), 0) as rounds,
      COALESCE((SELECT SUM(amount) FROM expected_donations WHERE student_id = s.id), 0) as expected_donations,
      COALESCE((SELECT SUM(amount) FROM received_donations WHERE student_id = s.id), 0) as received_donations,
      c.grade
    FROM students s
    LEFT JOIN classes c ON s.klasse = c.class_name
    ORDER BY c.grade, s.klasse, s.nachname
  `;

  const rows = await dbAll(query);

  // Nach Klassen gruppieren
  return rows.reduce((acc, row) => {
    if (!acc[row.klasse]) {
      acc[row.klasse] = [];
    }

    const differenz = row.received_donations - row.expected_donations;

    acc[row.klasse].push({
      vorname: row.vorname,
      nachname: row.nachname,
      rounds: row.rounds,
      expected_donations: row.expected_donations,
      received_donations: row.received_donations,
      differenz: differenz,
      grade: row.grade
    });
    return acc;
  }, {});
};

const sortClassesByGrade = (classData) => {
  const classOrder = ['5', '6', '7', '8', '9', '10', 'EF', 'Q1', 'Q2'];

  return Object.keys(classData).sort((a, b) => {
    const classA = a.match(/(\d+|EF|Q1|Q2)([a-f]?)/);
    const classB = b.match(/(\d+|EF|Q1|Q2)([a-f]?)/);

    if (!classA || !classB) {
      return a.localeCompare(b);
    }

    const gradeA = classOrder.indexOf(classA[1]);
    const gradeB = classOrder.indexOf(classB[1]);

    if (gradeA === gradeB) {
      return (classA[2] || '').localeCompare(classB[2] || '');
    } else {
      return gradeA - gradeB;
    }
  });
};

const createClassSpendenWorkbook = (classData) => {
  const workbook = new Workbook();
  const sortedClasses = sortClassesByGrade(classData);

  sortedClasses.forEach(klasse => {
    const students = classData[klasse];
    const worksheet = workbook.addWorksheet(klasse);

    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = `Sponsorenlauf ${new Date().getFullYear()}`;
    worksheet.getCell('A1').font = { size: 24, bold: true };
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 40;

    // Klassen-Zeile
    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `Klasse: ${klasse}`;
    worksheet.getCell('A2').font = { size: 18, bold: true };
    worksheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 30;

    // Header-Zeile (Zeile 3)
    const headerRow = worksheet.addRow(['Vorname', 'Nachname', 'Runden', 'erwartet', 'erhalten', 'Differenz', 'Notizen']);

    // Spalten-Definitionen
    worksheet.columns = [
      { key: 'vorname', width: 15 },
      { key: 'nachname', width: 15 },
      { key: 'rounds', width: 8 },
      { key: 'expected_donations', width: 8 },
      { key: 'received_donations', width: 8 },
      { key: 'differenz', width: 8 },
      { key: 'notizen', width: 20 }
    ];

    // Print-Bereich setzen
    worksheet.pageSetup.printArea = `A1:G${students.length + 3}`;

    // Schüler-Daten hinzufügen
    students.forEach(student => {
      const row = worksheet.addRow({
        vorname: student.vorname,
        nachname: student.nachname,
        rounds: student.rounds,
        expected_donations: student.expected_donations,
        received_donations: student.received_donations,
        differenz: student.differenz,
        notizen: ""
      });

      // Währungsformatierung für Geld-Spalten
      row.getCell(4).numFmt = '#,##0.00 "€"'; // erwartet
      row.getCell(5).numFmt = '#,##0.00 "€"'; // erhalten
      row.getCell(6).numFmt = '#,##0.00 "€"'; // Differenz

      // Farbkodierung für Differenz
      if (student.differenz < 0) {
        // Negativ = Rot
        row.getCell(6).font = { color: { argb: 'FFFF0000' } };
      } else if (student.expected_donations !== 0 && student.differenz === 0) {
        // Ausgeglichen = Grün
        row.getCell(6).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFA1BA66' }
        };
      }
    });

    // Rahmen für alle Zellen
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Header-Zeile (Zeile 3) mit stärkeren Rahmen
    worksheet.getRow(3).eachCell((cell) => {
      cell.font = { bold: true };
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'medium' },
        bottom: { style: 'medium' },
        right: { style: 'medium' }
      };
    });

    // Alle Zeilen auf einheitliche Höhe setzen
    worksheet.eachRow((row) => {
      if (row.number > 2) { // Titel-Zeilen haben bereits eigene Höhen
        row.height = 20;
      }
    });
  });

  return workbook;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return handleMethodNotAllowed(res, ['GET']);
  }

  try {
    const classData = await getClassDataForSpendenExport();
    const workbook = createClassSpendenWorkbook(classData);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=klassenauswertungen_spenden.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return handleError(res, error, 500, 'Fehler beim Erstellen der Klassenauswertung');
  }
}

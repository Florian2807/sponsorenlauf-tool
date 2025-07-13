import excel from 'exceljs';
import { dbAll } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError } from '../../utils/apiHelpers.js';

/**
 * Holt Schülerdaten mit Spenden-Informationen
 * @param {boolean} groupByClass Ob nach Klassen gruppiert werden soll
 * @returns {Promise<Object|Array>} Schülerdaten
 */
const getStudentsData = async (groupByClass = false) => {
  const rows = await dbAll(`
    SELECT 
      s.klasse, 
      s.vorname, 
      s.nachname,
      COUNT(r.id) as rounds,
      COALESCE(ed.total_expected, 0) as expected_amount,
      COALESCE(rd.total_received, 0) as received_amount
    FROM students s
    LEFT JOIN rounds r ON s.id = r.student_id
    LEFT JOIN (
      SELECT student_id, SUM(amount) as total_expected 
      FROM expected_donations 
      GROUP BY student_id
    ) ed ON s.id = ed.student_id
    LEFT JOIN (
      SELECT student_id, SUM(amount) as total_received 
      FROM received_donations 
      GROUP BY student_id
    ) rd ON s.id = rd.student_id
    GROUP BY s.id, s.klasse, s.vorname, s.nachname, ed.total_expected, rd.total_received
    ORDER BY s.klasse, s.nachname
  `);

  if (!groupByClass) {
    return rows;
  }

  return rows.reduce((acc, row) => {
    if (!acc[row.klasse]) {
      acc[row.klasse] = [];
    }
    acc[row.klasse].push({
      vorname: row.vorname,
      nachname: row.nachname,
      rounds: row.rounds,
      spenden: row.expected_amount,
      spendenKonto: row.received_amount,
      differenz: row.received_amount - row.expected_amount
    });
    return acc;
  }, {});
};

/**
 * Sortiert Schüler nach Klassenreihenfolge
 * @param {Array} students Schülerdaten
 * @param {Array} classOrder Gewünschte Klassenreihenfolge
 * @returns {Array} Sortierte Schülerdaten
 */
const sortStudentsByClass = (students, classOrder) => {
  return students.sort((a, b) => {
    const aIndex = classOrder.indexOf(a.klasse.replace(/[^0-9A-Za-z]/g, ''));
    const bIndex = classOrder.indexOf(b.klasse.replace(/[^0-9A-Za-z]/g, ''));

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    } else if (aIndex !== -1) {
      return -1;
    } else if (bIndex !== -1) {
      return 1;
    } else {
      return a.klasse.localeCompare(b.klasse);
    }
  });
};

/**
 * Erstellt ein Excel-Workbook für alle Schüler
 * @param {Array} students Schülerdaten
 * @returns {Object} Excel Workbook
 */
const createWorkbook = (students) => {
  const workbook = new excel.Workbook();
  const worksheet = workbook.addWorksheet('Alle Schüler');

  // Header
  worksheet.addRow(['Vorname', 'Nachname', 'Klasse', 'Runden', 'Erwartete Spenden (€)', 'Erhaltene Spenden (€)', 'Differenz (€)']);

  // Daten
  students.forEach(student => {
    const differenz = student.received_amount - student.expected_amount;
    worksheet.addRow([
      student.vorname,
      student.nachname,
      student.klasse,
      student.rounds,
      student.expected_amount,
      student.received_amount,
      differenz
    ]);
  });

  // Formatierung
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'CCCCCC' }
  };

  // Auto-Breite für Spalten
  worksheet.columns.forEach(column => {
    column.width = 15;
  });

  return workbook;
};

/**
 * Erstellt Excel-Workbooks für alle Klassen
 * @param {Object} classData Klassendaten
 * @param {Array} classOrder Klassenreihenfolge
 * @returns {Object} Excel Workbook
 */
const createClassWorkbooks = (classData, classOrder) => {
  const workbook = new excel.Workbook();

  // Sortiere Klassen nach gewünschter Reihenfolge
  const sortedClasses = Object.keys(classData).sort((a, b) => {
    const aIndex = classOrder.indexOf(a.replace(/[^0-9A-Za-z]/g, ''));
    const bIndex = classOrder.indexOf(b.replace(/[^0-9A-Za-z]/g, ''));

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    } else if (aIndex !== -1) {
      return -1;
    } else if (bIndex !== -1) {
      return 1;
    } else {
      return a.localeCompare(b);
    }
  });

  sortedClasses.forEach(className => {
    const students = classData[className];
    const worksheet = workbook.addWorksheet(className);

    // Header
    const headerRow = worksheet.addRow(['Vorname', 'Nachname', 'Runden', 'Erwartete Spenden (€)', 'Erhaltene Spenden (€)', 'Differenz (€)']);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'CCCCCC' }
    };

    // Daten
    students.forEach(student => {
      worksheet.addRow([
        student.vorname,
        student.nachname,
        student.rounds,
        student.spenden,
        student.spendenKonto,
        student.differenz
      ]);
    });

    // Summen-Zeile
    const totalRow = worksheet.addRow([
      'Gesamt',
      '',
      students.reduce((sum, student) => sum + student.rounds, 0),
      students.reduce((sum, student) => sum + student.spenden, 0),
      students.reduce((sum, student) => sum + student.spendenKonto, 0),
      students.reduce((sum, student) => sum + student.differenz, 0)
    ]);
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFCC' }
    };

    // Formatierung
    worksheet.columns.forEach(column => {
      column.width = 15;
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

    // Header-Rahmen verstärken
    worksheet.getRow(1).eachCell((cell) => {
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'medium' },
        bottom: { style: 'medium' },
        right: { style: 'medium' }
      };
    });

    // Zeilenhöhe
    worksheet.eachRow((row) => {
      row.height = 20;
    });
  });

  return workbook;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return handleMethodNotAllowed(res, ['GET']);
  }

  const requestedType = req.query.requestedType ?? 'xlsx';
  const classOrder = ['5', '6', '7', '8', '9', '10', 'EF', 'Q1', 'Q2'];

  try {
    if (requestedType === 'allstudents') {
      const studentData = await getStudentsData(false);
      const sortedStudents = sortStudentsByClass(studentData, classOrder);
      const workbook = createWorkbook(sortedStudents);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } else if (requestedType === 'classes') {
      const classData = await getStudentsData(true);
      const workbook = createClassWorkbooks(classData, classOrder);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=klassenauswertungen.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } else {
      return handleError(res, new Error('Ungültiger requestedType-Parameter'), 400);
    }
  } catch (error) {
    return handleError(res, error, 500, 'Fehler beim Generieren der Excel-Datei');
  }
}

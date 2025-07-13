import { dbAll } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError } from '../../utils/apiHelpers.js';
import { Workbook } from 'exceljs';
import JSZip from 'jszip';

const getClassDataForExport = async () => {
  const query = `
    SELECT 
      s.klasse, 
      s.vorname, 
      s.nachname,
      s.geschlecht,
      COUNT(r.id) as rounds
    FROM students s
    LEFT JOIN rounds r ON s.id = r.student_id
    GROUP BY s.id, s.klasse, s.vorname, s.nachname, s.geschlecht
    ORDER BY s.klasse, s.nachname
  `;

  const rows = await dbAll(query);
  
  return rows.reduce((acc, row) => {
    if (!acc[row.klasse]) {
      acc[row.klasse] = [];
    }
    acc[row.klasse].push({
      vorname: row.vorname,
      nachname: row.nachname,
      geschlecht: row.geschlecht || 'Nicht angegeben',
      klasse: row.klasse,
      rounds: row.rounds,
    });
    return acc;
  }, {});
};

const createExcelForClass = async (className, students) => {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Schüler');

  worksheet.columns = [
    { header: 'Vorname', key: 'vorname', width: 20 },
    { header: 'Nachname', key: 'nachname', width: 20 },
    { header: 'Geschlecht', key: 'geschlecht', width: 15 },
    { header: 'Klasse', key: 'klasse', width: 15 },
    { header: 'Runden', key: 'rounds', width: 10 },
  ];

  students.forEach((student) => {
    worksheet.addRow({
      vorname: student.vorname,
      nachname: student.nachname,
      geschlecht: student.geschlecht,
      klasse: student.klasse,
      rounds: student.rounds,
    });
  });

  return await workbook.xlsx.writeBuffer();
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return handleMethodNotAllowed(res, ['GET']);
  }

  try {
    const zip = new JSZip();
    const classData = await getClassDataForExport();

    const excelPromises = Object.entries(classData).map(async ([klasse, students]) => {
      const buffer = await createExcelForClass(klasse, students);
      zip.file(`${klasse}.xlsx`, buffer);
    });

    await Promise.all(excelPromises);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=class_statistics.zip');
    res.send(zipBuffer);
  } catch (error) {
    return handleError(res, error, 500, 'Fehler beim Erstellen der Excel-Dateien');
  }
}

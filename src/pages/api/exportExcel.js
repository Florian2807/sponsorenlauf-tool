import JSZip from 'jszip';
import { Workbook } from 'exceljs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function getClassData() {
  const db = await open({
    filename: './data/students.db',
    driver: sqlite3.Database,
  });

  const classData = await db.all(`
    SELECT klasse, vorname, nachname, timestamps
    FROM students
    ORDER BY klasse, nachname
  `);

  const groupedByClass = classData.reduce((acc, row) => {
    const timestampsArray = row.timestamps ? JSON.parse(row.timestamps) : [];

    if (!acc[row.klasse]) {
      acc[row.klasse] = [];
    }
    acc[row.klasse].push({
      vorname: row.vorname,
      nachname: row.nachname,
      rounds: timestampsArray.length,
    });

    return acc;
  }, {});

  await db.close();
  return groupedByClass;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const zip = new JSZip();

      const classData = await getClassData();

      for (const [klasse, students] of Object.entries(classData)) {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Schüler');

        worksheet.columns = [
          { header: 'Vorname', key: 'vorname', width: 20 },
          { header: 'Nachname', key: 'nachname', width: 20 },
          { header: 'Runden', key: 'rounds', width: 10 },
        ];

        students.forEach((student) => {
          worksheet.addRow({
            vorname: student.vorname,
            nachname: student.nachname,
            rounds: student.rounds,
          });
        });

        // add the worksheet to the workbook
        const buffer = await workbook.xlsx.writeBuffer();
        zip.file(`${klasse}.xlsx`, buffer);
      }

      // create ZIP file
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=class_statistics.zip`);
      res.send(zipBuffer);
    } catch (error) {
      console.error('Error generating Excel files:', error);
      res.status(500).json({ message: 'Fehler beim Erstellen der Excel-Dateien.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

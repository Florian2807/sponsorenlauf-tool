import JSZip from 'jszip';
import { Workbook } from 'exceljs';
import sqlite3 from 'sqlite3';

const getClassData = () => {
  const db = new sqlite3.Database('./data/database.db');

  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        s.klasse, 
        s.vorname, 
        s.nachname,
        COUNT(r.id) as rounds
      FROM students s
      LEFT JOIN rounds r ON s.id = r.student_id
      GROUP BY s.id, s.klasse, s.vorname, s.nachname
      ORDER BY s.klasse, s.nachname
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const groupedByClass = rows.reduce((acc, row) => {
          if (!acc[row.klasse]) {
            acc[row.klasse] = [];
          }
          acc[row.klasse].push({
            vorname: row.vorname,
            nachname: row.nachname,
            rounds: row.rounds,
          });

          return acc;
        }, {});

        resolve(groupedByClass);
      }
    });
  }).finally(() => {
    db.close();
  });
};

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

        const buffer = await workbook.xlsx.writeBuffer();
        zip.file(`${klasse}.xlsx`, buffer);
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=class_statistics.zip');
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
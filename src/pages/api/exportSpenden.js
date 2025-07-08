import excel from 'exceljs';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/database.db');

const getClassData = () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        s.klasse, 
        s.vorname, 
        s.nachname, 
        s.spenden, 
        s.spendenKonto,
        COUNT(r.id) as rounds
      FROM students s
      LEFT JOIN rounds r ON s.id = r.student_id
      GROUP BY s.id, s.klasse, s.vorname, s.nachname, s.spenden, s.spendenKonto
      ORDER BY s.klasse, s.nachname
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const groupedByClass = rows.reduce((acc, row) => {
          const spendenKontoArray = row.spendenKonto ? JSON.parse(row.spendenKonto) : [];

          if (!acc[row.klasse]) {
            acc[row.klasse] = [];
          }
          acc[row.klasse].push({
            vorname: row.vorname,
            nachname: row.nachname,
            rounds: row.rounds,
            spenden: row.spenden !== null ? row.spenden : 0.00,
            spendenKonto: spendenKontoArray.reduce((a, b) => a + b, 0),
            differenz: spendenKontoArray.reduce((a, b) => a + b, 0) - (row.spenden !== null ? row.spenden : 0.00)
          });

          return acc;
        }, {});

        resolve(groupedByClass);
      }
    });
  });
};

const getAllStudentsData = () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        s.id, 
        s.klasse, 
        s.vorname, 
        s.nachname, 
        s.spenden, 
        s.spendenKonto,
        COUNT(r.id) as rounds
      FROM students s
      LEFT JOIN rounds r ON s.id = r.student_id
      GROUP BY s.id, s.klasse, s.vorname, s.nachname, s.spenden, s.spendenKonto
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Füge timestamps Array hinzu für Kompatibilität
        const studentsWithTimestamps = rows.map(row => ({
          ...row,
          timestamps: { length: row.rounds } // Mock für bestehende Code-Kompatibilität
        }));
        resolve(studentsWithTimestamps);
      }
    });
  });
};

const sortStudentsByClass = (students, classOrder) => {
  return students.sort((a, b) => {
    const classA = a.klasse.match(/(\d+|EF|Q1|Q2)([a-f]?)/);
    const classB = b.klasse.match(/(\d+|EF|Q1|Q2)([a-f]?)/);

    if (!classA || !classB) {
      return 0;
    }

    const gradeA = classOrder.indexOf(classA[1]);
    const gradeB = classOrder.indexOf(classB[1]);

    if (gradeA === gradeB) {
      if (classA[2] === classB[2]) {
        return a.nachname.localeCompare(b.nachname);
      }
      return (classA[2] || '').localeCompare(classB[2] || '');
    } else {
      return gradeA - gradeB;
    }
  });
};

const createWorkbook = (students) => {
  const workbook = new excel.Workbook();
  const worksheet = workbook.addWorksheet('Schüler');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 5 },
    { header: 'Klasse', key: 'klasse', width: 10 },
    { header: 'Vorname', key: 'vorname', width: 20 },
    { header: 'Nachname', key: 'nachname', width: 20 },
    { header: 'Runden', key: 'runden', width: 10 },
    { header: 'erwartete Spenden', key: 'spenden', width: 20, style: { numFmt: '_-* #,##0.00 €_-;_-* -#,##0.00 €_-;_-* "-"?? €_-;_-@_-' } },
    { header: 'erhaltene Spenden', key: 'spendenKonto', width: 20, style: { numFmt: '_-* #,##0.00 €_-;_-* -#,##0.00 €_-;_-* "-"?? €_-;_-@_-' } },
    { header: 'Differenz', key: 'differenz', width: 20, style: { numFmt: '_-* #,##0.00 €_-;_-* -#,##0.00 €_-;_-* "-"?? €_-;_-@_-' } }
  ];

  students.forEach(student => {
    const spendenKontoArray = student.spendenKonto ? JSON.parse(student.spendenKonto) : [];
    const differenz = spendenKontoArray.reduce((a, b) => a + b, 0) - (student.spenden !== null ? student.spenden : 0.00);

    const row = worksheet.addRow({
      id: student.id,
      klasse: student.klasse,
      vorname: student.vorname,
      nachname: student.nachname,
      runden: student.rounds || 0,
      spenden: student.spenden !== null ? student.spenden : 0.00,
      spendenKonto: spendenKontoArray.reduce((a, b) => a + b, 0),
      differenz: differenz
    });

    if (differenz < 0) {
      row.getCell('differenz').font = { color: { argb: 'FFFF0000' } }; // Rot
    }

    if (student.spenden !== 0 && differenz === 0) {
      row.getCell('differenz').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'A1BA66' }
      };
    }
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.numFmt = null;
  });

  return workbook;
};

const createClassWorkbooks = (classData, classOrder) => {
  const workbook = new excel.Workbook();

  const sortedClassData = Object.keys(classData).sort((a, b) => {
    const classA = a.match(/(\d+|EF|Q1|Q2)([a-f]?)/);
    const classB = b.match(/(\d+|EF|Q1|Q2)([a-f]?)/);

    if (!classA || !classB) {
      return 0;
    }

    const gradeA = classOrder.indexOf(classA[1]);
    const gradeB = classOrder.indexOf(classB[1]);

    if (gradeA === gradeB) {
      return (classA[2] || '').localeCompare(classB[2] || '');
    } else {
      return gradeA - gradeB;
    }
  });

  sortedClassData.forEach(klasse => {
    const students = classData[klasse];
    const worksheet = workbook.addWorksheet(klasse);

    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'Sponsorenlauf 2024';
    worksheet.getCell('A1').font = { size: 24, bold: true };
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `Klasse: ${klasse}`;
    worksheet.getCell('A2').font = { size: 18, bold: true };
    worksheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.addRow(["Vorname", "Nachname", "Runden", "erwartet", "erhalten", "Differenz", "Notizen"]);
    worksheet.columns = [
      { key: 'vorname', width: 15 },
      { key: 'nachname', width: 15 },
      { key: 'rounds', width: 10 },
      { key: 'spenden', width: 10, style: { numFmt: '_-* #,##0.00 €_-;_-* -#,##0.00 €_-;_-* "-"?? €_-;_-@_-' } },
      { key: 'spendenKonto', width: 10, style: { numFmt: '_-* #,##0.00 €_-;_-* -#,##0.00 €_-;_-* "-"?? €_-;_-@_-' } },
      { key: 'differenz', width: 10, style: { numFmt: '_-* #,##0.00 €_-;_-* -#,##0.00 €_-;_-* "-"?? €_-;_-@_-' } },
      { key: 'notizen', width: 20 }
    ];

    worksheet.pageSetup.printArea = `A1:G${students.length + 1}`;

    students.forEach(student => {
      worksheet.addRow({
        vorname: student.vorname,
        nachname: student.nachname,
        rounds: student.rounds,
        spenden: student.spenden,
        spendenKonto: student.spendenKonto,
        differenz: student.differenz,
        notizen: ""
      });
    });

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

    worksheet.getRow(3).eachCell((cell) => {
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'medium' },
        bottom: { style: 'medium' },
        right: { style: 'medium' }
      };
    });

    worksheet.eachRow((row) => {
      row.height = 20;
    });
  });

  return workbook;
};

export default async function handler(req, res) {
  const requestedType = req.query.requestedType ?? 'xlsx';
  const classOrder = ['5', '6', '7', '8', '9', '10', 'EF', 'Q1', 'Q2'];

  try {
    if (requestedType === 'allstudents') {
      const studentData = await getAllStudentsData();
      const sortedStudents = sortStudentsByClass(studentData, classOrder);
      const workbook = createWorkbook(sortedStudents);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } else if (requestedType === 'classes') {
      const classData = await getClassData();
      const workbook = createClassWorkbooks(classData, classOrder);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=klassenauswertungen.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(400).json({ error: 'Ungültiger requestedType-Parameter.' });
    }
  } catch (error) {
    console.error('Fehler beim Generieren der Excel-Datei:', error);
    res.status(500).json({ error: 'Fehler beim Generieren der Excel-Datei.' });
  }
}
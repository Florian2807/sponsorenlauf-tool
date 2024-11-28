const excel = require('exceljs');
const sqlite3 = require('sqlite3').verbose();

export default async function handler(req, res) {
    try {
        const db = new sqlite3.Database('./data/students.db');

        const studentData = await new Promise((resolve, reject) => {
            db.all('SELECT id, klasse, vorname, nachname, spenden, spendenKonto, timestamps FROM students', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        // Sortiere die Daten nach Klassen und Unterklassen
        const classOrder = ['5', '6', '7', '8', '9', '10', 'EF', 'Q1', 'Q2'];
        studentData.sort((a, b) => {
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

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Students');

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

        studentData.forEach(student => {
            const runden = student.timestamps ? JSON.parse(student.timestamps).length : 0;
            const spenden = student.spenden !== null ? student.spenden : 0.00;
            const spendenKonto = student.spendenKonto !== null ? student.spendenKonto : 0.00;
            const differenz = spendenKonto - spenden;
            const row = worksheet.addRow({
                ...student,
                spenden,
                spendenKonto,
                runden,
                differenz
            });

            // Bedingte Formatierung anwenden
            if (differenz < 0) {
                row.getCell('differenz').font = { color: { argb: 'FFFF0000' } }; // Rot
            }

            if (spenden !== 0 && differenz === 0) {
                // color cell green
                row.getCell('differenz').fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'A1BA66' } // Grün
                }
            };
        })

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Fehler beim Generieren der Excel-Datei:', error);
        res.status(500).send('Fehler beim Generieren der Excel-Datei');
    }
}
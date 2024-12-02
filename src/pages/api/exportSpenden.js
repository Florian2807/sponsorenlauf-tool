const excel = require('exceljs');
const sqlite3 = require('sqlite3').verbose();
const JSZip = require('jszip');
const { open } = require('sqlite');

async function getClassData() {
    const db = await open({
        filename: './data/students.db',
        driver: sqlite3.Database,
    });

    const classData = await db.all(`
      SELECT klasse, vorname, nachname, spenden, spendenKonto, timestamps
      FROM students
      ORDER BY klasse, nachname
    `);

    const groupedByClass = classData.reduce((acc, row) => {
        const timestampsArray = row.timestamps ? JSON.parse(row.timestamps) : [];
        const spendenKontoArray = row.spendenKonto ? JSON.parse(row.spendenKonto) : [];

        if (!acc[row.klasse]) {
            acc[row.klasse] = [];
        }
        acc[row.klasse].push({
            vorname: row.vorname,
            nachname: row.nachname,
            rounds: timestampsArray.length,
            spenden: row.spenden !== null ? row.spenden : 0.00,
            spendenKonto: spendenKontoArray.reduce((a, b) => a + b, 0),
            differenz: spendenKontoArray.reduce((a, b) => a + b, 0) - (row.spenden !== null ? row.spenden : 0.00)
        });

        return acc;
    }, {});

    await db.close();
    return groupedByClass;
}

export default async function handler(req, res) {
    const requestedType = req.query.requestedType ?? 'xlsx';
    if (requestedType === 'xlsx') {
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
                const spendenKonto = student.spendenKonto !== null ? JSON.parse(student.spendenKonto).reduce((a, b) => a + b, 0) : 0.00;
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
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error('Fehler beim Generieren der Excel-Datei:', error);
            res.status(500).send('Fehler beim Generieren der Excel-Datei');
        }
    } else if (requestedType === 'zip') {
        try {
            const zip = new JSZip();

            const classData = await getClassData();

            for (const [klasse, students] of Object.entries(classData)) {
                const workbook = new excel.Workbook();
                const worksheet = workbook.addWorksheet('Schüler');

                worksheet.columns = [
                    { header: 'Vorname', key: 'vorname', width: 20 },
                    { header: 'Nachname', key: 'nachname', width: 20 },
                    { header: 'Runden', key: 'rounds', width: 10 },
                    { header: 'erwartete Spenden', key: 'spenden', width: 20, style: { numFmt: '_-* #,##0.00 €_-;_-* -#,##0.00 €_-;_-* "-"?? €_-;_-@_-' } },
                    { header: 'erhaltene Spenden', key: 'spendenKonto', width: 20, style: { numFmt: '_-* #,##0.00 €_-;_-* -#,##0.00 €_-;_-* "-"?? €_-;_-@_-' } },
                    { header: 'Differenz', key: 'differenz', width: 20, style: { numFmt: '_-* #,##0.00 €_-;_-* -#,##0.00 €_-;_-* "-"?? €_-;_-@_-' } }
                ];

                students.forEach(student => {
                    const row = worksheet.addRow({
                        vorname: student.vorname,
                        nachname: student.nachname,
                        rounds: student.rounds,
                        spenden: student.spenden,
                        spendenKonto: student.spendenKonto,
                        differenz: student.differenz
                    });

                    // Bedingte Formatierung anwenden
                    if (student.differenz < 0) {
                        row.getCell('differenz').font = { color: { argb: 'FFFF0000' } }; // Rot
                    }

                    if (student.spenden !== 0 && student.differenz === 0) {
                        // color cell green
                        row.getCell('differenz').fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'A1BA66' } // Grün
                        }
                    };
                });

                // create ZIP file
                const buffer = await workbook.xlsx.writeBuffer();
                zip.file(`${klasse}.xlsx`, buffer);
            }

            const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=class_statistics.zip`);
            res.send(zipBuffer);
        } catch (error) {
            console.error('Error generating Excel files:', error);
            res.status(500).json({ message: 'Fehler beim Erstellen der Excel-Dateien.' });
        }
    }
}
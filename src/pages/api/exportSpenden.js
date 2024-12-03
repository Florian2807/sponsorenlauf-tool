const excel = require('exceljs');
const sqlite3 = require('sqlite3').verbose();

async function getClassData() {
    const db = new sqlite3.Database('./data/students.db');

    const classData = await new Promise((resolve, reject) => {
        db.all(`
          SELECT klasse, vorname, nachname, spenden, spendenKonto, timestamps
          FROM students
          ORDER BY klasse, nachname
        `, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });

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

    db.close();
    return groupedByClass;
}

export default async function handler(req, res) {
    const requestedType = req.query.requestedType ?? 'xlsx';
    const classOrder = ['5', '6', '7', '8', '9', '10', 'EF', 'Q1', 'Q2'];

    switch (requestedType) {
        case 'allstudents': {
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

                studentData.forEach(student => {
                    const timestampsArray = student.timestamps ? JSON.parse(student.timestamps) : [];
                    const spendenKontoArray = student.spendenKonto ? JSON.parse(student.spendenKonto) : [];
                    const differenz = spendenKontoArray.reduce((a, b) => a + b, 0) - (student.spenden !== null ? student.spenden : 0.00);

                    const row = worksheet.addRow({
                        id: student.id,
                        klasse: student.klasse,
                        vorname: student.vorname,
                        nachname: student.nachname,
                        runden: timestampsArray.length,
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

                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');

                await workbook.xlsx.write(res);
                res.end();
            } catch (error) {
                console.error('Fehler beim Generieren der Excel-Datei:', error);
                res.status(500).json({ error: 'Fehler beim Generieren der Excel-Datei.' });
            }
        }
        case 'classes': {
            try {
                const workbook = new excel.Workbook();
                const classData = await getClassData();

                // Sortiere die Klassen nach der festgelegten Reihenfolge
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

                for (const klasse of sortedClassData) {
                    const students = classData[klasse];
                    const worksheet = workbook.addWorksheet(klasse);

                    // Überschrift
                    worksheet.mergeCells('A1:G1');
                    worksheet.getCell('A1').value = 'Sponsorenlauf 2024';
                    worksheet.getCell('A1').font = { size: 24, bold: true };
                    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

                    // Unterüberschrift
                    worksheet.mergeCells('A2:G2');
                    worksheet.getCell('A2').value = `Klasse: ${klasse}`;
                    worksheet.getCell('A2').font = { size: 18, bold: true };
                    worksheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };

                    // Tabellenkopf in der dritten Zeile

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


                    // Setze den Druckbereich
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

                    // Setze die Linien der Spalten für den Druck
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

                    // dritte zeile fett
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
                }

                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=klassenauswertungen.xlsx');

                await workbook.xlsx.write(res);
                res.end();
            } catch (error) {
                console.error('Fehler beim Generieren der Excel-Datei:', error);
                res.status(500).json({ error: 'Fehler beim Generieren der Excel-Datei.' });
            }
        }
        default: {
            res.status(400).json({ error: 'Ungültiger requestedType-Parameter.' });
        }
    }
}
import { dbAll } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError } from '../../utils/apiHelpers.js';
import { Workbook } from 'exceljs';
import JSZip from 'jszip';
import { getSetting } from '../../utils/settingsService.js';

const getDonationDisplayMode = async () => {
  return await getSetting('donation_display_mode', 'expected');
};

const getClassDataForExport = async () => {
  const donationMode = await getDonationDisplayMode();
  const donationColumn = donationMode === 'expected' ? 'ed.amount' : 'rd.amount';
  const donationJoin = donationMode === 'expected'
    ? 'LEFT JOIN expected_donations ed ON s.id = ed.student_id'
    : 'LEFT JOIN received_donations rd ON s.id = rd.student_id';

  const query = `
    SELECT 
      s.klasse, 
      s.vorname, 
      s.nachname,
      s.geschlecht,
      COUNT(r.id) as rounds,
      COALESCE(SUM(${donationColumn}), 0) as total_donations,
      c.grade
    FROM students s
    LEFT JOIN rounds r ON s.id = r.student_id
    ${donationJoin}
    LEFT JOIN classes c ON s.klasse = c.class_name
    GROUP BY s.id, s.klasse, s.vorname, s.nachname, s.geschlecht, c.grade
    ORDER BY c.grade, s.klasse, s.nachname
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
      spenden: row.total_donations,
      grade: row.grade
    });
    return acc;
  }, {});
};

const getStatisticsData = async () => {
  const donationMode = getDonationDisplayMode();
  const donationColumn = donationMode === 'expected' ? 'ed.amount' : 'rd.amount';
  const donationJoin = donationMode === 'expected'
    ? 'LEFT JOIN expected_donations ed ON s.id = ed.student_id'
    : 'LEFT JOIN received_donations rd ON s.id = rd.student_id';

  const queries = {
    classStats: `
      SELECT 
        s.klasse,
        COUNT(DISTINCT s.id) as student_count,
        COUNT(r.id) as total_rounds,
        ROUND(COUNT(r.id) * 1.0 / COUNT(DISTINCT s.id), 2) as average_rounds,
        COALESCE(SUM(${donationColumn}), 0) as total_donations,
        ROUND(COALESCE(SUM(${donationColumn}), 0) * 1.0 / COUNT(DISTINCT s.id), 2) as average_donations
      FROM students s
      LEFT JOIN rounds r ON s.id = r.student_id
      ${donationJoin}
      GROUP BY s.klasse
      ORDER BY s.klasse
    `,
    topStudentsRounds: `
      SELECT 
        s.vorname,
        s.nachname,
        s.klasse,
        s.geschlecht,
        COUNT(r.id) as rounds
      FROM students s
      LEFT JOIN rounds r ON s.id = r.student_id
      GROUP BY s.id, s.vorname, s.nachname, s.klasse, s.geschlecht
      ORDER BY rounds DESC
      LIMIT 50
    `,
    topStudentsDonations: `
      SELECT 
        s.vorname,
        s.nachname,
        s.klasse,
        s.geschlecht,
        COALESCE(SUM(${donationColumn}), 0) as total_donations
      FROM students s
      ${donationJoin}
      GROUP BY s.id, s.vorname, s.nachname, s.klasse, s.geschlecht
      ORDER BY total_donations DESC
      LIMIT 50
    `
  };

  const results = {};
  for (const [key, query] of Object.entries(queries)) {
    results[key] = await dbAll(query);
  }

  return results;
};

const createExcelForClass = async (className, students) => {
  const donationMode = getDonationDisplayMode();
  const spendenHeader = donationMode === 'expected' ? 'Erwartete Spenden' : 'Erhaltene Spenden';

  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Schüler');

  worksheet.columns = [
    { header: 'Vorname', key: 'vorname', width: 20 },
    { header: 'Nachname', key: 'nachname', width: 20 },
    { header: 'Geschlecht', key: 'geschlecht', width: 15 },
    { header: 'Klasse', key: 'klasse', width: 15 },
    { header: 'Runden', key: 'rounds', width: 10 },
    { header: spendenHeader, key: 'spenden', width: 15 },
  ];

  students.forEach((student) => {
    worksheet.addRow({
      vorname: student.vorname,
      nachname: student.nachname,
      geschlecht: student.geschlecht,
      klasse: student.klasse,
      rounds: student.rounds,
      spenden: student.spenden,
    });
  });

  return await workbook.xlsx.writeBuffer();
};

const createCompleteExcelReport = async () => {
  const donationMode = getDonationDisplayMode();
  const spendenHeader = donationMode === 'expected' ? 'Erwartete Spenden' : 'Erhaltene Spenden';

  const workbook = new Workbook();
  const classData = await getClassDataForExport();
  const statsData = await getStatisticsData();

  // Haupttabelle: Alle Schüler (als erstes Arbeitsblatt)
  const allStudentsSheet = workbook.addWorksheet('Alle Schüler');
  allStudentsSheet.columns = [
    { header: 'Klasse', key: 'klasse', width: 12 },
    { header: 'Vorname', key: 'vorname', width: 18 },
    { header: 'Nachname', key: 'nachname', width: 18 },
    { header: 'Geschlecht', key: 'geschlecht', width: 12 },
    { header: 'Runden', key: 'rounds', width: 8 },
    { header: spendenHeader, key: 'spenden', width: 15 },
  ];

  // Header-Zeile formatieren
  const headerRow = allStudentsSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '366092' } // Dunkelblau
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 25;

  // Alle Schüler aus allen Klassen sammeln und nach Jahrgängen sortieren
  const allStudents = [];
  Object.entries(classData).forEach(([className, students]) => {
    students.forEach(student => {
      allStudents.push(student);
    });
  });

  // Nach Jahrgang (grade), dann nach Klasse, dann nach Nachname sortieren
  allStudents.sort((a, b) => {
    // Erst nach Jahrgang sortieren
    if (a.grade !== b.grade) {
      // Numerische Sortierung für Jahrgänge (falls sie Zahlen sind)
      const gradeA = parseInt(a.grade) || a.grade;
      const gradeB = parseInt(b.grade) || b.grade;
      if (typeof gradeA === 'number' && typeof gradeB === 'number') {
        return gradeA - gradeB;
      }
      return String(gradeA).localeCompare(String(gradeB));
    }
    // Dann nach Klasse sortieren
    if (a.klasse !== b.klasse) {
      return a.klasse.localeCompare(b.klasse);
    }
    // Schließlich nach Nachname sortieren
    return a.nachname.localeCompare(b.nachname);
  });

  // Excel-Tabelle als formatierte Tabelle erstellen
  allStudents.forEach((student, index) => {
    const row = allStudentsSheet.addRow({
      klasse: student.klasse,
      vorname: student.vorname,
      nachname: student.nachname,
      geschlecht: student.geschlecht,
      rounds: student.rounds,
      spenden: student.spenden,
    });

    // Zebrastreifen-Design (abwechselnde Farben)
    if ((index + 1) % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F2F2F2' } // Hellgrau für gerade Zeilen
      };
    }

    // Zellformatierung
    row.alignment = { vertical: 'middle' };
    row.height = 20;

    // Zahlenformatierung für Spenden (Euro)
    const spendenCell = row.getCell(6); // Spenden-Spalte (F)
    spendenCell.numFmt = '#,##0.00 "€"';
  });

  // Excel-Tabelle formatieren (AutoFilter aktivieren)
  if (allStudents.length > 0) {
    allStudentsSheet.autoFilter = {
      from: 'A1',
      to: `F${allStudents.length + 1}`
    };

    // Rahmen um die gesamte Tabelle
    const tableRange = `A1:F${allStudents.length + 1}`;
    allStudentsSheet.getCell(tableRange).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Rahmen für alle Zellen setzen
    for (let row = 1; row <= allStudents.length + 1; row++) {
      for (let col = 1; col <= 6; col++) {
        const cell = allStudentsSheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'CCCCCC' } },
          left: { style: 'thin', color: { argb: 'CCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
          right: { style: 'thin', color: { argb: 'CCCCCC' } }
        };
      }
    }
  }

  // Klassenstatistiken Arbeitsblatt
  const classStatsSheet = workbook.addWorksheet('Klassenstatistiken');
  classStatsSheet.columns = [
    { header: 'Klasse', key: 'klasse', width: 15 },
    { header: 'Anzahl Schüler', key: 'student_count', width: 15 },
    { header: 'Gesamt Runden', key: 'total_rounds', width: 15 },
    { header: 'Ø Runden', key: 'average_rounds', width: 15 },
    { header: `Gesamt ${spendenHeader}`, key: 'total_donations', width: 18 },
    { header: `Ø ${spendenHeader}`, key: 'average_donations', width: 18 },
  ];

  statsData.classStats.forEach(stat => {
    classStatsSheet.addRow(stat);
  });

  // Top Schüler nach Runden
  const topRoundsSheet = workbook.addWorksheet('Top Schüler Runden');
  topRoundsSheet.columns = [
    { header: 'Vorname', key: 'vorname', width: 20 },
    { header: 'Nachname', key: 'nachname', width: 20 },
    { header: 'Klasse', key: 'klasse', width: 15 },
    { header: 'Geschlecht', key: 'geschlecht', width: 15 },
    { header: 'Runden', key: 'rounds', width: 10 },
  ];

  statsData.topStudentsRounds.forEach(student => {
    topRoundsSheet.addRow(student);
  });

  // Top Schüler nach Spenden
  const topDonationsSheet = workbook.addWorksheet(`Top Schüler ${spendenHeader}`);
  topDonationsSheet.columns = [
    { header: 'Vorname', key: 'vorname', width: 20 },
    { header: 'Nachname', key: 'nachname', width: 20 },
    { header: 'Klasse', key: 'klasse', width: 15 },
    { header: 'Geschlecht', key: 'geschlecht', width: 15 },
    { header: spendenHeader, key: 'total_donations', width: 18 },
  ];

  statsData.topStudentsDonations.forEach(student => {
    topDonationsSheet.addRow(student);
  });

  return await workbook.xlsx.writeBuffer();
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return handleMethodNotAllowed(res, ['GET']);
  }

  try {
    const { type = 'class-wise' } = req.query;

    if (type === 'complete') {
      // Gesamtauswertung - Eine einzige Excel-Datei
      const buffer = await createCompleteExcelReport();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=sponsorenlauf_gesamtauswertung.xlsx');
      res.send(buffer);
    } else {
      // Klassenweise Auswertung - ZIP mit separaten Excel-Dateien
      const zip = new JSZip();
      const classData = await getClassDataForExport();

      const excelPromises = Object.entries(classData).map(async ([klasse, students]) => {
        const buffer = await createExcelForClass(klasse, students);
        zip.file(`${klasse}.xlsx`, buffer);
      });

      await Promise.all(excelPromises);

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=sponsorenlauf_klassenweise.zip');
      res.send(zipBuffer);
    }
  } catch (error) {
    return handleError(res, error, 500, 'Fehler beim Erstellen der Excel-Dateien');
  }
}

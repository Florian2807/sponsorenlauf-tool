import { dbAll } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError } from '../../utils/apiHelpers.js';
import { Workbook } from 'exceljs';
import JSZip from 'jszip';
import { getSetting } from '../../utils/settingsService.js';

const getDonationDisplayMode = async () => {
  return await getSetting('donation_display_mode', 'expected');
};

const getClassDataForExport = async () => {
  const query = `
    SELECT 
      s.klasse, 
      s.vorname, 
      s.nachname,
      s.geschlecht,
      COALESCE((SELECT COUNT(*) FROM rounds WHERE student_id = s.id), 0) as rounds,
      COALESCE((SELECT SUM(amount) FROM expected_donations WHERE student_id = s.id), 0) as expected_donations,
      COALESCE((SELECT SUM(amount) FROM received_donations WHERE student_id = s.id), 0) as received_donations,
      c.grade
    FROM students s
    LEFT JOIN classes c ON s.klasse = c.class_name
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
      expected_donations: row.expected_donations,
      received_donations: row.received_donations,
      grade: row.grade
    });
    return acc;
  }, {});
};

const getStatisticsData = async () => {
  const queries = {
    classStats: `
      SELECT 
        s.klasse,
        c.grade,
        COUNT(DISTINCT s.id) as student_count,
        COALESCE(SUM((SELECT COUNT(*) FROM rounds WHERE student_id = s.id)), 0) as total_rounds,
        ROUND(COALESCE(SUM((SELECT COUNT(*) FROM rounds WHERE student_id = s.id)), 0) * 1.0 / COUNT(DISTINCT s.id), 2) as average_rounds,
        COALESCE(SUM((SELECT SUM(amount) FROM expected_donations WHERE student_id = s.id)), 0) as total_expected_donations,
        COALESCE(SUM((SELECT SUM(amount) FROM received_donations WHERE student_id = s.id)), 0) as total_received_donations,
        ROUND(COALESCE(SUM((SELECT SUM(amount) FROM expected_donations WHERE student_id = s.id)), 0) * 1.0 / COUNT(DISTINCT s.id), 2) as average_expected_donations,
        ROUND(COALESCE(SUM((SELECT SUM(amount) FROM received_donations WHERE student_id = s.id)), 0) * 1.0 / COUNT(DISTINCT s.id), 2) as average_received_donations
      FROM students s
      LEFT JOIN classes c ON s.klasse = c.class_name
      GROUP BY s.klasse, c.grade
      ORDER BY c.grade, s.klasse
    `,
    topStudentsRounds: `
      SELECT 
        s.vorname,
        s.nachname,
        s.klasse,
        s.geschlecht,
        COALESCE((SELECT COUNT(*) FROM rounds WHERE student_id = s.id), 0) as rounds
      FROM students s
      ORDER BY rounds DESC
      LIMIT 50
    `,
    topStudentsExpectedDonations: `
      SELECT 
        s.vorname,
        s.nachname,
        s.klasse,
        s.geschlecht,
        COALESCE((SELECT SUM(amount) FROM expected_donations WHERE student_id = s.id), 0) as total_expected_donations
      FROM students s
      ORDER BY total_expected_donations DESC
      LIMIT 50
    `,
    topStudentsReceivedDonations: `
      SELECT 
        s.vorname,
        s.nachname,
        s.klasse,
        s.geschlecht,
        COALESCE((SELECT SUM(amount) FROM received_donations WHERE student_id = s.id), 0) as total_received_donations
      FROM students s
      ORDER BY total_received_donations DESC
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
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(`Klasse ${className}`);

  // Spalten mit beiden Spendenarten
  worksheet.columns = [
    { header: 'Vorname', key: 'vorname', width: 18 },
    { header: 'Nachname', key: 'nachname', width: 18 },
    { header: 'Geschlecht', key: 'geschlecht', width: 12 },
    { header: 'Runden', key: 'rounds', width: 10 },
    { header: 'Erwartete Spenden', key: 'expected_donations', width: 18 },
    { header: 'Erhaltene Spenden', key: 'received_donations', width: 18 },
  ];

  // Header-Formatierung
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '366092' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 30;

  // Schüler-Daten hinzufügen
  students.forEach((student, index) => {
    const row = worksheet.addRow({
      vorname: student.vorname,
      nachname: student.nachname,
      geschlecht: student.geschlecht,
      rounds: student.rounds,
      expected_donations: student.expected_donations,
      received_donations: student.received_donations,
    });

    // Zebrastreifen-Design
    if ((index + 1) % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F8F9FA' }
      };
    }

    row.alignment = { vertical: 'middle' };
    row.height = 25;

    // Währungsformatierung für Spenden
    row.getCell(5).numFmt = '#,##0.00 "€"'; // Erwartete Spenden
    row.getCell(6).numFmt = '#,##0.00 "€"'; // Erhaltene Spenden
  });

  // Rahmen für alle Zellen
  for (let row = 1; row <= students.length + 1; row++) {
    for (let col = 1; col <= 6; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'CCCCCC' } },
        left: { style: 'thin', color: { argb: 'CCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
        right: { style: 'thin', color: { argb: 'CCCCCC' } }
      };
    }
  }

  // AutoFilter aktivieren
  if (students.length > 0) {
    worksheet.autoFilter = {
      from: 'A1',
      to: `F${students.length + 1}`
    };
  }

  // Zusammenfassung hinzufügen
  const summaryRow = students.length + 3;
  worksheet.getCell(`A${summaryRow}`).value = 'Zusammenfassung:';
  worksheet.getCell(`A${summaryRow}`).font = { bold: true, size: 14 };

  worksheet.getCell(`A${summaryRow + 1}`).value = 'Schüler gesamt:';
  worksheet.getCell(`B${summaryRow + 1}`).value = students.length;

  worksheet.getCell(`A${summaryRow + 2}`).value = 'Runden gesamt:';
  worksheet.getCell(`B${summaryRow + 2}`).value = students.reduce((sum, s) => sum + s.rounds, 0);

  worksheet.getCell(`A${summaryRow + 3}`).value = 'Erwartete Spenden gesamt:';
  worksheet.getCell(`B${summaryRow + 3}`).value = students.reduce((sum, s) => sum + s.expected_donations, 0);
  worksheet.getCell(`B${summaryRow + 3}`).numFmt = '#,##0.00 "€"';

  worksheet.getCell(`A${summaryRow + 4}`).value = 'Erhaltene Spenden gesamt:';
  worksheet.getCell(`B${summaryRow + 4}`).value = students.reduce((sum, s) => sum + s.received_donations, 0);
  worksheet.getCell(`B${summaryRow + 4}`).numFmt = '#,##0.00 "€"';

  return await workbook.xlsx.writeBuffer();
};

const createCompleteExcelReport = async () => {
  const workbook = new Workbook();
  const classData = await getClassDataForExport();
  const statsData = await getStatisticsData();

  // 1. Alle Schüler Arbeitsblatt
  const allStudentsSheet = workbook.addWorksheet('📊 Alle Schüler');
  allStudentsSheet.columns = [
    { header: 'Klasse', key: 'klasse', width: 12 },
    { header: 'Vorname', key: 'vorname', width: 16 },
    { header: 'Nachname', key: 'nachname', width: 16 },
    { header: 'Geschlecht', key: 'geschlecht', width: 12 },
    { header: 'Runden', key: 'rounds', width: 10 },
    { header: 'Erwartete Spenden', key: 'expected_donations', width: 18 },
    { header: 'Erhaltene Spenden', key: 'received_donations', width: 18 },
  ];

  // Header-Formatierung
  const headerRow = allStudentsSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2E7D32' } // Dunkelgrün
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 35;

  // Alle Schüler sammeln und sortieren
  const allStudents = [];
  Object.entries(classData).forEach(([className, students]) => {
    students.forEach(student => {
      allStudents.push(student);
    });
  });

  // Sortierung nach Jahrgang, Klasse, Nachname
  allStudents.sort((a, b) => {
    if (a.grade !== b.grade) {
      const gradeA = parseInt(a.grade) || a.grade;
      const gradeB = parseInt(b.grade) || b.grade;
      if (typeof gradeA === 'number' && typeof gradeB === 'number') {
        return gradeA - gradeB;
      }
      return String(gradeA).localeCompare(String(gradeB));
    }
    if (a.klasse !== b.klasse) {
      return a.klasse.localeCompare(b.klasse);
    }
    return a.nachname.localeCompare(b.nachname);
  });

  // Schüler-Daten einfügen
  allStudents.forEach((student, index) => {
    const row = allStudentsSheet.addRow({
      klasse: student.klasse,
      vorname: student.vorname,
      nachname: student.nachname,
      geschlecht: student.geschlecht,
      rounds: student.rounds,
      expected_donations: student.expected_donations,
      received_donations: student.received_donations,
    });

    // Zebrastreifen-Design
    if ((index + 1) % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F1F8E9' } // Sehr helles Grün
      };
    }

    row.alignment = { vertical: 'middle' };
    row.height = 22;

    // Formatierung für Spenden-Spalten
    row.getCell(6).numFmt = '#,##0.00 "€"'; // Erwartete Spenden
    row.getCell(7).numFmt = '#,##0.00 "€"'; // Erhaltene Spenden
  });

  // Rahmen und AutoFilter
  if (allStudents.length > 0) {
    allStudentsSheet.autoFilter = {
      from: 'A1',
      to: `G${allStudents.length + 1}`
    };

    for (let row = 1; row <= allStudents.length + 1; row++) {
      for (let col = 1; col <= 7; col++) {
        const cell = allStudentsSheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'E0E0E0' } },
          left: { style: 'thin', color: { argb: 'E0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
          right: { style: 'thin', color: { argb: 'E0E0E0' } }
        };
      }
    }
  }

  // 2. Klassenstatistiken Arbeitsblatt
  const classStatsSheet = workbook.addWorksheet('📈 Klassenstatistiken');
  classStatsSheet.columns = [
    { header: 'Jahrgang', key: 'grade', width: 12 },
    { header: 'Klasse', key: 'klasse', width: 12 },
    { header: 'Schüler', key: 'student_count', width: 12 },
    { header: 'Runden', key: 'total_rounds', width: 12 },
    { header: 'Ø Runden', key: 'average_rounds', width: 12 },
    { header: 'Erwartete Spenden', key: 'total_expected_donations', width: 18 },
    { header: 'Erhaltene Spenden', key: 'total_received_donations', width: 18 },
    { header: 'Ø Erwartete Spenden', key: 'average_expected_donations', width: 18 },
    { header: 'Ø Erhaltene Spenden', key: 'average_received_donations', width: 18 },
  ];

  // Header-Formatierung für Klassenstatistiken
  const classStatsHeaderRow = classStatsSheet.getRow(1);
  classStatsHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  classStatsHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1976D2' } // Blau
  };
  classStatsHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
  classStatsHeaderRow.height = 35;

  statsData.classStats.forEach((stat, index) => {
    const row = classStatsSheet.addRow(stat);

    if ((index + 1) % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E3F2FD' } // Helles Blau
      };
    }

    row.height = 22;
    // Währungsformatierung
    row.getCell(6).numFmt = '#,##0.00 "€"';
    row.getCell(7).numFmt = '#,##0.00 "€"';
    row.getCell(8).numFmt = '#,##0.00 "€"';
    row.getCell(9).numFmt = '#,##0.00 "€"';
  });

  // 3. Top Schüler nach Runden
  const topRoundsSheet = workbook.addWorksheet('🏃 Top Runden');
  topRoundsSheet.columns = [
    { header: 'Platz', key: 'rank', width: 8 },
    { header: 'Vorname', key: 'vorname', width: 16 },
    { header: 'Nachname', key: 'nachname', width: 16 },
    { header: 'Klasse', key: 'klasse', width: 12 },
    { header: 'Geschlecht', key: 'geschlecht', width: 12 },
    { header: 'Runden', key: 'rounds', width: 10 },
  ];

  // Header-Formatierung für Top Runden
  const topRoundsHeaderRow = topRoundsSheet.getRow(1);
  topRoundsHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  topRoundsHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF9800' } // Orange
  };
  topRoundsHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
  topRoundsHeaderRow.height = 30;

  statsData.topStudentsRounds.forEach((student, index) => {
    const row = topRoundsSheet.addRow({
      rank: index + 1,
      ...student
    });

    // Goldene, silberne, bronzene Medaillen-Farben
    if (index === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } }; // Gold
    } else if (index === 1) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }; // Silber
    } else if (index === 2) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CD7F32' } }; // Bronze
    } else if ((index + 1) % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E0' } }; // Helles Orange
    }

    row.height = 22;
  });

  // 4. Top Schüler nach erwarteten Spenden
  const topExpectedSheet = workbook.addWorksheet('💰 Top Erwartete Spenden');
  topExpectedSheet.columns = [
    { header: 'Platz', key: 'rank', width: 8 },
    { header: 'Vorname', key: 'vorname', width: 16 },
    { header: 'Nachname', key: 'nachname', width: 16 },
    { header: 'Klasse', key: 'klasse', width: 12 },
    { header: 'Geschlecht', key: 'geschlecht', width: 12 },
    { header: 'Erwartete Spenden', key: 'total_expected_donations', width: 18 },
  ];

  const topExpectedHeaderRow = topExpectedSheet.getRow(1);
  topExpectedHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  topExpectedHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4CAF50' } // Grün
  };
  topExpectedHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
  topExpectedHeaderRow.height = 30;

  statsData.topStudentsExpectedDonations.forEach((student, index) => {
    const row = topExpectedSheet.addRow({
      rank: index + 1,
      ...student
    });

    if (index < 3) {
      const colors = ['FFD700', 'C0C0C0', 'CD7F32'];
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors[index] } };
    } else if ((index + 1) % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E8' } };
    }

    row.height = 22;
    row.getCell(6).numFmt = '#,##0.00 "€"';
  });

  // 5. Top Schüler nach erhaltenen Spenden
  const topReceivedSheet = workbook.addWorksheet('💸 Top Erhaltene Spenden');
  topReceivedSheet.columns = [
    { header: 'Platz', key: 'rank', width: 8 },
    { header: 'Vorname', key: 'vorname', width: 16 },
    { header: 'Nachname', key: 'nachname', width: 16 },
    { header: 'Klasse', key: 'klasse', width: 12 },
    { header: 'Geschlecht', key: 'geschlecht', width: 12 },
    { header: 'Erhaltene Spenden', key: 'total_received_donations', width: 18 },
  ];

  const topReceivedHeaderRow = topReceivedSheet.getRow(1);
  topReceivedHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  topReceivedHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '9C27B0' } // Violett
  };
  topReceivedHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
  topReceivedHeaderRow.height = 30;

  statsData.topStudentsReceivedDonations.forEach((student, index) => {
    const row = topReceivedSheet.addRow({
      rank: index + 1,
      ...student
    });

    if (index < 3) {
      const colors = ['FFD700', 'C0C0C0', 'CD7F32'];
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors[index] } };
    } else if ((index + 1) % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3E5F5' } };
    }

    row.height = 22;
    row.getCell(6).numFmt = '#,##0.00 "€"';
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

import { dbAll } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError, handleSuccess } from '../../utils/apiHelpers.js';
import config from '../../../data/config.json';

const loadStudentsForStatistics = async () => {
  const query = `
    SELECT 
      s.*,
      COUNT(r.id) as rounds,
      COALESCE(ed.total_expected, 0) as expected_donations,
      COALESCE(rd.total_received, 0) as received_donations
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
    GROUP BY s.id
  `;

  const rows = await dbAll(query);
  if (rows.length === 0) return [];

  const studentIds = rows.map(row => row.id);
  const placeholders = studentIds.map(() => '?').join(',');

  const roundsData = await dbAll(`
    SELECT student_id, timestamp 
    FROM rounds 
    WHERE student_id IN (${placeholders})
    ORDER BY student_id, timestamp DESC
  `, studentIds);

  const roundsMap = roundsData.reduce((acc, { student_id, timestamp }) => {
    if (!acc[student_id]) acc[student_id] = [];
    acc[student_id].push(timestamp);
    return acc;
  }, {});

  return rows.map(row => ({
    ...row,
    timestamps: roundsMap[row.id] || [],
    rounds: (roundsMap[row.id] || []).length,
    spenden: row.expected_donations // Kompatibilität
  }));
};

const calculateStatistics = (students) => {
  const classStats = {};
  let totalRounds = 0;
  let totalActiveStudents = 0;
  let totalStudents = students.length;
  let totalDonations = 0;

  students.forEach(student => {
    if (!classStats[student.klasse]) {
      classStats[student.klasse] = {
        totalRounds: 0,
        studentCount: 0,
        totalMoney: 0,
        activeStudents: 0
      };
    }

    classStats[student.klasse].studentCount += 1;

    if (student.timestamps.length > 0) {
      classStats[student.klasse].totalRounds += student.timestamps.length;
      classStats[student.klasse].activeStudents += 1;
      totalRounds += student.timestamps.length;
      totalActiveStudents += 1;
    }

    const studentDonations = (student.expected_donations || 0) + (student.received_donations || 0);
    classStats[student.klasse].totalMoney += studentDonations;
    totalDonations += studentDonations;
  });

  const grades = config.availableClasses;
  const topClassesOfGrades = Object.entries(grades).reduce((acc, [grade, classes]) => {
    acc[grade] = classes
      .map(klasse => ({
        klasse,
        totalRounds: classStats[klasse]?.totalRounds || 0,
        averageRounds: classStats[klasse]?.activeStudents
          ? classStats[klasse].totalRounds / classStats[klasse].activeStudents
          : 0,
        totalMoney: classStats[klasse]?.totalMoney || 0,
        averageMoney: classStats[klasse]?.studentCount
          ? classStats[klasse].totalMoney / classStats[klasse].studentCount
          : 0,
        activeStudents: classStats[klasse]?.activeStudents || 0,
        totalStudents: classStats[klasse]?.studentCount || 0
      }))
      .sort((a, b) => b.totalRounds - a.totalRounds);
    return acc;
  }, {});

  const sortedClassStats = Object.entries(classStats)
    .map(([klasse, stats]) => ({
      klasse,
      totalRounds: stats.totalRounds,
      averageRounds: stats.activeStudents ? stats.totalRounds / stats.activeStudents : 0,
      totalMoney: stats.totalMoney,
      averageMoney: stats.studentCount ? stats.totalMoney / stats.studentCount : 0,
      activeStudents: stats.activeStudents,
      totalStudents: stats.studentCount,
      participationRate: stats.studentCount ? (stats.activeStudents / stats.studentCount) * 100 : 0
    }))
    .sort((a, b) => b.totalRounds - a.totalRounds);

  const topStudentsByRounds = students
    .filter(student => student.rounds > 0)
    .sort((a, b) => b.rounds - a.rounds)
    .slice(0, 50);

  const topStudentsByMoney = students
    .filter(student => (student.expected_donations + student.received_donations) > 0)
    .map(student => ({
      ...student,
      spenden: student.expected_donations + student.received_donations
    }))
    .sort((a, b) => b.spenden - a.spenden)
    .slice(0, 50);

  const averageRounds = totalActiveStudents > 0 ? totalRounds / totalActiveStudents : 0;

  // Geschlechterverteilung
  const genderStats = students.reduce((acc, student) => {
    const gender = student.geschlecht || 'unbekannt';
    if (!acc[gender]) {
      acc[gender] = { count: 0, totalRounds: 0 };
    }
    acc[gender].count += 1;
    acc[gender].totalRounds += student.rounds;
    return acc;
  }, {});

  // Aktivitätsverteilung
  const activityDistribution = {
    active: totalActiveStudents,
    inactive: totalStudents - totalActiveStudents,
    highPerformers: students.filter(s => s.rounds >= 10).length,
    mediumPerformers: students.filter(s => s.rounds >= 5 && s.rounds < 10).length,
    lowPerformers: students.filter(s => s.rounds > 0 && s.rounds < 5).length
  };

  return {
    classStats: sortedClassStats,
    topStudentsByRounds,
    topStudentsByMoney,
    topClassesOfGrades,
    averageRounds,
    totalRounds,
    totalStudents,
    activeStudents: totalActiveStudents,
    totalDonations,
    genderStats,
    activityDistribution,
    rawStudents: students // Für benutzerdefinierte Statistiken
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return handleMethodNotAllowed(res, ['GET']);
  }

  try {
    const students = await loadStudentsForStatistics();
    const statistics = calculateStatistics(students);
    return handleSuccess(res, statistics, 'Statistiken erfolgreich berechnet');
  } catch (error) {
    return handleError(res, error, 500, 'Fehler beim Berechnen der Statistiken');
  }
}

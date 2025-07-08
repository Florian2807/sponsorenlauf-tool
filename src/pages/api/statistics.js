import sqlite3 from 'sqlite3';
import config from '../../../data/config.json';

const db = new sqlite3.Database('./data/database.db');

const loadStudentsFromDB = () => {
  return new Promise((resolve, reject) => {
    // Lade Studenten und ihre Daten aus den separaten Tabellen
    db.all(`
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
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Lade alle Timestamps für jeden Studenten
        const studentIds = rows.map(row => row.id);

        if (studentIds.length === 0) {
          resolve([]);
          return;
        }

        db.all(`
          SELECT student_id, timestamp 
          FROM rounds 
          WHERE student_id IN (${studentIds.map(() => '?').join(',')})
          ORDER BY student_id, timestamp DESC
        `, studentIds, (err, roundsData) => {
          if (err) {
            reject(err);
          } else {
            const roundsMap = roundsData.reduce((acc, { student_id, timestamp }) => {
              if (!acc[student_id]) {
                acc[student_id] = [];
              }
              acc[student_id].push(timestamp);
              return acc;
            }, {});

            const students = rows.map(row => ({
              ...row,
              timestamps: roundsMap[row.id] || [],
              rounds: (roundsMap[row.id] || []).length,
              spenden: row.expected_donations // Kompatibilität
            }));

            resolve(students);
          }
        });
      }
    });
  });
};

const calculateStatistics = (students) => {
  const classStats = {};
  let totalRounds = 0;
  let totalActiveStudents = 0;

  students.forEach(student => {
    if (!classStats[student.klasse]) {
      classStats[student.klasse] = { totalRounds: 0, studentCount: 0, totalMoney: 0 };
    }

    if (student.timestamps.length > 0) {
      classStats[student.klasse].totalRounds += student.timestamps.length;
      classStats[student.klasse].studentCount += 1;
      totalRounds += student.timestamps.length;
      totalActiveStudents += 1;
    }
    classStats[student.klasse].totalMoney += student.spenden;
  });

  const grades = config.availableClasses;
  const topClassesOfGrades = Object.entries(grades).reduce((acc, [grade, classes]) => {
    acc[grade] = classes
      .map(klasse => ({
        klasse,
        totalRounds: classStats[klasse]?.totalRounds || 0,
        averageRounds: classStats[klasse]?.totalRounds / classStats[klasse]?.studentCount || 0,
        totalMoney: classStats[klasse]?.totalMoney || 0,
        averageMoney: classStats[klasse]?.totalMoney / classStats[klasse]?.studentCount || 0
      }))
      .sort((a, b) => b.totalRounds - a.totalRounds);
    return acc;
  }, {});

  const sortedClassStats = Object.entries(classStats)
    .map(([klasse, stats]) => ({
      klasse,
      totalRounds: stats.totalRounds,
      averageRounds: stats.totalRounds / stats.studentCount,
      totalMoney: stats.totalMoney,
      averageMoney: stats.totalMoney / stats.studentCount
    }))
    .sort((a, b) => b.totalRounds - a.totalRounds);

  const topStudentsByRounds = students
    .filter(student => student.rounds > 0)
    .sort((a, b) => b.rounds - a.rounds)
    .slice(0, 50);

  const topStudentsByMoney = students
    .filter(student => student.spenden > 0)
    .sort((a, b) => b.spenden - a.spenden)
    .slice(0, 50);

  const averageRounds = totalActiveStudents > 0 ? totalRounds / totalActiveStudents : 0;

  return {
    classStats: sortedClassStats,
    topStudentsByRounds,
    topStudentsByMoney,
    topClassesOfGrades,
    averageRounds,
    totalRounds
  };
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const students = await loadStudentsFromDB();
      const statistics = calculateStatistics(students);
      return res.status(200).json(statistics);
    } catch (error) {
      return res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
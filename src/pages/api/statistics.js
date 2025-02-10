import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/students.db');

const loadStudentsFromDB = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM students', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const students = rows.map(row => ({
          ...row,
          timestamps: row.timestamps ? JSON.parse(row.timestamps) : [],
          rounds: row.timestamps ? JSON.parse(row.timestamps).length : 0
        }));
        resolve(students);
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

  const grades = { 5: ['5a', '5b', '5c', '5d', '5e', '5f'], 6: ['6a', '6b', '6c', '6d', '6e', '6f'], 7: ['7a', '7b', '7c', '7d', '7e', '7f'], 8: ['8a', '8b', '8c', '8d', '8e', '8f'], 9: ['9a', '9b', '9c', '9d', '9e', '9f'], 10: ['10a', '10b', '10c', '10d', '10e', '10f'], "Sek-2": ['EF', 'Q1', 'Q2'] };
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
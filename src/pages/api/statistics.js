const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/students.db');

const loadStudentsFromDB = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM students', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const students = rows.map(row => ({
          ...row,
          timestamps: row.timestamps ? JSON.parse(row.timestamps) : []
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

  // statistics for each class
  students.forEach(student => {
    if (!classStats[student.klasse]) {
      classStats[student.klasse] = { totalRounds: 0, studentCount: 0 };
    }
    if (student.timestamps.length > 0) {
      classStats[student.klasse].totalRounds += student.timestamps.length;
      classStats[student.klasse].studentCount += 1;
      totalRounds += student.timestamps.length;
      totalActiveStudents += 1;
    }
  });

  // topClassesOfGrades should be an object with arrays of classes for each grade but the classes are sorted by totalRounds
  const grades = {5: ['5a', '5b', '5c', '5d', '5e', '5f'], 6: ['6a', '6b', '6c', '6d', '6e', '6f'], 7: ['7a', '7b', '7c', '7d', '7e', '7f'], 8: ['8a', '8b', '8c', '8d', '8e', '8f'], 9: ['9a', '9b', '9c', '9d', '9e', '9f'], 10: ['10a', '10b', '10c', '10d', '10e', '10f'], "Sek-2": ['EF', 'Q1', 'Q2']};
  const topClassesOfGrades = Object.entries(grades).reduce((acc, [grade, classes]) => {
    acc[grade] = classes
      .map(klasse => ({
        klasse,
        totalRounds: classStats[klasse]?.totalRounds || 0,
        averageRounds: classStats[klasse]?.totalRounds / classStats[klasse]?.studentCount || 0
      }))
      .sort((a, b) => b.averageRounds - a.averageRounds);
    return acc;
  }, {});

  const sortedClassStats = Object.entries(classStats)
    .map(([klasse, stats]) => ({
      klasse,
      totalRounds: stats.totalRounds,
      averageRounds: stats.totalRounds / stats.studentCount
    }))
    .sort((a, b) => b.totalRounds - a.totalRounds);

  // Top 5 students by rounds
  const topStudentsByRounds = [...students]
    .filter(student => student.timestamps.length > 0)
    .sort((a, b) => b.timestamps.length - a.timestamps.length)
    .slice(0, 5);

  // Top 5 students by collected money
  const topStudentsByMoney = [...students]
    .filter(student => student.spenden > 0)
    .sort((a, b) => b.spenden - a.spenden)
    .slice(0, 5);

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

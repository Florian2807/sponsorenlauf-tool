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

  // Berechne die Statistiken pro Klasse
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

  const sortedClassStats = Object.entries(classStats)
    .map(([klasse, stats]) => ({
      klasse,
      totalRounds: stats.totalRounds,
      averageRounds: stats.totalRounds / stats.studentCount
    }))
    .sort((a, b) => b.totalRounds - a.totalRounds);

  // Die Top 5 Schüler nach den meisten Runden
  const topStudents = [...students]
    .filter(student => student.timestamps.length > 0)
    .sort((a, b) => b.timestamps.length - a.timestamps.length)
    .slice(0, 5);

  const averageRounds = totalActiveStudents > 0 ? totalRounds / totalActiveStudents : 0;

  return {
    classStats: sortedClassStats,
    topStudents,
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

import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/database.db');

const getReplacementsById = (id) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM replacements WHERE id = ?`, [id], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const replacements = await getReplacementsById(id);
      if (replacements.length === 0) {
        res.json({ success: true, message: 'Ersatz-ID ist verfügbar' });
      } else {
        res.json({ success: false, message: 'Ersatz-ID ist bereits vergeben' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Fehler beim Abrufen der Daten' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
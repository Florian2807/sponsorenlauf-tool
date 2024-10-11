import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./data/students.db');

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	const { amount } = req.body;

	if (err) {
		console.error('Fehler beim Öffnen der Datenbank:', err.message);
		res.status(500).json({ message: 'Database connection error' });
		return;
	}

	const getMaxIdPromise = () => {
	return new Promise((resolve, reject) => {
		db.get(`SELECT MAX(id) as maxId FROM students`, [], (err, row) => {
			if (err) {
				reject(err);
			} else {
				resolve(row.maxId || 0);
			}
		});
	});


const maxId = await getMaxIdPromise();
let insertedCount = 0;

// Daten in die Datenbank einfügen
db.serialize(async () => {
	const insertQuery = `INSERT INTO students (id, vorname, nachname, klasse, timestamps) VALUES (?, ?, ?, ?, ?)`;

	const getMaxReplacementID = async () => {
		return new Promise((resolve, reject) => {
			db.get(
				`SELECT MAX(CAST(vorname AS INT)) AS maxReplacementID FROM students WHERE klasse="Ersatz"`,
				[],
				(err, row) => {
					if (err) {
						reject(err);
					} else {
						resolve(row.maxReplacementID || 0);
					}
				},
			);
		});
	};

	const maxReplacementID = await getMaxReplacementID();
	console.log(maxReplacementID);

	for (let i = 0; i < maxReplacementID + amount; i++) {
		const newId = parseInt(maxId + i + 1);
		const newReplacementID = maxReplacementID + i;
		db.run(
			insertQuery,
			[newId, newReplacementID, '', 'Ersatz', '[]'],
			(err) => {
				if (err) {
					console.error('Fehler beim Einfügen:', err.message);
				} else {
					console.log(`Datensatz ${newId} erfolgreich eingefügt.`);
					insertedCount++;
				}
			},
		);
	}
});

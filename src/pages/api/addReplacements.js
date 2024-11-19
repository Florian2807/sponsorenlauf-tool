import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./data/students.db');

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	const { amount } = req.body;


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
	}

	const maxId = await getMaxIdPromise();
	let insertedCount = 0;

	// add data to the database
	db.serialize(async () => {
		const insertQuery = `INSERT INTO students (id, vorname, nachname, klasse, timestamps, spenden, spendenKonto) VALUES (?, ?, ?, ?, ?, ?, ?)`;

		const getMaxReplacementID = async () => {
			return new Promise((resolve, reject) => {
				db.get(
					`SELECT MAX(CAST(vorname AS INT)) AS maxRID FROM students WHERE klasse="Ersatz"`,
					[],
					(err, row) => {
						if (err) {
							reject(err);
						} else {
							resolve(row.maxRID || 0);
						}
					},
				);
			});
		};

		const maxRID = await getMaxReplacementID();

		for (let i = 0; i < amount; i++) {
			const newId = parseInt(maxId + i + 1);
			const newRID = maxRID + i + 1;
			db.run(
				insertQuery,
				[newId, newRID, '', 'Ersatz', '[]', NULL, NULL],
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
	res.status(200).json({ count: insertedCount });
}
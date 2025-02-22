import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./data/database.db');

const getMaxId = () => {
	return new Promise((resolve, reject) => {
		db.get(`SELECT MAX(id) as maxId FROM students`, [], (err, row) => {
			if (err) {
				reject(err);
			} else {
				resolve(row.maxId || 0);
			}
		});
	});
};

const getMaxReplacementID = () => {
	return new Promise((resolve, reject) => {
		db.get(`SELECT MAX(CAST(vorname AS INT)) AS maxRID FROM students WHERE klasse="Ersatz"`, [], (err, row) => {
			if (err) {
				reject(err);
			} else {
				resolve(row.maxRID || 0);
			}
		});
	});
};

const insertReplacement = (newId, newRID) => {
	return new Promise((resolve, reject) => {
		db.run(
			`INSERT INTO students (id, vorname, nachname, klasse, timestamps, spenden, spendenKonto) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[newId, newRID, '', 'Ersatz', '[]', null, '[]'],
			(err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			}
		);
	});
};

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	const { amount } = req.body;

	try {
		const maxId = await getMaxId();
		const maxRID = await getMaxReplacementID();
		let insertedCount = 0;

		for (let i = 0; i < amount; i++) {
			const newId = maxId + i + 1;
			const newRID = maxRID + i + 1;
			await insertReplacement(newId, newRID);
			insertedCount++;
		}

		res.status(200).json({ count: insertedCount });
	} catch (error) {
		console.error('Fehler beim Einfügen:', error.message);
		res.status(500).json({ message: 'Fehler beim Einfügen der Ersatz-IDs' });
	}
}
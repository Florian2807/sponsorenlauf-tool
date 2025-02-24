import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/database.db');

const saveTeacher = (id, vorname, nachname, klasse, email) => {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO teachers (id, vorname, nachname, klasse, email) 
       VALUES (?, ?, ?, ?, ?)`,
            [id, vorname, nachname, klasse, email],
            function (err) {
                if (err) reject(err);
                resolve();
            }
        );
    });
};

const getTeacherById = (id) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM teachers WHERE id = ?`, [id], async (err, row) => {
            if (err) reject(err);
            if (row) {
                resolve(row);
            } else {
                resolve(null);
            }
        });
    });
};

const updateTeacher = (id, vorname, nachname, klasse, email) => {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE teachers 
       SET vorname = ?, nachname = ?, klasse = ?, email = ?
       WHERE id = ?`,
            [vorname, nachname, klasse, email, id],
            function (err) {
                if (err) reject(err);
                resolve();
            }
        );
    });
};

const deleteTeacher = (id) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`DELETE FROM teachers WHERE id = ?`, [id], (err) => {
                if (err) reject(err);
            });

            resolve();
        });
    });
};

export default async function handler(req, res) {
    let { id } = req.query;

    if (req.method === 'GET') {
        try {
            const teacher = await getTeacherById(id);
            if (teacher) {
                res.status(200).json(teacher);
            } else {
                res.status(404).json({ error: 'Lehrer nicht gefunden' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
        }
    } else if (req.method === 'POST') {
        const { vorname, nachname, klasse, email } = req.body;

        if (!id || !vorname || !nachname || !email) {
            return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
        }

        try {
            await saveTeacher(id, vorname, nachname, klasse, email);
            res.status(201).json({ id, vorname, nachname, klasse, email });
        } catch (error) {
            res.status(500).json({ error: 'Fehler beim Speichern des Lehrers' });
        }
    } else if (req.method === 'PUT') {
        const { vorname, nachname, klasse, email } = req.body;

        try {
            const teacher = await getTeacherById(id);
            if (!teacher) {
                return res.status(404).json({ error: 'Lehrer nicht gefunden' });
            }

            await updateTeacher(
                id,
                vorname !== undefined ? vorname : teacher.vorname,
                nachname !== undefined ? nachname : teacher.nachname,
                klasse !== undefined ? klasse : teacher.klasse,
                email !== undefined ? email : teacher.email
            );

            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Fehler beim Aktualisieren des Lehrers' });
        }
    } else if (req.method === 'DELETE') {
        try {
            const teacher = await getTeacherById(id);
            if (!teacher) {
                return res.status(404).json({ error: 'Lehrer nicht gefunden' });
            }

            await deleteTeacher(id);
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Fehler beim Löschen des Lehrers' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

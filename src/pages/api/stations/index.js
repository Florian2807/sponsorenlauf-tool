export default function handler(req, res) {
    return res.status(410).json({ message: 'Scanner-Stationen wurden entfernt. Scanner-Regeln werden direkt unter /scan eingestellt.' });
}

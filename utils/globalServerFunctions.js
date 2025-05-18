import fs from 'fs';

// count rounds of students as backup plan
const countJSON = require('../../../../data/countRounds.json');

export function updateCountJSON(studentID, setCount) {
    countJSON[studentID] = setCount;
    fs.writeFileSync('./data/countRounds.json', JSON.stringify(countJSON, null, 2));
}
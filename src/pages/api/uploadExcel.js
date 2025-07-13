import { getMaxStudentId, createStudent } from '../../utils/studentService.js';
import { validateStudent } from '../../utils/validation.js';
import { handleError, handleValidationError, handleSuccess } from '../../utils/apiHelpers.js';
import multer from 'multer';
import ExcelJS from 'exceljs';

const upload = multer({ storage: multer.memoryStorage() });
const uploadMiddleware = upload.single('file');

const parseExcelFile = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  const data = [];
  const errors = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header row
      const vorname = row.getCell(1).value?.toString()?.trim();
      const nachname = row.getCell(2).value?.toString()?.trim();
      const geschlecht = row.getCell(3).value?.toString()?.trim();
      const klasse = row.getCell(4).value?.toString()?.trim();

      const student = { vorname, nachname, geschlecht, klasse };
      const validationErrors = validateStudent(student, rowNumber - 1);

      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
      } else {
        data.push({
          vorname,
          nachname,
          geschlecht: geschlecht?.toLowerCase(),
          klasse
        });
      }
    }
  });

  return { data, errors };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return handleMethodNotAllowed(res, ['POST']);
  }

  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return handleError(res, err, 500, 'Fehler beim Hochladen der Datei');
    }

    try {
      if (!req.file) {
        return handleValidationError(res, ['Keine Datei hochgeladen']);
      }

      const { data, errors } = await parseExcelFile(req.file.buffer);

      if (errors.length > 0) {
        return handleValidationError(res, errors);
      }

      if (data.length === 0) {
        return handleValidationError(res, ['Keine gültigen Datenzeilen in Excel-Datei gefunden']);
      }

      const maxId = await getMaxStudentId();

      const insertPromises = data.map(async (student, index) => {
        const newId = maxId + index + 1;
        return createStudent({ id: newId, ...student });
      });

      await Promise.all(insertPromises);

      return handleSuccess(res, { count: data.length }, `${data.length} Schüler erfolgreich importiert`);
    } catch (error) {
      return handleError(res, error, 500, 'Fehler beim Verarbeiten der Excel-Datei');
    }
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

import {
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  updateRounds,
  updateReplacements,
  deleteRoundByIndex
} from '../../../utils/studentService.js';
import { validateStudent } from '../../../utils/validation.js';
import {
  handleMethodNotAllowed,
  handleError,
  handleSuccess,
  handleNotFound,
  handleValidationError
} from '../../../utils/apiHelpers.js';
import { dbGet } from '../../../utils/database.js';

export default async function handler(req, res) {
  try {
    const { id: rawId } = req.query;
    let id;

    if (rawId.startsWith('E')) {
      const replacement = await dbGet(
        'SELECT studentID FROM replacements WHERE id = ?',
        [parseInt(rawId.replace('E', ''), 10)]
      );

      if (!replacement) {
        return handleNotFound(res, 'Ersatz-ID');
      }
      id = replacement.studentID;
    } else {
      // Normale ID validierung
      id = parseInt(rawId, 10);
      if (isNaN(id) || id <= 0) {
        return handleError(res, new Error('Ungültige ID'), 400);
      }
    }

    if (req.method === 'GET') {
      const student = await getStudentById(id);
      if (!student) {
        return handleNotFound(res, 'Schüler');
      }
      return handleSuccess(res, student, 'Schüler erfolgreich abgerufen');

    } else if (req.method === 'POST') {
      const { vorname, nachname, klasse, geschlecht, timestamps, replacements } = req.body;

      const validationErrors = validateStudent({ vorname, nachname, klasse, geschlecht });
      if (validationErrors.length > 0) {
        return handleValidationError(res, validationErrors);
      }

      const existingStudent = await getStudentById(id);
      if (existingStudent) {
        return handleError(res, new Error('Schüler mit dieser ID existiert bereits'), 409);
      }

      await createStudent({ id, vorname, nachname, klasse, geschlecht });

      if (timestamps?.length > 0) {
        await updateRounds(id, timestamps);
      }

      if (replacements?.length > 0) {
        await updateReplacements(id, replacements);
      }

      return handleSuccess(res, {
        id, vorname, nachname, klasse, geschlecht: geschlecht || null, timestamps: timestamps || []
      }, 'Schüler erfolgreich erstellt', 201);

    } else if (req.method === 'PUT') {
      const { vorname, nachname, klasse, geschlecht, timestamps, replacements } = req.body;

      const student = await getStudentById(id);
      if (!student) {
        return handleNotFound(res, 'Schüler');
      }

      const updatedData = {
        vorname: vorname !== undefined ? vorname : student.vorname,
        nachname: nachname !== undefined ? nachname : student.nachname,
        klasse: klasse !== undefined ? klasse : student.klasse,
        geschlecht: geschlecht !== undefined ? geschlecht : student.geschlecht
      };

      const validationErrors = validateStudent(updatedData);
      if (validationErrors.length > 0) {
        return handleValidationError(res, validationErrors);
      }

      await updateStudent(id, updatedData);

      if (timestamps !== undefined) {
        await updateRounds(id, timestamps);
      }

      if (replacements !== undefined) {
        await updateReplacements(id, replacements);
      }

      return handleSuccess(res, null, 'Schüler erfolgreich aktualisiert');

    } else if (req.method === 'DELETE') {
      const { deleteRoundIndex } = req.body;

      const student = await getStudentById(id);
      if (!student) {
        return handleNotFound(res, 'Schüler');
      }

      if (deleteRoundIndex !== undefined) {
        const timestamps = student.timestamps;
        if (deleteRoundIndex < 0 || deleteRoundIndex >= timestamps.length) {
          return handleError(res, new Error('Ungültiger Index'), 400);
        }
        await deleteRoundByIndex(id, timestamps, deleteRoundIndex);
        return handleSuccess(res, null, 'Runde erfolgreich gelöscht');
      } else {
        await deleteStudent(id);
        return handleSuccess(res, null, 'Schüler erfolgreich gelöscht');
      }

    } else {
      return handleMethodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
    }
  } catch (error) {
    return handleError(res, error, 500, 'Fehler bei der Schülerverarbeitung');
  }
}

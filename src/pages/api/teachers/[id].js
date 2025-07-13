import {
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher
} from '../../../utils/teacherService.js';
import { validateTeacher } from '../../../utils/validation.js';
import {
  handleMethodNotAllowed,
  handleError,
  handleSuccess,
  handleNotFound,
  handleValidationError,
  validateRequiredFields
} from '../../../utils/apiHelpers.js';

export default async function handler(req, res) {
  try {
    const { id: rawId } = req.query;
    const id = parseInt(rawId, 10);

    if (isNaN(id) || id <= 0) {
      return handleError(res, new Error('Ungültige ID'), 400);
    }

    switch (req.method) {
      case 'GET':
        return await handleGetTeacher(res, id);

      case 'POST':
        return await handleCreateTeacher(res, id, req.body);

      case 'PUT':
        return await handleUpdateTeacher(res, id, req.body);

      case 'DELETE':
        return await handleDeleteTeacher(res, id);

      default:
        return handleMethodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
    }
  } catch (error) {
    return handleError(res, error, 500, 'Fehler bei der Lehrerverarbeitung');
  }
}

// Handler-Funktionen
async function handleGetTeacher(res, id) {
  const teacher = await getTeacherById(id);
  if (!teacher) {
    return handleNotFound(res, 'Lehrer');
  }
  return handleSuccess(res, teacher, 'Lehrer erfolgreich abgerufen');
}

async function handleCreateTeacher(res, id, body) {
  const { vorname, nachname, klasse, email } = body;

  const missing = validateRequiredFields({ body }, ['vorname', 'nachname', 'email']);
  if (missing.length > 0) {
    return handleValidationError(res, missing.map(field => `${field} ist erforderlich`));
  }

  const validationErrors = validateTeacher({ vorname, nachname, email });
  if (validationErrors.length > 0) {
    return handleValidationError(res, validationErrors);
  }

  const existingTeacher = await getTeacherById(id);
  if (existingTeacher) {
    return handleError(res, new Error('Lehrer mit dieser ID existiert bereits'), 409);
  }

  await createTeacher({ id, vorname, nachname, klasse, email });

  return handleSuccess(res, { id, vorname, nachname, klasse, email }, 'Lehrer erfolgreich erstellt', 201);
}

async function handleUpdateTeacher(res, id, body) {
  const { vorname, nachname, klasse, email } = body;

  const teacher = await getTeacherById(id);
  if (!teacher) {
    return handleNotFound(res, 'Lehrer');
  }

  const updatedData = {
    vorname: vorname !== undefined ? vorname : teacher.vorname,
    nachname: nachname !== undefined ? nachname : teacher.nachname,
    klasse: klasse !== undefined ? klasse : teacher.klasse,
    email: email !== undefined ? email : teacher.email
  };

  const validationErrors = validateTeacher(updatedData);
  if (validationErrors.length > 0) {
    return handleValidationError(res, validationErrors);
  }

  await updateTeacher(id, updatedData);

  return handleSuccess(res, null, 'Lehrer erfolgreich aktualisiert');
}

async function handleDeleteTeacher(res, id) {
  const teacher = await getTeacherById(id);
  if (!teacher) {
    return handleNotFound(res, 'Lehrer');
  }

  const result = await deleteTeacher(id);
  if (result.changes === 0) {
    return handleNotFound(res, 'Lehrer');
  }

  return handleSuccess(res, null, 'Lehrer erfolgreich gelöscht');
}

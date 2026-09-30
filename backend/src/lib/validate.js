import { SOURCE_VALUES, STATUS_VALUES } from '../constants.js';

/**
 * Errors thrown by handlers/validators are normalised by the central error
 * middleware into `{ error, ...details }` JSON responses (no stack traces).
 */
export class ApiError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  toJSON() {
    return this.details ? { error: this.message, details: this.details } : { error: this.message };
  }
}

export const LEAD_ID_PATTERN = /^LT-\d+$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Phone: digits, spaces, + ( ) . and dashes, 6 to 32 characters.
const PHONE_PATTERN = /^[\d+() .-]{6,32}$/;

const LIMITS = {
  name: { min: 2, max: 120 },
  company: { min: 1, max: 160 },
  email: { min: 3, max: 254 },
  phone: { min: 6, max: 32 },
  source: { min: 1, max: 40 },
  status: { min: 1, max: 40 },
  notes: { max: 2000 },
};

function isString(value) {
  return typeof value === 'string';
}

function trimLength(value) {
  return value.trim().length;
}

/** Validate `id` route param. Returns the raw value or throws a 400. */
export function requireValidLeadId(rawId) {
  if (typeof rawId !== 'string' || !LEAD_ID_PATTERN.test(rawId)) {
    throw new ApiError(400, 'Invalid lead id', { id: 'Lead id must look like LT-1041.' });
  }
  return rawId;
}

function validateName(value, errors) {
  if (!isString(value) || !value.trim()) {
    errors.name = 'Name is required and cannot be empty.';
  } else if (trimLength(value) < LIMITS.name.min || trimLength(value) > LIMITS.name.max) {
    errors.name = `Name must be between ${LIMITS.name.min} and ${LIMITS.name.max} characters.`;
  }
  return errors.name ?? value.trim();
}

function validateEmail(value, errors) {
  if (!isString(value) || !value.trim()) {
    errors.email = 'Email is required and cannot be empty.';
  } else if (trimLength(value) > LIMITS.email.max) {
    errors.email = `Email must be at most ${LIMITS.email.max} characters.`;
  } else if (!EMAIL_PATTERN.test(value.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  return errors.email ?? value.trim().toLowerCase();
}

function validatePhone(value, errors) {
  if (!isString(value) || !value.trim()) {
    errors.phone = 'Phone must be a non-empty string when provided.';
  } else if (!PHONE_PATTERN.test(value.trim())) {
    errors.phone = 'Enter a valid phone number (digits, +, spaces and dashes).';
  }
  return errors.phone ?? value.trim();
}

function validateCompany(value, errors) {
  if (!isString(value) || !value.trim()) {
    errors.company = 'Company must be a non-empty string when provided.';
  } else if (trimLength(value) > LIMITS.company.max) {
    errors.company = `Company must be at most ${LIMITS.company.max} characters.`;
  }
  return errors.company ?? value.trim();
}

function validateNotes(value, errors) {
  if (!isString(value)) {
    errors.notes = 'Notes must be a string when provided.';
  } else if (value.length > LIMITS.notes.max) {
    errors.notes = `Notes must be at most ${LIMITS.notes.max} characters.`;
  }
  return errors.notes ?? value.trim();
}

function validateSource(value, errors) {
  if (!isString(value) || !SOURCE_VALUES.includes(value)) {
    errors.source = `Source must be one of: ${SOURCE_VALUES.join(', ')}.`;
  }
  return errors.source ?? value;
}

function validateStatus(value, errors) {
  if (!isString(value) || !STATUS_VALUES.includes(value)) {
    errors.status = `Status must be one of: ${STATUS_VALUES.join(', ')}.`;
  }
  return errors.status ?? value;
}

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

/** Fields the API may store. Unknown body keys are ignored, not persisted. */
export const LEAD_FIELDS = ['name', 'company', 'email', 'phone', 'source', 'status', 'notes'];

/** Full validation for POST /api/leads. Returns a clean object or throws 400. */
export function validateLeadCreate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Request body must be a JSON object.');
  }

  const errors = {};
  const clean = {
    name: validateName(body.name, errors),
    email: validateEmail(body.email, errors),
    company: body.company === undefined ? '' : validateCompany(body.company, errors),
    phone: body.phone === undefined ? '' : validatePhone(body.phone, errors),
    source: validateSource(body.source, errors),
    status: validateStatus(body.status, errors),
    notes: body.notes === undefined ? '' : validateNotes(body.notes, errors),
  };

  if (hasErrors(errors)) {
    throw new ApiError(400, 'Validation failed', errors);
  }
  return clean;
}

/** Partial validation for PATCH /api/leads/:id. Returns a clean patch or throws. */
export function validateLeadUpdate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Request body must be a JSON object.');
  }

  const presentFields = LEAD_FIELDS.filter((field) => body[field] !== undefined);
  if (presentFields.length === 0) {
    throw new ApiError(400, 'No updateable fields provided');
  }

  const errors = {};
  const patch = {};

  for (const field of presentFields) {
    const value = body[field];
    switch (field) {
      case 'name':
        patch.name = validateName(value, errors);
        break;
      case 'email':
        patch.email = validateEmail(value, errors);
        break;
      case 'phone':
        patch.phone = validatePhone(value, errors);
        break;
      case 'company':
        patch.company = validateCompany(value, errors);
        break;
      case 'source':
        patch.source = validateSource(value, errors);
        break;
      case 'status':
        patch.status = validateStatus(value, errors);
        break;
      case 'notes':
        patch.notes = validateNotes(value, errors);
        break;
      default:
        break;
    }
  }

  if (hasErrors(errors)) {
    throw new ApiError(400, 'Validation failed', errors);
  }
  return patch;
}

/** Validate GET /api/leads query filters. Returns a filter object or throws. */
export function validateLeadFilters(query) {
  const errors = {};
  const filters = {};

  if (query.status !== undefined) {
    if (typeof query.status !== 'string' || !STATUS_VALUES.includes(query.status)) {
      errors.status = `Invalid status filter. Allowed: ${STATUS_VALUES.join(', ')}.`;
    } else {
      filters.status = query.status;
    }
  }

  if (query.source !== undefined) {
    if (typeof query.source !== 'string' || !SOURCE_VALUES.includes(query.source)) {
      errors.source = `Invalid source filter. Allowed: ${SOURCE_VALUES.join(', ')}.`;
    } else {
      filters.source = query.source;
    }
  }

  if (query.search !== undefined) {
    if (typeof query.search !== 'string' || query.search.trim().length === 0) {
      errors.search = 'Search must be a non-empty string.';
    } else if (query.search.trim().length > 100) {
      errors.search = 'Search must be at most 100 characters.';
    } else {
      filters.search = query.search.trim().toLowerCase();
    }
  }

  if (hasErrors(errors)) {
    throw new ApiError(400, 'Invalid query parameters', errors);
  }
  return filters;
}

/* ---------------------------------------------------------------------------
   Auth validation
--------------------------------------------------------------------------- */

const PASSWORD_LIMITS = { min: 8, max: 128 };

/** POST /api/auth/register body -> { name, email, password } or throws 400. */
export function validateRegister(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Request body must be a JSON object.');
  }

  const errors = {};
  const clean = {
    name: validateName(body.name, errors),
    email: validateEmail(body.email, errors),
    password: validatePassword(body.password, errors),
  };

  if (hasErrors(errors)) {
    throw new ApiError(400, 'Validation failed', errors);
  }
  return clean;
}

/** POST /api/auth/login body -> { email, password } or throws 400. */
export function validateLogin(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Request body must be a JSON object.');
  }

  const errors = {};
  const clean = {
    email: validateEmail(body.email, errors),
    password: validatePassword(body.password, errors),
  };

  if (hasErrors(errors)) {
    throw new ApiError(400, 'Validation failed', errors);
  }
  return clean;
}

function validatePassword(value, errors) {
  if (!isString(value) || value.length < PASSWORD_LIMITS.min) {
    errors.password = `Password must be at least ${PASSWORD_LIMITS.min} characters.`;
  } else if (value.length > PASSWORD_LIMITS.max) {
    errors.password = `Password must be at most ${PASSWORD_LIMITS.max} characters.`;
  }
  return errors.password ?? value;
}
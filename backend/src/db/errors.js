/**
 * Mapping from PostgreSQL driver errors to clean ApiErrors.
 *
 * Keep the converted response generic: never echo SQL text, values, or
 * connection details back to the client.
 */
import { ApiError } from '../lib/validate.js';

/** Check-constraint names declared in schema.sql -> readable field key. */
const CONSTRAINT_FIELDS = {
  leads_name_check: 'name',
  leads_company_check: 'company',
  leads_email_check: 'email',
  leads_phone_check: 'phone',
  leads_source_check: 'source',
  leads_status_check: 'status',
  leads_notes_check: 'notes',
};

/** Statuses that mean "no database right now" -> 503. */
const UNAVAILABLE_CODES = new Set([
  '08000', // connection_exception
  '08003', // connection_does_not_exist
  '08006', // connection_failure
  '08001', // sqlclient_unable_to_establish_sqlconnection
  '08004', // sqlserver_rejected_establishment_of_sqlconnection
  '57P01', // admin_shutdown
  '57P02', // crash_shutdown
  '57P03', // cannot_connect_now
  'ECONNREFUSED',
]);

/**
 * Convert a pg error to an ApiError. Returns null when the error is nothing
 * we recognise (the generic 500 handler takes over).
 */
export function postgresErrorToApiError(err) {
  if (!err || typeof err.code !== 'string') return null;

  // Value failed a column CHECK constraint (format/range/enum).
  if (err.code === '23514') {
    const field = CONSTRAINT_FIELDS[err.constraint];
    return new ApiError(400, 'Validation failed', {
      [field ?? 'data']: 'The value does not meet the required constraints.',
    });
  }

  // Unique violation.
  if (err.code === '23505') {
    if (err.table === 'users' || err.constraint === 'users_email_key') {
      return new ApiError(409, 'An account with this email already exists');
    }
    return new ApiError(409, 'The lead already exists');
  }

  // Anything that means PostgreSQL is unreachable/mid-restart.
  if (UNAVAILABLE_CODES.has(err.code) || err.code.startsWith('08')) {
    return new ApiError(503, 'Database service temporarily unavailable');
  }

  // Undefined table/column or other structural problem (e.g. schema not applied).
  if (err.code.startsWith('42')) {
    return new ApiError(500, 'Database is not initialised');
  }

  return null;
}
import * as authRepo from '../db/auth.repo.js';
import { hashPassword, verifyPassword } from '../lib/passwords.js';
import { signToken } from '../lib/jwt.js';
import { validateLogin, validateRegister } from '../lib/validate.js';
import { ApiError } from '../lib/validate.js';

/**
 * POST /api/auth/register
 * Validates, checks for an existing email, hashes the password and creates
 * the account, then returns the safe user + a token (auto-login).
 */
export async function register(req, res) {
  const { name, email, password } = validateRegister(req.body);

  const existing = await authRepo.findUserByEmail(email);
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await authRepo.createUser({ name, email, passwordHash });
  const token = signToken(user.id);

  res.status(201).json({ user, token });
}

/**
 * POST /api/auth/login
 * Finds the user by email and compares the password. Invalid credentials are
 * reported with a single generic message so we never reveal whether the email
 * or the password was wrong.
 */
export async function login(req, res) {
  const { email, password } = validateLogin(req.body);

  const user = await authRepo.findUserByEmail(email);
  const passwordMatches = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // rowToUser keeps only the safe fields; the hash never reaches the response.
  res.json({ user: authRepo.rowToUser(user), token: signToken(user.id) });
}

/** GET /api/auth/me — returns the currently authenticated user. */
export async function me(req, res) {
  const user = await authRepo.findUserById(req.user.id);
  if (!user) {
    // Account was deleted after the token was issued.
    throw new ApiError(401, 'Invalid or expired token');
  }
  res.json({ user });
}
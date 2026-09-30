import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Create an account. Client-side validation mirrors the backend so users get
 * immediate feedback; server field errors are mapped onto the inputs too.
 * Success auto-logs the user in (the register endpoint returns a token).
 */
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  function update(key) {
    return (event) => setValues((current) => ({ ...current, [key]: event.target.value }));
  }

  function validate() {
    const errors = {};
    const name = values.name.trim();
    const email = values.email.trim();

    if (name.length < 2 || name.length > 120) {
      errors.name = 'Name must be between 2 and 120 characters.';
    }
    if (!EMAIL_RE.test(email)) {
      errors.email = 'Enter a valid email address.';
    }
    if (values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (values.password.length > 128) {
      errors.password = 'Password must be at most 128 characters.';
    }
    if (values.confirm !== values.password) {
      errors.confirm = 'Passwords do not match.';
    }
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const errors = validate();
    setFieldErrors(errors);
    setApiError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      if (err.details && typeof err.details === 'object') {
        setFieldErrors(err.details);
      } else {
        setFieldErrors({});
      }
      setApiError(err.message ?? 'Unable to create the account. Please try again.');
      setSubmitting(false);
    }
  }

  const invalid = (key) => (fieldErrors[key] ? { 'aria-invalid': 'true' } : {});

  return (
    <AuthShell
      heading="Create your workspace"
      subheading="Set up your account to start tracking leads in minutes."
      footer={
        <p className="auth-card__link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {apiError ? (
          <p className="auth-error" role="alert" data-testid="auth-error">
            {apiError}
          </p>
        ) : null}

        <div className="form-field">
          <label className="form-field__label" htmlFor="reg-name">
            Full name
          </label>
          <input
            id="reg-name"
            className="input"
            type="text"
            autoComplete="name"
            placeholder="Alex Morgan"
            value={values.name}
            onChange={update('name')}
            {...invalid('name')}
          />
          {fieldErrors.name ? <p className="form-error">{fieldErrors.name}</p> : null}
        </div>

        <div className="form-field">
          <label className="form-field__label" htmlFor="reg-email">
            Email
          </label>
          <input
            id="reg-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={update('email')}
            {...invalid('email')}
          />
          {fieldErrors.email ? <p className="form-error">{fieldErrors.email}</p> : null}
        </div>

        <div className="form-field">
          <label className="form-field__label" htmlFor="reg-password">
            Password
          </label>
          <input
            id="reg-password"
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={values.password}
            onChange={update('password')}
            {...invalid('password')}
          />
          {fieldErrors.password ? <p className="form-error">{fieldErrors.password}</p> : null}
        </div>

        <div className="form-field">
          <label className="form-field__label" htmlFor="reg-confirm">
            Confirm password
          </label>
          <input
            id="reg-confirm"
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={values.confirm}
            onChange={update('confirm')}
            {...invalid('confirm')}
          />
          {fieldErrors.confirm ? <p className="form-error">{fieldErrors.confirm}</p> : null}
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={submitting}
          data-testid="register-submit"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
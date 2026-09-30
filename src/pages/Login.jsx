import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Sign in. On success the AuthContext holds the session and the shell renders
 * the app; redirect back to the page the user was trying to reach.
 */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setApiError(null);
    try {
      await login({ email: email.trim(), password });
      const from = location.state?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err.message ?? 'Unable to sign in. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      heading="Welcome back"
      subheading="Sign in to your workspace to pick up where you left off."
      footer={
        <p className="auth-card__link">
          New to LeadTrack? <Link to="/register">Create an account</Link>
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
          <label className="form-field__label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-field__label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={submitting}
          data-testid="login-submit"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
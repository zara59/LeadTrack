import { useAuth } from '../context/AuthContext.jsx';
import { IconGauge } from './Icons.jsx';

/**
 * Standalone shell for the Login / Register screens: white backdrop with soft
 * gradient accents, the LeadTrack brand mark and a centered card.
 *
 * Note: no auto-redirect here when authenticated. The login/register submit
 * handlers own the post-success navigation (e.g. back to the page that
 * redirected to /login), so a competing <Navigate to="/"> would race it.
 */
export default function AuthShell({ heading, subheading, children, footer }) {
  const { status } = useAuth();

  if (status === 'loading') return null;

  return (
    <div className="auth-page">
      <div className="auth-page__glow auth-page__glow--one" aria-hidden="true" />
      <div className="auth-page__glow auth-page__glow--two" aria-hidden="true" />

      <main className="auth-card">
        <div className="auth-card__brand">
          <span className="brand-mark brand-mark--lg" aria-hidden="true">
            <IconGauge size={20} />
          </span>
          <p className="brand-name">LeadTrack</p>
          <p className="brand-tag">Lead management CRM</p>
        </div>

        <header className="auth-card__head">
          <h1 className="auth-card__title">{heading}</h1>
          {subheading ? <p className="auth-card__sub">{subheading}</p> : null}
        </header>

        {children}

        {footer ? <div className="auth-card__footer">{footer}</div> : null}
      </main>
    </div>
  );
}
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconGauge } from '../components/Icons.jsx';

/** Catch-all route so an unknown URL never renders a blank screen. */
export default function NotFound() {
  return (
    <section className="card card--flush">
      <div className="empty-state">
        <div className="empty-state__art" aria-hidden="true">
          <span className="empty-state__glow" />
          <span className="empty-state__icon">
            <IconGauge size={34} />
          </span>
        </div>
        <h2 className="empty-state__title">Page not found</h2>
        <p className="empty-state__text">
          The page you are looking for does not exist or has been moved. Use the navigation
          to get back to your pipeline.
        </p>
        <div className="empty-state__actions">
          <Link className="btn btn--primary" to="/">
            <IconArrowLeft size={16} />
            Back to dashboard
          </Link>
          <Link className="btn btn--secondary" to="/leads">
            View leads
          </Link>
        </div>
      </div>
    </section>
  );
}

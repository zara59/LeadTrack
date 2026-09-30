import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Guards the app shell. While the token is being restored we render a quiet
 * brand splash instead of flashing protected UI; unauthenticated users are
 * sent to /login (remembering where they tried to go).
 */
export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="auth-loading" aria-label="Loading LeadTrack">
        <span className="brand-mark brand-mark--lg" aria-hidden="true" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
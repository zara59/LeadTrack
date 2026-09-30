import { Route, Routes } from 'react-router-dom';
import RequireAuth from './components/RequireAuth.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LeadDetails from './pages/LeadDetails.jsx';
import Leads from './pages/Leads.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import Register from './pages/Register.jsx';
import Settings from './pages/Settings.jsx';

/**
 * LeadTrack routes.
 *
 * /login and /register are public. Everything else lives inside RequireAuth
 * (+ the app shell), so an unauthenticated visit redirects to /login and the
 * pages never render without a session.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetails />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
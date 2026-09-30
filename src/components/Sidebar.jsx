import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import { IconClose, IconGauge, IconLeads, IconLogout, IconSettings } from './Icons.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', Icon: IconGauge, end: true },
  { to: '/leads', label: 'Leads', Icon: IconLeads, showCount: true },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
];

/**
 * Primary navigation. White sidebar with a gradient active state.
 * Below 1024px it becomes an off-canvas drawer; the layout owns the open state
 * and passes `onNavigate` so the drawer closes once a link is followed.
 */
export default function Sidebar({ navOpen, onClose, leadCount }) {
  const { user, logout } = useAuth();
  return (
    <>
      <button
        type="button"
        className="sidebar__scrim"
        onClick={onClose}
        aria-label="Close navigation"
        tabIndex={navOpen ? 0 : -1}
      />

      <aside className="sidebar" id="app-sidebar" aria-label="Main navigation">
        <div className="sidebar__brand">
          <span className="brand-mark" aria-hidden="true">
            <IconGauge size={19} />
          </span>
          <div>
            <p className="brand-name">LeadTrack</p>
            <p className="brand-tag">Lead management CRM</p>
          </div>
          <button
            type="button"
            className="icon-btn icon-btn--ghost sidebar__close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <IconClose size={18} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Workspace">
          <p className="nav-section-label">Workspace</p>
          <ul>
            {NAV_ITEMS.map(({ to, label, Icon, end, showCount }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `nav-item${isActive ? ' nav-item--active' : ''}`
                  }
                >
                  <span className="nav-item__icon" aria-hidden="true">
                    <Icon size={19} />
                  </span>
                  <span className="truncate">{label}</span>
                  {showCount && leadCount ? (
                    <span className="nav-item__count">{leadCount}</span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__aside">
          <div className="upgrade-card">
            <p className="upgrade-card__title">Pipeline usage</p>
            <p className="upgrade-card__text">
              {leadCount} of 25 lead slots currently in use.
            </p>
            <div className="upgrade-card__bar">
              <div
                className="upgrade-card__fill"
                style={{ width: `${Math.min(100, (leadCount / 25) * 100).toFixed(0)}%` }}
              />
            </div>
            <p className="upgrade-card__meta">Free plan limit</p>
          </div>
        </div>

        <div className="sidebar__footer">
          <Link to="/settings" className="user-chip" onClick={onClose}>
            <Avatar name={user.name} />
            <span className="truncate">
              <span className="user-chip__name truncate">{user.name}</span>
              <span className="user-chip__role truncate">{user.email}</span>
            </span>
          </Link>
          <button
            type="button"
            className="icon-btn sidebar__logout"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
          >
            <IconLogout size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}

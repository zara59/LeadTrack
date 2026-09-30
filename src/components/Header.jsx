import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import { IconBell, IconMenu, IconPlus } from './Icons.jsx';

/**
 * Sticky white page header: contextual title + description on the left,
 * actions on the right. Titles are declared by the router in App.jsx.
 */
export default function Header({ title, description, navOpen, onMenuClick, onAddLead }) {
  const { user } = useAuth();
  const firstName = (user.name ?? '').split(/\s+/)[0];

  return (
    <header className="header">
      <div className="header__inner">
        <button
          type="button"
          className="icon-btn header__menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation"
          aria-controls="app-sidebar"
          aria-expanded={navOpen}
        >
          <IconMenu size={19} />
        </button>

        <div className="header__titles">
          <h1 className="header__title truncate">{title}</h1>
          {description ? (
            <p className="header__subtitle">{description}</p>
          ) : null}
        </div>

        <div className="header__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={onAddLead}
            data-testid="header-add-lead"
          >
            <IconPlus size={16} />
            <span className="header__add-label">Add Lead</span>
          </button>

          <span className="header__divider" aria-hidden="true" />

          <button type="button" className="icon-btn" aria-label="Notifications (3 unread)">
            <IconBell size={18} />
            <span className="icon-btn__dot" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="header__profile"
            aria-label="Your account and profile settings"
          >
            <Avatar name={user.name} size="sm" />
            <span>
              <span className="header__profile-name">{firstName || user.name}</span>
              <span className="header__profile-role">Pro workspace</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

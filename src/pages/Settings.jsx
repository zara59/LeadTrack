import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar.jsx';
import PageHead from '../components/PageHead.jsx';
import {
  IconBriefcase,
  IconClock,
  IconInfo,
  IconLogout,
  IconUser,
} from '../components/Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { LEAD_STATUSES } from '../data/constants.js';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: IconUser },
  { id: 'preferences', label: 'Preferences', icon: IconClock },
  { id: 'account', label: 'Account', icon: IconBriefcase },
];

const TIMEZONES = [
  'Europe/Lisbon (WET)',
  'Europe/London (GMT)',
  'America/New_York (EST)',
  'America/Los_Angeles (PST)',
  'Asia/Singapore (SGT)',
];

const LANGUAGES = ['English (UK)', 'English (US)', 'Español', 'Português'];

/**
 * Settings. All sections render on one page and the side navigation scrolls to
 * them. Preference changes are local state only — there is no account
 * persistence in Stage 1, so nothing is saved.
 */
export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [preferences, setPreferences] = useState({
    weeklyDigest: true,
    leadAlerts: true,
    productUpdates: false,
    defaultStatus: 'new',
    timezone: TIMEZONES[0],
    language: LANGUAGES[0],
  });
  const sectionRefs = useRef({});

  // Keep the side navigation in sync with the section in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-96px 0px -55% 0px', threshold: 0.1 },
    );

    Object.values(sectionRefs.current).forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  function registerSection(id) {
    return (node) => {
      sectionRefs.current[id] = node;
    };
  }

  function toggle(key) {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  }

  function update(key, value) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function scrollToSection(id) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      <PageHead
        title="Settings"
        subtitle="Your profile is loaded from the LeadTrack API and shown here read-only. Account and preference editing is not part of this scope."
      />

      <div className="settings-layout">
        <nav className="card settings-nav" aria-label="Settings sections">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`settings-nav__item${
                activeSection === id ? ' settings-nav__item--active' : ''
              }`}
              onClick={() => scrollToSection(id)}
              aria-current={activeSection === id ? 'true' : undefined}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        <div className="settings-sections">
          {/* ---- Profile ---- */}
          <section
            className="card card--flush"
            aria-labelledby="profile-title"
            ref={registerSection('profile')}
          >
            <div className="profile-row">
              <Avatar name={user.name} size="lg" tinted />
              <div className="profile-row__text">
                <h2 className="profile-row__name" id="profile-title">
                  {user.name}
                </h2>
                <p className="profile-row__meta">{user.email}</p>
              </div>
              <div
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <button type="button" className="btn btn--secondary">
                  Change photo
                </button>
                <button type="button" className="btn btn--primary">
                  Save changes
                </button>
              </div>
            </div>

            <div className="card__body">
              <div className="form-grid">
                <TextField id="settings-name" label="Full Name" value={user.name} />
                <TextField
                  id="settings-email"
                  label="Email"
                  type="email"
                  value={user.email}
                />
                <div className="form-field form-field--full">
                  <label className="form-field__label" htmlFor="settings-bio">
                    Short bio <span>optional</span>
                  </label>
                  <textarea
                    id="settings-bio"
                    className="textarea"
                    defaultValue="Freelance growth consultant helping small teams turn scattered leads into predictable revenue."
                  />
                </div>
              </div>

              <div className="form-note" style={{ marginTop: 18 }}>
                <IconInfo size={16} className="form-note__icon" />
                <span>
                  Profile editing is presentational here. Signing in and signing out
                  are live — backed by the authenticated API.
                </span>
              </div>
            </div>
          </section>

          {/* ---- Account preferences ---- */}
          <section
            className="card card--flush"
            aria-labelledby="workflow-title"
            ref={registerSection('preferences')}
          >
            <div className="card__header">
              <div>
                <h2 className="t-section" id="workflow-title">
                  Account preferences
                </h2>
                <p className="t-meta">Workflow defaults, locale and notifications.</p>
              </div>
            </div>

            <div className="pref-row">
              <div className="pref-row__text">
                <p className="pref-row__label">Default lead status</p>
                <p className="pref-row__desc">
                  Applied to the Add Lead form so you rarely need to change it.
                </p>
              </div>
              <div className="pref-row__control">
                <label className="sr-only" htmlFor="pref-status">
                  Default lead status
                </label>
                <select
                  id="pref-status"
                  className="select"
                  value={preferences.defaultStatus}
                  onChange={(event) => update('defaultStatus', event.target.value)}
                >
                  {LEAD_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pref-row">
              <div className="pref-row__text">
                <p className="pref-row__label">Timezone</p>
                <p className="pref-row__desc">Used for timestamps and weekly summaries.</p>
              </div>
              <div className="pref-row__control">
                <label className="sr-only" htmlFor="pref-timezone">
                  Timezone
                </label>
                <select
                  id="pref-timezone"
                  className="select"
                  value={preferences.timezone}
                  onChange={(event) => update('timezone', event.target.value)}
                >
                  {TIMEZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pref-row">
              <div className="pref-row__text">
                <p className="pref-row__label">Language</p>
                <p className="pref-row__desc">Interface language for your workspace.</p>
              </div>
              <div className="pref-row__control">
                <label className="sr-only" htmlFor="pref-language">
                  Language
                </label>
                <select
                  id="pref-language"
                  className="select"
                  value={preferences.language}
                  onChange={(event) => update('language', event.target.value)}
                >
                  {LANGUAGES.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <hr />

            <div className="pref-row">
              <div className="pref-row__text">
                <p className="pref-row__label">Weekly pipeline digest</p>
                <p className="pref-row__desc">
                  A Monday summary of new, qualified and won leads.
                </p>
              </div>
              <div className="pref-row__control">
                <PreferenceToggle
                  label="Weekly pipeline digest"
                  checked={preferences.weeklyDigest}
                  onChange={() => toggle('weeklyDigest')}
                />
              </div>
            </div>

            <div className="pref-row">
              <div className="pref-row__text">
                <p className="pref-row__label">New lead alerts</p>
                <p className="pref-row__desc">
                  Notify me whenever a lead is added to the workspace.
                </p>
              </div>
              <div className="pref-row__control">
                <PreferenceToggle
                  label="New lead alerts"
                  checked={preferences.leadAlerts}
                  onChange={() => toggle('leadAlerts')}
                />
              </div>
            </div>

            <div className="pref-row">
              <div className="pref-row__text">
                <p className="pref-row__label">Product updates</p>
                <p className="pref-row__desc">
                  Occasional emails about new LeadTrack features.
                </p>
              </div>
              <div className="pref-row__control">
                <PreferenceToggle
                  label="Product updates"
                  checked={preferences.productUpdates}
                  onChange={() => toggle('productUpdates')}
                />
              </div>
            </div>
          </section>

          {/* ---- Account ---- */}
          <section
            className="card card--flush"
            aria-labelledby="account-title"
            ref={registerSection('account')}
          >
            <div className="card__header">
              <div>
                <h2 className="t-section" id="account-title">
                  Account
                </h2>
                <p className="t-meta">Plan details and session controls.</p>
              </div>
            </div>
            <div className="info-list">
              <div className="pref-row">
                <span className="info-row__icon" aria-hidden="true">
                  <IconBriefcase size={16} />
                </span>
                <div className="pref-row__text">
                  <p className="pref-row__label">Current plan</p>
                  <p className="pref-row__desc">
                    Free plan · 14 of 25 leads used · renews on the 1st
                  </p>
                </div>
                <span className="pill pill--lg">Free</span>
              </div>
              <div className="pref-row">
                <span className="info-row__icon" aria-hidden="true">
                  <IconLogout size={16} />
                </span>
                <div className="pref-row__text">
                  <p className="pref-row__label">Sign out</p>
                  <p className="pref-row__desc">
                    End this session and return to the sign-in screen.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={handleLogout}
                  data-testid="settings-logout"
                >
                  Sign out
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function TextField({ id, label, value, type = 'text' }) {
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="input" type={type} defaultValue={value} />
    </div>
  );
}

function PreferenceToggle({ label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch${checked ? ' switch--on' : ''}`}
      onClick={onChange}
    />
  );
}

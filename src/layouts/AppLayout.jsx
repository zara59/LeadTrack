import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useLeads } from '../context/LeadsContext.jsx';

/** Route → header copy, so the header always shows contextual information. */
const HEADER_META = {
  '/': {
    title: 'Dashboard',
    description: 'A snapshot of your pipeline, conversion and latest activity.',
  },
  '/leads': {
    title: 'Leads',
    description: 'Search, filter and manage every lead in your workspace.',
  },
  '/settings': {
    title: 'Settings',
    description: 'Manage your profile and account preferences.',
  },
};

function headerMetaFor(pathname) {
  if (HEADER_META[pathname]) return HEADER_META[pathname];

  if (pathname.startsWith('/leads/')) {
    return {
      title: 'Lead details',
      description: 'Everything known about this lead, in one place.',
    };
  }

  return { title: 'Page not found', description: 'This page does not exist.' };
}

/**
 * Application shell: white sidebar, sticky white header, light page canvas.
 * Owns only the mobile navigation drawer; lead state and the Add/Edit dialog
 * live in the leads context.
 */
export default function AppLayout() {
  const { pathname } = useLocation();
  const { leads, stats, openAdd, actionError, clearActionError } = useLeads();
  const [navOpen, setNavOpen] = useState(false);

  const closeNav = useCallback(() => setNavOpen(false), []);

  // Close the drawer whenever the route changes, and return to the top.
  useEffect(() => {
    setNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  // Lock background scrolling while the drawer is open on small screens.
  useEffect(() => {
    if (!navOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [navOpen]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') setNavOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const meta = headerMetaFor(pathname);

  return (
    <div className={`app-shell${navOpen ? ' app-shell--nav-open' : ''}`}>
      <Sidebar navOpen={navOpen} onClose={closeNav} leadCount={stats?.totalLeads ?? leads.length} />

      <div className="app-shell__main">
        <Header
          title={meta.title}
          description={meta.description}
          navOpen={navOpen}
          onMenuClick={() => setNavOpen(true)}
          onAddLead={openAdd}
        />
        <main className="app-shell__content" id="main-content">
          {actionError ? (
            <div className="alert alert--error action-alert" role="alert">
              <p className="alert__text">{actionError}</p>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={clearActionError}
              >
                Dismiss
              </button>
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
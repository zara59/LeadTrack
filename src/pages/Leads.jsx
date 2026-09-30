import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LeadTable from '../components/LeadTable.jsx';
import PageHead from '../components/PageHead.jsx';
import { IconFilter, IconPlus, IconSearch } from '../components/Icons.jsx';
import { useLeads } from '../context/LeadsContext.jsx';
import { LEAD_SOURCES, LEAD_STATUSES } from '../data/constants.js';
import { fetchLeads } from '../services/leads.js';

const ALL = 'all';
const FILTERS = ['status', 'source'];
const DEBOUNCE_MS = 250;

/**
 * Leads management page.
 *
 * Search and filters are applied on the server (via query params) and stay
 * reflected in the URL so dashboard cards and the pipeline can deep-link into
 * a pre-filtered list. Typing debounces the request; the list re-fetches when
 * `revision` changes so edits made elsewhere are reflected here.
 */
export default function Leads() {
  const { openAdd, stats, revision } = useLeads();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? ALL;
  const source = searchParams.get('source') ?? ALL;

  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        setLoading(true);
        setLoadError(null);
        fetchLeads(
          {
            search: query.trim(),
            status: status === ALL ? '' : status,
            source: source === ALL ? '' : source,
          },
          { signal: controller.signal },
        )
          .then((data) => {
            if (controller.signal.aborted) return;
            setRows(data);
          })
          .catch((err) => {
            if (err.name === 'AbortError' || controller.signal.aborted) return;
            setLoadError(err.message ?? 'Could not load leads.');
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          });
      },
      query ? DEBOUNCE_MS : 0,
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, status, source, revision, attempt]);

  const hasFilters = query !== '' || status !== ALL || source !== ALL;

  const setParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      if (value === '' || value === ALL) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  function resetFilters() {
    const next = new URLSearchParams(searchParams);
    FILTERS.concat(['q']).forEach((key) => next.delete(key));
    setSearchParams(next, { replace: true });
  }

  function retry() {
    setAttempt((value) => value + 1);
  }

  const loaded = rows !== null;
  const visibleCount = loaded ? rows.length : 0;
  const totalCount = stats?.totalLeads ?? 0;
  const countText = totalCount ? `${visibleCount} of ${totalCount} leads` : `${visibleCount} leads`;

  return (
    <>
      <PageHead
        title="Leads"
        subtitle="Every lead in your workspace. Search by name, company or email, then narrow the list by status or source."
        actions={
          <>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={resetFilters}
              disabled={!hasFilters}
            >
              Reset
            </button>
            <button type="button" className="btn btn--primary" onClick={openAdd}>
              <IconPlus size={16} />
              Add Lead
            </button>
          </>
        }
      />

      <section className="card card--flush" aria-label="Leads list">
        <div className="toolbar">
          <div className="toolbar__search input-group">
            <IconSearch size={17} className="input-group__icon" />
            <label className="sr-only" htmlFor="lead-search">
              Search leads
            </label>
            <input
              id="lead-search"
              className="input"
              type="search"
              placeholder="Search name, company or email…"
              value={query}
              onChange={(event) => setParam('q', event.target.value)}
            />
          </div>

          <div className="toolbar__filters">
            <span className="icon-btn" aria-hidden="true" style={{ cursor: 'default' }}>
              <IconFilter size={16} />
            </span>

            <label className="sr-only" htmlFor="status-filter">
              Filter by status
            </label>
            <select
              id="status-filter"
              className="select"
              value={status}
              onChange={(event) => setParam('status', event.target.value)}
            >
              <option value={ALL}>All statuses</option>
              {LEAD_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="source-filter">
              Filter by source
            </label>
            <select
              id="source-filter"
              className="select"
              value={source}
              onChange={(event) => setParam('source', event.target.value)}
            >
              <option value={ALL}>All sources</option>
              {LEAD_SOURCES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <p className="toolbar__count" aria-live="polite">
              {loading && !loaded ? 'Loading…' : countText}
            </p>
          </div>
        </div>

        {loadError ? (
          <div className="load-error" role="alert">
            <p className="load-error__title">Could not load leads</p>
            <p className="load-error__text">{loadError}</p>
            <button type="button" className="btn btn--secondary" onClick={retry}>
              Try again
            </button>
          </div>
        ) : loading && !loaded ? (
          <LeadsSkeleton />
        ) : (
          <LeadTable
            leads={rows}
            variant={!hasFilters && rows.length === 0 ? 'compact' : 'full'}
            onAddLead={openAdd}
            onResetFilters={resetFilters}
          />
        )}
      </section>
    </>
  );
}

function LeadsSkeleton() {
  return (
    <div className="table-wrap">
      <div className="skeleton-stack" style={{ padding: 20 }} aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="skeleton skeleton--block" />
        ))}
      </div>
    </div>
  );
}
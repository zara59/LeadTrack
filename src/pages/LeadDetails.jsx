import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar.jsx';
import LeadTable from '../components/LeadTable.jsx';
import PageHead from '../components/PageHead.jsx';
import StatusSelect from '../components/StatusSelect.jsx';
import {
  IconArrowLeft,
  IconBuilding,
  IconCalendar,
  IconMail,
  IconNotes,
  IconPhone,
  IconPlus,
  IconTrash,
  IconUsers,
} from '../components/Icons.jsx';
import { useLeads } from '../context/LeadsContext.jsx';
import { fetchLead } from '../services/leads.js';
import { formatDate, formatDateTime, formatRelative, sourceLabel } from '../utils/format.js';

/**
 * Lead detail view.
 *
 * The lead itself is fetched from the API by id (404 → "Lead not found"), while
 * the "other [source] leads" sidebar comes from the shared context. Editing
 * opens the shared dialog; saving bumps `revision`, which re-fetches the lead.
 */
export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leads, openAdd, openEdit, requestDelete, changeStatus, revision } = useLeads();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const loadedOnceRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    fetchLead(id, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        loadedOnceRef.current = true;
        setLead(data);
      })
      .catch((err) => {
        if (err.name === 'AbortError' || controller.signal.aborted) return;
        // A lead that existed a moment ago and is now gone (deleted here or
        // elsewhere) is just a missing row — go back to the list.
        if (err.status === 404 && loadedOnceRef.current) {
          navigate('/leads', { replace: true });
          return;
        }
        setLoadError({ status: err.status ?? null, message: err.message ?? 'Could not load this lead.' });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id, revision, attempt, navigate]);

  const relatedLeads = lead
    ? leads.filter((item) => item.source === lead.source && item.id !== lead.id).slice(0, 4)
    : [];

  if (loading && !lead) return <DetailsSkeleton />;

  if (loadError) {
    if (loadError.status === 404) {
      return <NotFoundLead id={id} />;
    }
    return (
      <LoadErrorLead
        id={id}
        message={loadError.message}
        onRetry={() => setAttempt((value) => value + 1)}
      />
    );
  }

  if (!lead) return null;

  return (
    <>
      <PageHead
        backLink={
          <Link className="btn btn--ghost btn--sm" to="/leads" style={{ marginBottom: 10 }}>
            <IconArrowLeft size={15} />
            Back to leads
          </Link>
        }
        actions={
          <>
            <button type="button" className="btn btn--secondary" onClick={() => openEdit(lead)}>
              Edit lead
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--danger-ghost"
              onClick={() => requestDelete(lead)}
            >
              <IconTrash size={16} />
              Delete
            </button>
            <button type="button" className="btn btn--primary" onClick={openAdd}>
              <IconPlus size={16} />
              Add Lead
            </button>
          </>
        }
      />

      <section className="detail-hero" aria-labelledby="lead-name">
        <div className="detail-hero__top">
          <Avatar name={lead.name} size="lg" />

          <div>
            <h2 className="detail-hero__name" id="lead-name">
              {lead.name}
            </h2>
            <p className="detail-hero__role">
              {lead.company ? `${lead.company} · ${lead.id}` : lead.id}
            </p>
          </div>

          <div className="detail-hero__actions">
            <a className="btn btn--secondary" href={`mailto:${lead.email}`}>
              <IconMail size={16} />
              Email
            </a>
            <a
              className="btn btn--secondary"
              href={lead.phone ? `tel:${lead.phone.replace(/[^+\d]/g, '')}` : undefined}
              aria-disabled={!lead.phone}
            >
              <IconPhone size={16} />
              Call
            </a>
          </div>
        </div>

        <div className="detail-hero__meta">
          <div>
            <p className="detail-meta__label">Status</p>
            <p className="detail-meta__value" style={{ marginTop: 4 }}>
              <StatusSelect value={lead.status} onChange={(next) => changeStatus(lead.id, next)} />
            </p>
          </div>
          <div>
            <p className="detail-meta__label">Source</p>
            <p className="detail-meta__value">{sourceLabel(lead.source)}</p>
          </div>
          <div>
            <p className="detail-meta__label">Added</p>
            <p className="detail-meta__value">{formatDate(lead.createdAt)}</p>
          </div>
          <div>
            <p className="detail-meta__label">Lead ID</p>
            <p className="detail-meta__value">{lead.id}</p>
          </div>
        </div>
      </section>

      <div className="detail-grid">
        <div className="dash-stack">
          <section className="card" aria-labelledby="contact-title">
            <div className="card__header">
              <h2 className="t-section" id="contact-title">
                Contact details
              </h2>
            </div>
            <div className="info-list">
              <InfoRow icon={IconUsers} label="Full name" value={lead.name} />
              <InfoRow icon={IconBuilding} label="Company" value={lead.company || '—'} />
              <InfoRow
                icon={IconMail}
                label="Email"
                value={lead.email}
                href={`mailto:${lead.email}`}
              />
              <InfoRow
                icon={IconPhone}
                label="Phone"
                value={lead.phone || 'Not provided'}
                href={lead.phone ? `tel:${lead.phone.replace(/[^+\d]/g, '')}` : undefined}
              />
            </div>
          </section>

          <section className="card" aria-labelledby="notes-title">
            <div className="card__header">
              <h2 className="t-section" id="notes-title">
                Notes
              </h2>
            </div>
            <div className="notes-body">
              {lead.notes ? (
                <p className="notes-text">{lead.notes}</p>
              ) : (
                <div className="note-card">
                  <IconNotes size={18} className="note-card__icon" />
                  <div>
                    <p className="t-section">No notes yet</p>
                    <p className="t-meta" style={{ marginTop: 2 }}>
                      Notes added from discovery calls, emails and proposals will appear
                      here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="dash-stack">
          <section className="card" aria-labelledby="timeline-title">
            <div className="card__header">
              <h2 className="t-section" id="timeline-title">
                Timeline
              </h2>
            </div>
            <div className="timeline">
              <div className="timeline__item">
                <span className="timeline__marker" aria-hidden="true">
                  <IconCalendar size={15} />
                </span>
                <div>
                  <p className="timeline__text">
                    Lead <strong>created</strong> via {sourceLabel(lead.source)}.
                  </p>
                  <p className="timeline__time">
                    {formatDateTime(lead.createdAt)} · {formatRelative(lead.createdAt)}
                  </p>
                </div>
              </div>
              <div className="timeline__item">
                <span className="timeline__marker" aria-hidden="true">
                  <IconNotes size={15} />
                </span>
                <div>
                  <p className="timeline__text">
                    Currently <strong>{lead.status}</strong> in the pipeline.
                  </p>
                  <p className="timeline__time">Status changes are saved to the server.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="card" aria-labelledby="similar-title">
            <div className="card__header">
              <div>
                <h2 className="t-section" id="similar-title">
                  Other {sourceLabel(lead.source)} leads
                </h2>
                <p className="t-meta">Same source, different accounts.</p>
              </div>
            </div>
            <LeadTable
              leads={relatedLeads}
              variant="compact"
              onAddLead={openAdd}
              onResetFilters={() => undefined}
            />
          </section>
        </div>
      </div>
    </>
  );
}

function InfoRow({ icon: Icon, label, value, href }) {
  return (
    <div className="info-row">
      <span className="info-row__icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <div style={{ minWidth: 0 }}>
        <p className="info-row__label">{label}</p>
        {href ? (
          <a className="link-quiet info-row__value" href={href}>
            {value}
          </a>
        ) : (
          <p className="info-row__value">{value}</p>
        )}
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <>
      <PageHead
        backLink={
          <Link className="btn btn--ghost btn--sm" to="/leads" style={{ marginBottom: 10 }}>
            <IconArrowLeft size={15} />
            Back to leads
          </Link>
        }
      />
      <div className="skeleton-stack" aria-hidden="true">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--line" style={{ width: '40%' }} />
        <div className="skeleton skeleton--block" />
        <div className="skeleton skeleton--block" />
      </div>
    </>
  );
}

function LoadErrorLead({ id, message, onRetry }) {
  return (
    <>
      <PageHead
        backLink={
          <Link className="btn btn--ghost btn--sm" to="/leads" style={{ marginBottom: 10 }}>
            <IconArrowLeft size={15} />
            Back to leads
          </Link>
        }
      />
      <section className="card card--flush" role="alert">
        <div className="load-error">
          <p className="load-error__title">Could not load lead {id}</p>
          <p className="load-error__text">{message}</p>
          <button type="button" className="btn btn--secondary" onClick={onRetry}>
            Try again
          </button>
        </div>
      </section>
    </>
  );
}

function NotFoundLead({ id }) {
  return (
    <>
      <PageHead
        backLink={
          <Link className="btn btn--ghost btn--sm" to="/leads" style={{ marginBottom: 10 }}>
            <IconArrowLeft size={15} />
            Back to leads
          </Link>
        }
      />
      <section className="card card--flush">
        <div className="empty-state">
          <div className="empty-state__art" aria-hidden="true">
            <span className="empty-state__glow" />
            <span className="empty-state__icon">
              <IconUsers size={34} />
            </span>
          </div>
          <h2 className="empty-state__title">Lead not found</h2>
          <p className="empty-state__text">
            No lead matches the reference <strong>{id}</strong>. It may have been removed, or
            the link may be incorrect.
          </p>
          <div className="empty-state__actions">
            <Link className="btn btn--primary" to="/leads">
              Back to all leads
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
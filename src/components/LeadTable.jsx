import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import EmptyState from './EmptyState.jsx';
import StatusBadge from './StatusBadge.jsx';
import { useLeads } from '../context/LeadsContext.jsx';
import { IconCheck, IconEdit, IconEye, IconMore, IconTrash } from './Icons.jsx';
import { LEAD_STATUSES } from '../data/constants.js';
import { formatDate, formatRelative, sourceLabel } from '../utils/format.js';

/** Per-row overflow menu: view, edit, move between statuses, delete. */
function RowActions({ lead }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { openEdit, changeStatus, requestDelete } = useLeads();

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function run(action) {
    setOpen(false);
    action();
  }

  return (
    <div className="action-menu" ref={containerRef}>
      <button
        type="button"
        className="icon-btn icon-btn--ghost"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${lead.name}`}
      >
        <IconMore size={18} />
      </button>

      {open ? (
        <div className="menu" role="menu" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="menu__item"
            role="menuitem"
            onClick={() => run(() => navigate(`/leads/${lead.id}`))}
          >
            <IconEye size={16} />
            View details
          </button>
          <button
            type="button"
            className="menu__item"
            role="menuitem"
            onClick={() => run(() => openEdit(lead))}
          >
            <IconEdit size={16} />
            Edit lead
          </button>

          <span className="menu__sep" aria-hidden="true" />
          <p className="menu__section">Move to</p>
          {LEAD_STATUSES.map((status) => (
            <button
              key={status.value}
              type="button"
              className="menu__item"
              role="menuitem"
              onClick={() => run(() => changeStatus(lead.id, status.value))}
            >
              <span className="menu__check" aria-hidden="true">
                {lead.status === status.value ? <IconCheck size={14} /> : null}
              </span>
              {status.label}
            </button>
          ))}

          <span className="menu__sep" aria-hidden="true" />
          <button
            type="button"
            className="menu__item menu__item--danger"
            role="menuitem"
            onClick={() => run(() => requestDelete(lead))}
          >
            <IconTrash size={16} />
            Delete lead
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Reusable leads table.
 *
 * @param {object[]} leads
 * @param {'full'|'compact'} variant  'compact' drops the email column for
 *                                    dashboard summaries.
 */
export default function LeadTable({ leads, variant = 'full', onAddLead, onResetFilters }) {
  const navigate = useNavigate();
  const isCompact = variant === 'compact';

  if (leads.length === 0) {
    return (
      <EmptyState
        variant={isCompact ? 'no-leads' : 'no-results'}
        onAddLead={onAddLead}
        onReset={onResetFilters}
      />
    );
  }

  return (
    <div className="table-wrap table-wrap--responsive">
      <table className="data-table">
        <caption className="sr-only">
          Leads list with name, company, contact details, source, status and date created
        </caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Company</th>
            {isCompact ? null : <th scope="col">Email</th>}
            <th scope="col">Source</th>
            <th scope="col">Status</th>
            <th scope="col">Created</th>
            <th scope="col" className="col-actions">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="row-link" onClick={() => navigate(`/leads/${lead.id}`)}>
              <td data-label="Name" className="col-lead">
                <div className="cell-person">
                  <Avatar name={lead.name} />
                  <span className="truncate">
                    <span className="cell-person__name truncate">{lead.name}</span>
                    <span className="cell-person__mail truncate">
                      {isCompact ? lead.id : lead.email}
                    </span>
                  </span>
                </div>
              </td>

              <td data-label="Company">
                <span className="link-quiet">{lead.company || '—'}</span>
              </td>

              {isCompact ? null : (
                <td data-label="Email" className="truncate">
                  {lead.email}
                </td>
              )}

              <td data-label="Source">
                <span className="pill">{sourceLabel(lead.source)}</span>
              </td>

              <td data-label="Status">
                <StatusBadge status={lead.status} />
              </td>

              <td data-label="Created" className="data-table__num">
                {isCompact ? formatRelative(lead.createdAt) : formatDate(lead.createdAt)}
              </td>

              <td data-label="" className="col-actions">
                <RowActions lead={lead} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
import { IconInbox, IconPlus, IconSearch } from './Icons.jsx';

/**
 * Shared empty state. `variant` switches the artwork and default copy between
 * "no leads yet" and "no results for this search".
 */
export default function EmptyState({
  variant = 'no-leads',
  title,
  description,
  onAddLead,
  onReset,
  action,
}) {
  const isFiltered = variant === 'no-results';

  const copy = {
    'no-leads': {
      title: 'No leads yet',
      description:
        'Once you add your first lead it will appear here, ready to move through your pipeline.',
    },
    'no-results': {
      title: 'No leads found',
      description:
        'No leads match your search or filters. Try a different name, company or email, or clear the filters.',
    },
  }[variant];

  return (
    <div className="empty-state">
      <div className="empty-state__art" aria-hidden="true">
        <span className="empty-state__glow" />
        <span className="empty-state__icon">
          {isFiltered ? <IconSearch size={34} /> : <IconInbox size={34} />}
        </span>
      </div>

      <h3 className="empty-state__title">{title ?? copy.title}</h3>
      <p className="empty-state__text">{description ?? copy.description}</p>

      <div className="empty-state__actions">
        {isFiltered ? (
          <>
            <button type="button" className="btn btn--secondary" onClick={onReset}>
              Clear filters
            </button>
            {onAddLead ? (
              <button type="button" className="btn btn--primary" onClick={onAddLead}>
                <IconPlus size={16} />
                Add Lead
              </button>
            ) : null}
          </>
        ) : (
          (action ?? (
            <button type="button" className="btn btn--primary" onClick={onAddLead}>
              <IconPlus size={16} />
              Add your first lead
            </button>
          ))
        )}
      </div>

      <p className="empty-state__hint">
        {isFiltered
          ? 'Search and filters are applied on the server, to all your leads.'
          : 'Leads are stored in your workspace and synced to the LeadTrack API.'}
      </p>
    </div>
  );
}

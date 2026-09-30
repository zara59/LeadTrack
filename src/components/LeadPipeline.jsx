import { Link } from 'react-router-dom';

/**
 * Funnel visualisation: New → Contacted → Qualified → Won/Lost.
 * Counts come from the live lead state. Each stage links to the Leads page
 * pre-filtered by that status.
 */
export default function LeadPipeline({ stages, outcomes, total }) {
  const scale = Math.max(...stages.map((stage) => stage.count), 1);
  const maxOutcome = Math.max(...outcomes.map((outcome) => outcome.count), 1);

  return (
    <div className="pipeline">
      {stages.map((stage, index) => (
        <StageRow
          key={stage.value}
          stage={stage}
          index={index}
          width={`${Math.max(6, (stage.count / scale) * 100)}%`}
          pct={total ? Math.round((stage.count / total) * 100) : 0}
        />
      ))}

      <div className="pipeline__divider">Outcomes</div>

      {outcomes.map((outcome) => (
        <StageRow
          key={outcome.value}
          stage={outcome}
          width={`${Math.max(6, (outcome.count / maxOutcome) * 100)}%`}
          pct={total ? Math.round((outcome.count / total) * 100) : 0}
          isOutcome
        />
      ))}
    </div>
  );
}

function StageRow({ stage, index, width, pct, isOutcome }) {
  const className = [
    'pipeline__stage',
    isOutcome ? 'pipeline__stage--outcomes' : '',
    'pipeline__stage--link',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <div className="pipeline__stage-label">
        <span className="pipeline__stage-index" aria-hidden="true">
          {isOutcome ? (stage.value === 'won' ? '✓' : '✕') : index + 1}
        </span>
        <span className="truncate">{stage.label}</span>
      </div>

      <div
        className="pipeline__bar-track"
        role="img"
        aria-label={`${stage.label}: ${stage.count} leads`}
      >
        <div
          className={`pipeline__bar-fill${
            isOutcome ? ` pipeline__bar-fill--${stage.tone}` : ''
          }`}
          style={{ width }}
        />
      </div>

      <div className="pipeline__value">
        <span className="pipeline__count">{stage.count}</span>
        <span className="pipeline__pct">{pct}%</span>
      </div>
    </>
  );

  return (
    <Link
      to={`/leads?status=${stage.value}`}
      className={className}
      title={`Show ${stage.label.toLowerCase()} leads`}
      onClick={(event) => event.stopPropagation()}
    >
      {content}
    </Link>
  );
}
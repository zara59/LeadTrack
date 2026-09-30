import { IconTrendUp } from './Icons.jsx';

/** CSS-only bar sparkline — no charting library, no data visualisation dep. */
function Sparkline({ values = [] }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);

  return (
    <div className="sparkline" aria-hidden="true">
      {values.map((value, index) => {
        const isPeak = index === values.length - 1;
        const height = Math.max(12, Math.round((value / max) * 100));

        return (
          <span
            key={index}
            className={`sparkline__bar${isPeak ? ' sparkline__bar--peak' : ''}`}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

/**
 * Dashboard metric card.
 * @param {string} label      metric name
 * @param {string|number} value formatted metric value
 * @param {string} icon       icon component reference
 * @param {number} [delta]    percentage change vs. last period
 * @param {string} [deltaLabel]
 * @param {number[]} [spark]  values for the decorative sparkline
 * @param {string} [hint]     small footnote
 * @param {boolean} [soft]    use the soft icon tile instead of the gradient one
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel = 'vs. last month',
  spark,
  hint,
  soft = false,
}) {
  const trend =
    typeof delta === 'number' ? (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat') : null;

  return (
    <article className="stat-card">
      <div className="stat-card__top">
        {Icon ? (
          <span
            className={`stat-card__icon${soft ? ' stat-card__icon--soft' : ''}`}
            aria-hidden="true"
          >
            <Icon size={18} />
          </span>
        ) : null}
        <h3 className="stat-card__label">{label}</h3>
      </div>

      <p className="stat-card__value">{value}</p>

      <div className="stat-card__foot">
        {trend ? (
          <span className={`delta delta--${trend}`}>
            {trend === 'up' ? <IconTrendUp size={12} /> : null}
            {trend === 'up' ? '+' : ''}
            {delta}%
          </span>
        ) : null}
        <span className="stat-card__hint">{trend ? deltaLabel : hint}</span>
      </div>

      {spark ? <Sparkline values={spark} /> : null}
    </article>
  );
}

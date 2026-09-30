import { Link } from 'react-router-dom';
import { sourceLabel } from '../utils/format.js';

/** Ranked lead sources with proportional bars. Rows link to the filtered list. */
export default function SourceBreakdown({ sources, total }) {
  return (
    <div className="source-list">
      {sources.map((source) => (
        <Link
          key={source.value}
          to={`/leads?source=${source.value}`}
          className="source-row"
          title={`Show ${sourceLabel(source.value)} leads`}
        >
          <div className="source-row__top">
            <span className="source-row__name">{sourceLabel(source.value)}</span>
            <span className="source-row__count">{source.count}</span>
            <span className="source-row__pct">
              {total ? Math.round((source.count / total) * 100) : 0}%
            </span>
          </div>
          <div className="source-row__track">
            <div
              className="source-row__fill"
              style={{ width: `${total ? (source.count / total) * 100 : 0}%` }}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
import { statusMeta } from '../utils/format.js';

/** Soft coloured pill for a lead status (new / contacted / qualified / won / lost). */
export default function StatusBadge({ status, className = '' }) {
  const meta = statusMeta(status);

  return (
    <span className={`badge badge--${meta.tone} ${className}`.trim()}>
      <span className="badge__dot" />
      {meta.label}
    </span>
  );
}

import { LEAD_STATUSES } from '../data/constants.js';

/** Compact status picker used on the lead details page. */
export default function StatusSelect({ value, onChange, id, disabled }) {
  return (
    <select
      id={id}
      className="select select--status"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      aria-label="Change lead status"
    >
      {LEAD_STATUSES.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  );
}
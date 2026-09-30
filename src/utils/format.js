/** Small presentational helpers shared across LeadTrack pages. */
import { LEAD_SOURCES, LEAD_STATUSES } from '../data/constants.js';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Normalise a YYYY-MM-DD string or full ISO date-time to a local day-start Date. */
function toLocalDayStart(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** "2026-09-24" or full ISO datetime -> "24 Sep 2026" */
export function formatDate(value) {
  const date = toLocalDayStart(value);
  if (!date) return '—';
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Full ISO datetime -> "24 Sep 2026, 14:32" (falls back to date-only input). */
export function formatDateTime(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDate(value);
  }
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '—';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatDate(value)}, ${hours}:${minutes}`;
}

/** Date-like value -> "today" / "3 days ago" style relative label. */
export function formatRelative(value, now = new Date()) {
  const date = toLocalDayStart(value);
  if (!date) return '—';
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - date) / 86400000);

  if (days <= 1) {
    return days <= 0 ? 'today' : 'yesterday';
  }
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return formatDate(value);
}

export function formatCurrency(value) {
  if (typeof value !== 'number') return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function statusMeta(value) {
  return (
    LEAD_STATUSES.find((status) => status.value === value) ?? {
      value,
      label: value,
      tone: 'neutral',
    }
  );
}

export function statusLabel(value) {
  return statusMeta(value).label;
}

export function sourceLabel(value) {
  return LEAD_SOURCES.find((source) => source.value === value)?.label ?? value;
}
import { initials } from '../utils/format.js';

/** Circular avatar. `tinted` gives the soft gradient-outline treatment. */
export default function Avatar({ name, size = 'sm', tinted = false, className = '' }) {
  const classes = [
    'avatar',
    `avatar--${size}`,
    tinted ? 'avatar--tinted' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

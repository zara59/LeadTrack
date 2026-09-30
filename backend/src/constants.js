/**
 * Lead lifecycle vocabulary — mirrors the frontend
 * (src/data/constants.js) so the API accepts the exact values the UI uses.
 */

export const STATUS_VALUES = ['new', 'contacted', 'qualified', 'won', 'lost'];

export const SOURCE_VALUES = [
  'website',
  'referral',
  'linkedin',
  'upwork',
  'fiverr',
  'social_media',
  'other',
];

export const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};

export const SOURCE_LABELS = {
  website: 'Website',
  referral: 'Referral',
  linkedin: 'LinkedIn',
  upwork: 'Upwork',
  fiverr: 'Fiverr',
  social_media: 'Social Media',
  other: 'Other',
};
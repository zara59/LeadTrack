/**
 * Lead lifecycle vocabulary for LeadTrack.
 * These lists drive dropdowns, badges, filters and the pipeline.
 */

export const STATUS_VALUES = ['new', 'contacted', 'qualified', 'won', 'lost'];

export const LEAD_STATUSES = [
  { value: 'new', label: 'New', tone: 'new' },
  { value: 'contacted', label: 'Contacted', tone: 'contacted' },
  { value: 'qualified', label: 'Qualified', tone: 'qualified' },
  { value: 'won', label: 'Won', tone: 'won' },
  { value: 'lost', label: 'Lost', tone: 'lost' },
];

export const SOURCE_VALUES = ['website', 'referral', 'linkedin', 'upwork', 'fiverr', 'social_media', 'other'];

export const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'upwork', label: 'Upwork' },
  { value: 'fiverr', label: 'Fiverr' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'other', label: 'Other' },
];

/** Ordered funnel used by the dashboard pipeline visualisation. */
export const PIPELINE_STAGES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
];

export const PIPELINE_OUTCOMES = [
  { value: 'won', label: 'Won', tone: 'won' },
  { value: 'lost', label: 'Lost', tone: 'lost' },
];
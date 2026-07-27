export const REMOTE_LABELS = {
  onsite: 'On-site',
  hybrid: 'Hybrid',
  remote: 'Remote',
};

export const EMPLOYMENT_LABELS = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
};

export const STAGE_LABELS = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Not selected',
};

export const STAGE_ORDER = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

export function formatSalary({ salaryMin, salaryMax, currency = 'USD' }) {
  if (salaryMin == null && salaryMax == null) return null;

  const money = (value) =>
    new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  if (salaryMin != null && salaryMax != null) return `${money(salaryMin)} – ${money(salaryMax)}`;
  return salaryMin != null ? `From ${money(salaryMin)}` : `Up to ${money(salaryMax)}`;
}

export function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

const RELATIVE_UNITS = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

export function formatRelative(value) {
  if (!value) return '';

  const diff = Date.now() - new Date(value).getTime();
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  for (const [unit, ms] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms) return formatter.format(-Math.round(diff / ms), unit);
  }
  return 'just now';
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

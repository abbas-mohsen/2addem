/* Pure data and locale-parameterised formatters. Components should reach for
   useFormat(), which binds these to the active locale and dictionary. */

export const STAGE_ORDER = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

export const REMOTE_TYPES = ['onsite', 'hybrid', 'remote'];

export const EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'contract',
  'internship',
  'freelance',
];

export const INTERVIEW_FORMATS = ['video', 'phone', 'onsite'];

export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

export function formatSalary({ salaryMin, salaryMax, currency = 'USD', freshUsd = false }, ctx) {
  if (salaryMin == null && salaryMax == null) return null;

  const { locale = 'en', t } = ctx ?? {};

  const money = (value) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  const range =
    salaryMin != null && salaryMax != null
      ? `${money(salaryMin)} – ${money(salaryMax)}`
      : salaryMin != null
        ? t('jobs.salaryFrom', { amount: money(salaryMin) })
        : t('jobs.salaryUpTo', { amount: money(salaryMax) });

  /* "Fresh" is the local term for dollars paid outside the domestic banking
     system. On a Lebanese board, omitting it makes a figure ambiguous. */
  return freshUsd && (currency ?? 'USD') === 'USD' ? `${range} ${t('jobs.fresh')}` : range;
}

export function formatDate(value, locale = 'en') {
  if (!value) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}

export function formatDateTime(value, locale = 'en') {
  if (!value) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
}

const RELATIVE_UNITS = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

export function formatRelative(value, locale = 'en') {
  if (!value) return '';

  const diff = Date.now() - new Date(value).getTime();
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  for (const [unit, ms] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms) return formatter.format(-Math.round(diff / ms), unit);
  }

  return formatter.format(0, 'second');
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

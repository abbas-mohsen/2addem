import { useMemo } from 'react';
import { useI18n } from '../i18n/index.jsx';
import {
  formatDate,
  formatDateTime,
  formatRelative,
  formatSalary,
} from '../lib/format.js';

/* Binds the pure formatters in lib/format.js to the active locale, and turns
   enum values into translated labels. One hook so components never have to
   thread the locale through by hand. */
export function useFormat() {
  const { t, locale } = useI18n();

  return useMemo(
    () => ({
      stage: (value) => t(`stages.${value}`),
      remote: (value) => t(`remote.${value}`),
      employment: (value) => t(`employment.${value}`),
      interviewFormat: (value) => t(`interviewFormat.${value}`),
      jobStatus: (value) => t(`jobStatus.${value}`),
      salary: (job) => formatSalary(job, { locale, t }),
      date: (value) => formatDate(value, locale),
      dateTime: (value) => formatDateTime(value, locale),
      relative: (value) => formatRelative(value, locale),
    }),
    [t, locale]
  );
}

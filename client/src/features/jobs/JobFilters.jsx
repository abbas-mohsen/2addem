import { Search, X } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { EMPLOYMENT_TYPES, REMOTE_TYPES } from '../../lib/format.js';
import { useFormat } from '../../hooks/useFormat.js';
import { useT } from '../../i18n/index.jsx';
import { useLocationSuggestions } from '../../hooks/useLocationSuggestions.js';

export function JobFilters({ draft, onDraftChange, onSubmit, onReset, activeCount }) {
  const set = (key) => (event) => onDraftChange({ ...draft, [key]: event.target.value });
  const t = useT();
  const format = useFormat();
  const { data: locations = [] } = useLocationSuggestions();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="border-ink-200 rounded-card shadow-card space-y-3 border bg-white p-4"
    >
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
        <div className="relative">
          <Search
            className="text-ink-400 pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            className="ps-9"
            placeholder={t('jobs.searchPlaceholder')}
            aria-label={t('landing.searchJobs')}
            value={draft.q}
            onChange={set('q')}
          />
        </div>

        <>
          <Input
            type="search"
            list="location-suggestions"
            placeholder={t('jobs.locationPlaceholder')}
            aria-label={t('editor.location')}
            value={draft.location}
            onChange={set('location')}
          />
          <datalist id="location-suggestions">
            {locations.map((location) => (
              <option key={location} value={location} />
            ))}
          </datalist>
        </>

        <Button type="submit" className="md:w-auto">
          {t('common.search')}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select aria-label={t('editor.workModel')} value={draft.remote} onChange={set('remote')}>
          <option value="">{t('jobs.anyWorkModel')}</option>
          {REMOTE_TYPES.map((value) => (
            <option key={value} value={value}>
              {format.remote(value)}
            </option>
          ))}
        </Select>

        <Select
          aria-label={t('editor.employmentType')}
          value={draft.employmentType}
          onChange={set('employmentType')}
        >
          <option value="">{t('jobs.anyEmploymentType')}</option>
          {EMPLOYMENT_TYPES.map((value) => (
            <option key={value} value={value}>
              {format.employment(value)}
            </option>
          ))}
        </Select>

        <Input
          type="number"
          min="0"
          step="any"
          placeholder={t('jobs.minimumSalary')}
          aria-label={t('jobs.minimumSalary')}
          value={draft.salaryMin}
          onChange={set('salaryMin')}
        />

        <Select aria-label={t('jobs.sortBy')} value={draft.sort} onChange={set('sort')}>
          <option value="newest">{t('jobs.sortNewest')}</option>
          <option value="oldest">{t('jobs.sortOldest')}</option>
          <option value="salary">{t('jobs.sortSalary')}</option>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* The filter candidates here ask for most often. */}
        <label className="text-ink-700 inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="border-ink-300 text-brand-600 focus:ring-brand-200 size-4 rounded"
            checked={draft.remoteAbroad === 'true'}
            onChange={(event) =>
              onDraftChange({ ...draft, remoteAbroad: event.target.checked ? 'true' : '' })
            }
          />
          {t('jobs.remoteAbroad')}
        </label>

        {activeCount > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            <X className="size-4" aria-hidden="true" />
            {t('jobs.clearFilters', { count: activeCount })}
          </Button>
        )}
      </div>
    </form>
  );
}

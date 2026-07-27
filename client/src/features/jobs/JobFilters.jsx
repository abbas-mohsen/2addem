import { Search, X } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { EMPLOYMENT_LABELS, REMOTE_LABELS } from '../../lib/format.js';
import { useLocationSuggestions } from '../../hooks/useLocationSuggestions.js';

export function JobFilters({ draft, onDraftChange, onSubmit, onReset, activeCount }) {
  const set = (key) => (event) => onDraftChange({ ...draft, [key]: event.target.value });
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
            className="text-ink-400 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            className="pl-9"
            placeholder="Job title, skill or keyword"
            aria-label="Search jobs"
            value={draft.q}
            onChange={set('q')}
          />
        </div>

        <>
          <Input
            type="search"
            list="location-suggestions"
            placeholder="City or governorate"
            aria-label="Location"
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
          Search
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select aria-label="Work model" value={draft.remote} onChange={set('remote')}>
          <option value="">Any work model</option>
          {Object.entries(REMOTE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Employment type"
          value={draft.employmentType}
          onChange={set('employmentType')}
        >
          <option value="">Any employment type</option>
          {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Input
          type="number"
          min="0"
          step="any"
          placeholder="Minimum salary"
          aria-label="Minimum salary"
          value={draft.salaryMin}
          onChange={set('salaryMin')}
        />

        <Select aria-label="Sort by" value={draft.sort} onChange={set('sort')}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="salary">Highest salary</option>
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
          Remote for a company abroad
        </label>

        {activeCount > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            <X className="size-4" aria-hidden="true" />
            Clear {activeCount} filter{activeCount === 1 ? '' : 's'}
          </Button>
        )}
      </div>
    </form>
  );
}

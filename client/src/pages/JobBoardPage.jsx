import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SearchX } from 'lucide-react';
import { jobsApi } from '../api/endpoints.js';
import { errorMessage } from '../api/client.js';
import { Container, PageHeader } from '../components/layout/AppLayout.jsx';
import { EmptyState, ErrorState } from '../components/ui/States.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { JobCard, JobCardSkeleton } from '../features/jobs/JobCard.jsx';
import { JobFilters } from '../features/jobs/JobFilters.jsx';
import { useT } from '../i18n/index.jsx';

const EMPTY_FILTERS = {
  q: '',
  location: '',
  remote: '',
  remoteAbroad: '',
  employmentType: '',
  salaryMin: '',
  sort: 'newest',
};

/* The URL is the single source of truth for the search, so a filtered board can
   be shared or reloaded and come back identical. */
function readFilters(searchParams) {
  return Object.fromEntries(
    Object.entries(EMPTY_FILTERS).map(([key, fallback]) => [key, searchParams.get(key) ?? fallback])
  );
}

export function JobBoardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const page = Number(searchParams.get('page') ?? 1);

  const [draft, setDraft] = useState(filters);
  const t = useT();

  const activeCount = useMemo(
    () =>
      Object.entries(filters).filter(([key, value]) => value && value !== EMPTY_FILTERS[key]).length,
    [filters]
  );

  const query = useQuery({
    queryKey: ['jobs', filters, page],
    queryFn: () =>
      jobsApi.list({
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')),
        page,
        limit: 12,
      }),
    placeholderData: (previous) => previous,
  });

  const commit = (next, nextPage = 1) => {
    const params = Object.entries({ ...next, page: nextPage }).filter(
      ([key, value]) => value !== '' && !(key === 'page' && value === 1) && value !== EMPTY_FILTERS[key]
    );
    setSearchParams(Object.fromEntries(params));
  };

  const jobs = query.data?.items ?? [];

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader title={t('jobs.openRoles')} description={t('jobs.boardSubtitle')} />

      <div className="mt-6">
        <JobFilters
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={() => commit(draft)}
          onReset={() => {
            setDraft(EMPTY_FILTERS);
            commit(EMPTY_FILTERS);
          }}
          activeCount={activeCount}
        />
      </div>

      <div className="mt-6 space-y-4">
        {query.isPending && (
          <>
            {Array.from({ length: 4 }, (_, index) => (
              <JobCardSkeleton key={index} />
            ))}
          </>
        )}

        {query.isError && (
          <ErrorState
            title={t('jobs.couldNotLoadBoard')}
            message={errorMessage(query.error)}
            onRetry={query.refetch}
          />
        )}

        {query.isSuccess && jobs.length === 0 && (
          <EmptyState
            icon={SearchX}
            title={t('jobs.noMatches')}
            message={t('jobs.noMatchesHint')}
          />
        )}

        {jobs.map((job) => (
          <JobCard key={job._id} job={job} />
        ))}

        <Pagination meta={query.data?.meta} onPageChange={(next) => commit(filters, next)} />
      </div>
    </Container>
  );
}

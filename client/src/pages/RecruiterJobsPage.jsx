import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, PenLine, Plus, Users } from 'lucide-react';
import { jobsApi } from '../api/endpoints.js';
import { errorMessage } from '../api/client.js';
import { useAuthStore } from '../context/authStore.js';
import { Container, PageHeader } from '../components/layout/AppLayout.jsx';
import { Badge, JOB_STATUS_TONES } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState } from '../components/ui/States.jsx';
import { ListRowsSkeleton } from '../components/ui/Skeletons.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';

import { cn } from '../lib/cn.js';
import { useFormat } from '../hooks/useFormat.js';
import { useT } from '../i18n/index.jsx';

const TABS = [
  { value: '', key: 'recruiter.tabAll' },
  { value: 'published', key: 'recruiter.tabPublished' },
  { value: 'draft', key: 'recruiter.tabDrafts' },
  { value: 'closed', key: 'recruiter.tabClosed' },
];

export function RecruiterJobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const page = Number(searchParams.get('page') ?? 1);

  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const t = useT();
  const format = useFormat();

  const query = useQuery({
    queryKey: ['my-jobs', status, page],
    queryFn: () => jobsApi.mine({ ...(status ? { status } : {}), page, limit: 20 }),
    placeholderData: (previous) => previous,
  });

  const setStatus = useMutation({
    mutationFn: jobsApi.setStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-jobs'] }),
  });

  const jobs = query.data?.items ?? [];
  const stats = useSummary(jobs);

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        title={t('recruiter.yourJobs')}
        description={
          user?.company?.name
            ? t('recruiter.yourJobsSubtitle', { company: user.company.name })
            : t('recruiter.yourJobsSubtitleGeneric')
        }
        actions={
          <Button to="/recruiter/jobs/new">
            <Plus className="size-4" aria-hidden="true" />
            {t('recruiter.newJob')}
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t('recruiter.jobsOnPage')} value={stats.total} />
        <StatCard label={t('recruiter.tabPublished')} value={stats.published} />
        <StatCard label={t('recruiter.applicantsStat')} value={stats.applicants} />
      </div>

      <div className="border-ink-200 mt-8 flex gap-1 border-b" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => setSearchParams(tab.value ? { status: tab.value } : {})}
            className={cn(
              '-mb-px border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
              status === tab.value
                ? 'border-brand-600 text-brand-700'
                : 'text-ink-500 hover:text-ink-900 border-transparent'
            )}
          >
            {t(tab.key)}
          </button>
        ))}
      </div>

      {setStatus.isError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage(setStatus.error, t('recruiter.updateFailed'))}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {query.isPending && <ListRowsSkeleton count={3} />}

        {query.isError && (
          <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
        )}

        {query.isSuccess && jobs.length === 0 && (
          <EmptyState
            icon={Plus}
            title={
              status
                ? t('recruiter.noJobsOfStatus', { status: format.jobStatus(status) })
                : t('recruiter.noJobsYet')
            }
            message={t('recruiter.noJobsHint')}
            action={<Button to="/recruiter/jobs/new">{t('recruiter.createJob')}</Button>}
          />
        )}

        {jobs.map((job) => (
          <JobRow
            key={job._id}
            job={job}
            onStatusChange={(next) => setStatus.mutate({ id: job._id, status: next })}
            updating={setStatus.isPending && setStatus.variables?.id === job._id}
          />
        ))}

        <Pagination
          meta={query.data?.meta}
          onPageChange={(next) =>
            setSearchParams({ ...(status ? { status } : {}), ...(next > 1 ? { page: String(next) } : {}) })
          }
        />
      </div>
    </Container>
  );
}

function useSummary(jobs) {
  return {
    total: jobs.length,
    published: jobs.filter((job) => job.status === 'published').length,
    applicants: jobs.reduce((sum, job) => sum + (job.applicationCount ?? 0), 0),
  };
}

function StatCard({ label, value }) {
  return (
    <div className="border-ink-200 rounded-card border bg-white p-5">
      <p className="text-ink-500 text-sm">{label}</p>
      <p className="text-ink-900 mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function JobRow({ job, onStatusChange, updating }) {
  const format = useFormat();
  const t = useT();
  return (
    <article className="border-ink-200 rounded-card shadow-card border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-semibold">
              <Link to={`/recruiter/jobs/${job._id}/pipeline`} className="hover:text-brand-700">
                {job.title}
              </Link>
            </h2>
            <Badge tone={JOB_STATUS_TONES[job.status]}>{format.jobStatus(job.status)}</Badge>
          </div>

          <p className="text-ink-500 mt-1 text-sm">
            {job.location || format.remote(job.remote)} · {format.employment(job.employmentType)} ·{' '}
            {job.status === 'published' && job.publishedAt
              ? t('recruiter.publishedRelative', { when: format.relative(job.publishedAt) })
              : t('recruiter.createdRelative', { when: format.relative(job.createdAt) })}
          </p>

          <div className="text-ink-500 mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" aria-hidden="true" />
              {t('common.applicants', { count: job.applicationCount })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5" aria-hidden="true" />
              {t('common.views', { count: job.views })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" to={`/recruiter/jobs/${job._id}/pipeline`}>
            {t('recruiter.pipeline')}
          </Button>
          <Button variant="outline" size="sm" to={`/recruiter/jobs/${job._id}/edit`}>
            <PenLine className="size-4" aria-hidden="true" />
            {t('recruiter.edit')}
          </Button>

          {job.status === 'published' ? (
            <Button variant="ghost" size="sm" loading={updating} onClick={() => onStatusChange('closed')}>
              {t('recruiter.close')}
            </Button>
          ) : (
            <Button size="sm" loading={updating} onClick={() => onStatusChange('published')}>
              {job.status === 'draft' ? t('recruiter.publish') : t('recruiter.reopen')}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

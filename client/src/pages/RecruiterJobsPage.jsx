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
import { EMPLOYMENT_LABELS, REMOTE_LABELS, formatRelative } from '../lib/format.js';
import { cn } from '../lib/cn.js';

const TABS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'closed', label: 'Closed' },
];

export function RecruiterJobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const page = Number(searchParams.get('page') ?? 1);

  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

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
        title="Your jobs"
        description={
          user?.company?.name
            ? `Roles posted by ${user.company.name}.`
            : 'Roles posted by your company.'
        }
        actions={
          <Button to="/recruiter/jobs/new">
            <Plus className="size-4" aria-hidden="true" />
            New job
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Jobs on this page" value={stats.total} />
        <StatCard label="Published" value={stats.published} />
        <StatCard label="Applicants" value={stats.applicants} />
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
            {tab.label}
          </button>
        ))}
      </div>

      {setStatus.isError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage(setStatus.error, 'Could not update that job.')}
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
            title={status ? `No ${status} jobs` : 'No jobs yet'}
            message="Create your first role and publish it to the board when it is ready."
            action={<Button to="/recruiter/jobs/new">Create a job</Button>}
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
            <Badge tone={JOB_STATUS_TONES[job.status]} className="capitalize">
              {job.status}
            </Badge>
          </div>

          <p className="text-ink-500 mt-1 text-sm">
            {job.location || REMOTE_LABELS[job.remote]} · {EMPLOYMENT_LABELS[job.employmentType]} ·{' '}
            {job.status === 'published' && job.publishedAt
              ? `published ${formatRelative(job.publishedAt)}`
              : `created ${formatRelative(job.createdAt)}`}
          </p>

          <div className="text-ink-500 mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" aria-hidden="true" />
              {job.applicationCount} applicant{job.applicationCount === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5" aria-hidden="true" />
              {job.views} view{job.views === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" to={`/recruiter/jobs/${job._id}/pipeline`}>
            Pipeline
          </Button>
          <Button variant="outline" size="sm" to={`/recruiter/jobs/${job._id}/edit`}>
            <PenLine className="size-4" aria-hidden="true" />
            Edit
          </Button>

          {job.status === 'published' ? (
            <Button variant="ghost" size="sm" loading={updating} onClick={() => onStatusChange('closed')}>
              Close
            </Button>
          ) : (
            <Button size="sm" loading={updating} onClick={() => onStatusChange('published')}>
              {job.status === 'draft' ? 'Publish' : 'Reopen'}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

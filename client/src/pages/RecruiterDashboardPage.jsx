import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Eye, Plus, TrendingUp, Users } from 'lucide-react';
import { companiesApi } from '../api/endpoints.js';
import { errorMessage } from '../api/client.js';
import { useAuthStore } from '../context/authStore.js';
import { Container, PageHeader } from '../components/layout/AppLayout.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States.jsx';
import { STAGE_LABELS, STAGE_ORDER } from '../lib/format.js';
import { cn } from '../lib/cn.js';

const STAGE_BARS = {
  applied: 'bg-ink-300',
  screening: 'bg-brand-400',
  interview: 'bg-amber-400',
  offer: 'bg-emerald-400',
  hired: 'bg-emerald-600',
  rejected: 'bg-red-300',
};

export function RecruiterDashboardPage() {
  const user = useAuthStore((state) => state.user);

  const query = useQuery({
    queryKey: ['company-stats'],
    queryFn: companiesApi.stats,
  });

  const stats = query.data?.stats;

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        title={`Hiring at ${user?.company?.name ?? 'your company'}`}
        description="How your open roles are performing and where your candidates are sitting."
        actions={
          <>
            <Button variant="outline" to="/recruiter/company">
              Company profile
            </Button>
            <Button to="/recruiter/jobs/new">
              <Plus className="size-4" aria-hidden="true" />
              New job
            </Button>
          </>
        }
      />

      {query.isError && (
        <ErrorState
          className="mt-8"
          message={errorMessage(query.error)}
          onRetry={query.refetch}
        />
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Briefcase}
          label="Published jobs"
          value={stats?.jobs.published}
          hint={stats ? `${stats.jobs.draft} draft · ${stats.jobs.closed} closed` : null}
          loading={query.isPending}
        />
        <StatCard
          icon={Users}
          label="Applicants"
          value={stats?.applications.total}
          hint={stats ? `${stats.applications.last7Days} in the last 7 days` : null}
          loading={query.isPending}
        />
        <StatCard
          icon={Eye}
          label="Job views"
          value={stats?.views}
          loading={query.isPending}
        />
        <StatCard
          icon={TrendingUp}
          label="View to apply"
          value={stats ? `${Math.round(stats.conversionRate * 100)}%` : undefined}
          hint="Applications per job view"
          loading={query.isPending}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="border-ink-200 rounded-card shadow-card border bg-white p-5">
          <h2 className="text-base font-semibold">Candidates by stage</h2>
          <p className="text-ink-500 mt-0.5 text-sm">Active applications across every open role.</p>

          {query.isPending ? (
            <div className="mt-5 space-y-3">
              {STAGE_ORDER.map((stage) => (
                <Skeleton key={stage} className="h-6" />
              ))}
            </div>
          ) : stats?.applications.active === 0 ? (
            <p className="text-ink-400 mt-6 text-sm">
              No active candidates yet. They will show up here as people apply.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {STAGE_ORDER.map((stage) => {
                const count = stats?.applications.byStage[stage] ?? 0;
                const max = Math.max(1, ...Object.values(stats?.applications.byStage ?? {}));
                return (
                  <li key={stage} className="flex items-center gap-3">
                    <span className="text-ink-600 w-24 shrink-0 text-sm">
                      {STAGE_LABELS[stage]}
                    </span>
                    <span className="bg-ink-100 h-2.5 flex-1 overflow-hidden rounded-full">
                      <span
                        className={cn('block h-full rounded-full', STAGE_BARS[stage])}
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </span>
                    <span className="text-ink-900 w-7 text-right text-sm font-medium tabular-nums">
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="border-ink-200 rounded-card shadow-card border bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Busiest roles</h2>
            <Link to="/recruiter/jobs" className="text-brand-700 text-sm font-medium hover:underline">
              All jobs
            </Link>
          </div>

          {query.isPending ? (
            <div className="mt-5 space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : stats?.topJobs.length ? (
            <ul className="mt-4 divide-y divide-ink-100">
              {stats.topJobs.map((job) => (
                <li key={job._id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link
                      to={`/recruiter/jobs/${job._id}/pipeline`}
                      className="hover:text-brand-700 block truncate text-sm font-medium"
                    >
                      {job.title}
                    </Link>
                    <p className="text-ink-500 mt-0.5 text-xs">{job.views} views</p>
                  </div>
                  <span className="text-ink-900 shrink-0 text-sm font-semibold tabular-nums">
                    {job.applicationCount}
                    <span className="text-ink-400 ml-1 font-normal">
                      applicant{job.applicationCount === 1 ? '' : 's'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              className="mt-4 border-0 py-8"
              icon={Briefcase}
              title="Nothing published yet"
              message="Publish a role and it will start collecting applicants."
              action={<Button size="sm" to="/recruiter/jobs/new">Create a job</Button>}
            />
          )}
        </section>
      </div>
    </Container>
  );
}

function StatCard({ icon: Icon, label, value, hint, loading }) {
  return (
    <div className="border-ink-200 rounded-card shadow-card border bg-white p-5">
      <div className="flex items-center gap-2">
        <Icon className="text-ink-400 size-4" aria-hidden="true" />
        <p className="text-ink-500 text-sm">{label}</p>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className="text-ink-900 mt-1.5 text-2xl font-semibold tabular-nums">{value ?? 0}</p>
      )}
      {hint && !loading && <p className="text-ink-400 mt-1 text-xs">{hint}</p>}
    </div>
  );
}

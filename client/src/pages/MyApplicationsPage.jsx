import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileSearch } from 'lucide-react';
import { applicationsApi } from '../api/endpoints.js';
import { errorMessage } from '../api/client.js';
import { Container, PageHeader } from '../components/layout/AppLayout.jsx';
import { Badge, STAGE_TONES } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { CompanyLogo } from '../components/ui/Logo.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { STAGE_LABELS, STAGE_ORDER, formatRelative } from '../lib/format.js';
import { cn } from '../lib/cn.js';

export function MyApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1);
  const justApplied = searchParams.get('applied') === '1';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['my-applications', page],
    queryFn: () => applicationsApi.mine({ page, limit: 20 }),
    placeholderData: (previous) => previous,
  });

  const withdraw = useMutation({
    mutationFn: applicationsApi.withdraw,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-applications'] }),
  });

  const applications = query.data?.items ?? [];

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        title="My applications"
        description="Every role you have applied to, and exactly where each one stands."
        actions={
          <Button variant="outline" to="/jobs">
            Browse more jobs
          </Button>
        }
      />

      {justApplied && (
        <p className="mt-6 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          Your application was sent. The team will see it in their pipeline.
        </p>
      )}

      {withdraw.isError && (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage(withdraw.error, 'Could not withdraw that application.')}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {query.isPending && <LoadingState label="Loading your applications…" />}

        {query.isError && (
          <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
        )}

        {query.isSuccess && applications.length === 0 && (
          <EmptyState
            icon={FileSearch}
            title="No applications yet"
            message="Once you apply to a role it will show up here, with its current stage."
            action={<Button to="/jobs">Find a role</Button>}
          />
        )}

        {applications.map((application) => (
          <ApplicationRow
            key={application._id}
            application={application}
            onWithdraw={() => withdraw.mutate(application._id)}
            withdrawing={withdraw.isPending && withdraw.variables === application._id}
          />
        ))}

        <Pagination
          meta={query.data?.meta}
          onPageChange={(next) => setSearchParams(next === 1 ? {} : { page: String(next) })}
        />
      </div>
    </Container>
  );
}

function ApplicationRow({ application, onWithdraw, withdrawing }) {
  const { job, stage, status } = application;
  const withdrawn = status === 'withdrawn';
  const decided = ['hired', 'rejected'].includes(stage);

  return (
    <article
      className={cn(
        'border-ink-200 rounded-card shadow-card border bg-white p-5',
        withdrawn && 'opacity-70'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <CompanyLogo company={job?.company} />
          <div className="min-w-0">
            <h2 className="text-base font-semibold">
              {job ? (
                <Link to={`/jobs/${job.slug}`} className="hover:text-brand-700">
                  {job.title}
                </Link>
              ) : (
                'Role removed'
              )}
            </h2>
            <p className="text-ink-500 mt-0.5 text-sm">
              {job?.company?.name} · applied {formatRelative(application.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {withdrawn ? (
            <Badge tone="neutral">Withdrawn</Badge>
          ) : (
            <Badge tone={STAGE_TONES[stage]}>{STAGE_LABELS[stage]}</Badge>
          )}

          {!withdrawn && !decided && (
            <Button variant="ghost" size="sm" onClick={onWithdraw} loading={withdrawing}>
              Withdraw
            </Button>
          )}
        </div>
      </div>

      {!withdrawn && <StageTrack stage={stage} />}
    </article>
  );
}

/* Rejections are terminal, so the ladder is replaced rather than shown greyed. */
function StageTrack({ stage }) {
  if (stage === 'rejected') {
    return (
      <p className="text-ink-500 mt-4 text-sm">
        The team decided not to move forward this time.
      </p>
    );
  }

  const track = STAGE_ORDER.filter((item) => item !== 'rejected');
  const currentIndex = track.indexOf(stage);

  return (
    <ol className="mt-5 flex gap-1.5" aria-label={`Current stage: ${STAGE_LABELS[stage]}`}>
      {track.map((item, index) => (
        <li key={item} className="flex-1">
          <span
            className={cn(
              'block h-1 rounded-full',
              index <= currentIndex ? 'bg-brand-500' : 'bg-ink-200'
            )}
          />
          <span
            className={cn(
              'mt-1.5 block text-xs',
              index === currentIndex ? 'text-ink-900 font-medium' : 'text-ink-400'
            )}
          >
            {STAGE_LABELS[item]}
          </span>
        </li>
      ))}
    </ol>
  );
}

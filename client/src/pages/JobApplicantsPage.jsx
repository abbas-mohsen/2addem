import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Inbox, Mail } from 'lucide-react';
import { applicationsApi, jobsApi } from '../api/endpoints.js';
import { errorMessage } from '../api/client.js';
import { Container, PageHeader } from '../components/layout/AppLayout.jsx';
import { Badge, STAGE_TONES } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Select } from '../components/ui/Field.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States.jsx';
import { STAGE_LABELS, STAGE_ORDER, formatRelative, initials } from '../lib/format.js';
import { cn } from '../lib/cn.js';

export function JobApplicantsPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [stageFilter, setStageFilter] = useState('');

  const job = useQuery({
    queryKey: ['my-job', id],
    queryFn: async () => {
      const { items } = await jobsApi.mine({ limit: 50 });
      return items.find((entry) => entry._id === id) ?? null;
    },
  });

  const applicants = useQuery({
    queryKey: ['applicants', id, stageFilter],
    queryFn: () => jobsApi.applications({ id, ...(stageFilter ? { stage: stageFilter } : {}) }),
    placeholderData: (previous) => previous,
  });

  const setStage = useMutation({
    mutationFn: applicationsApi.setStage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants', id] });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
    },
  });

  const items = applicants.data?.items ?? [];

  return (
    <Container className="py-8 sm:py-12">
      <Link
        to="/recruiter/jobs"
        className="text-ink-500 hover:text-ink-900 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to your jobs
      </Link>

      <div className="mt-5">
        <PageHeader
          title={job.data ? `Applicants — ${job.data.title}` : 'Applicants'}
          description={
            applicants.data?.meta
              ? `${applicants.data.meta.total} application${applicants.data.meta.total === 1 ? '' : 's'} received.`
              : 'Everyone who has applied to this role.'
          }
          actions={
            <Select
              aria-label="Filter by stage"
              className="w-48"
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
            >
              <option value="">All stages</option>
              {STAGE_ORDER.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </Select>
          }
        />
      </div>

      {setStage.isError && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage(setStage.error, 'Could not move that candidate.')}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {applicants.isPending && <LoadingState label="Loading applicants…" />}

        {applicants.isError && (
          <ErrorState message={errorMessage(applicants.error)} onRetry={applicants.refetch} />
        )}

        {applicants.isSuccess && items.length === 0 && (
          <EmptyState
            icon={Inbox}
            title={stageFilter ? 'Nobody in this stage' : 'No applications yet'}
            message={
              stageFilter
                ? 'Move a candidate into this stage and they will appear here.'
                : 'Share the job link — applications will land here as they come in.'
            }
          />
        )}

        {items.map((application) => (
          <ApplicantCard
            key={application._id}
            application={application}
            onStageChange={(stage) => setStage.mutate({ id: application._id, stage })}
            updating={setStage.isPending && setStage.variables?.id === application._id}
          />
        ))}
      </div>
    </Container>
  );
}

function ApplicantCard({ application, onStageChange, updating }) {
  const { candidate } = application;
  const withdrawn = application.status === 'withdrawn';

  return (
    <article
      className={cn(
        'border-ink-200 rounded-card shadow-card border bg-white p-5',
        withdrawn && 'opacity-70'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <span
            className="bg-brand-100 text-brand-700 flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            aria-hidden="true"
          >
            {initials(candidate?.name ?? '?')}
          </span>

          <div className="min-w-0">
            <h2 className="text-base font-semibold">{candidate?.name ?? 'Candidate'}</h2>
            {candidate?.profile?.headline && (
              <p className="text-ink-600 mt-0.5 text-sm">{candidate.profile.headline}</p>
            )}

            <div className="text-ink-500 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {candidate?.email && (
                <a
                  href={`mailto:${candidate.email}`}
                  className="hover:text-brand-700 inline-flex items-center gap-1.5"
                >
                  <Mail className="size-3.5" aria-hidden="true" />
                  {candidate.email}
                </a>
              )}
              <span>Applied {formatRelative(application.createdAt)}</span>
            </div>

            {application.coverLetter && (
              <p className="text-ink-600 mt-3 line-clamp-3 text-sm leading-relaxed">
                {application.coverLetter}
              </p>
            )}

            {application.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {application.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2.5">
          {withdrawn ? (
            <Badge tone="neutral">Withdrawn</Badge>
          ) : (
            <>
              <Badge tone={STAGE_TONES[application.stage]}>
                {STAGE_LABELS[application.stage]}
              </Badge>
              <Select
                aria-label={`Stage for ${candidate?.name ?? 'candidate'}`}
                className="w-40"
                value={application.stage}
                disabled={updating}
                onChange={(event) => onStageChange(event.target.value)}
              >
                {STAGE_ORDER.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGE_LABELS[stage]}
                  </option>
                ))}
              </Select>
            </>
          )}

          <Button
            as="a"
            variant="outline"
            size="sm"
            href={application.resumeUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Download className="size-4" aria-hidden="true" />
            Resume
          </Button>
        </div>
      </div>
    </article>
  );
}

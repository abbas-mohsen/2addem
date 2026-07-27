import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ArrowLeft, Inbox, Users } from 'lucide-react';
import { applicationsApi, jobsApi } from '../api/endpoints.js';
import { errorMessage } from '../api/client.js';
import { Container, PageHeader } from '../components/layout/AppLayout.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState } from '../components/ui/States.jsx';
import { BoardSkeleton, PageHeaderSkeleton } from '../components/ui/Skeletons.jsx';
import { StageColumn } from '../features/pipeline/StageColumn.jsx';
import { ApplicantCard } from '../features/pipeline/ApplicantCard.jsx';
import { ApplicantPanel } from '../features/pipeline/ApplicantPanel.jsx';
import { STAGE_LABELS, STAGE_ORDER } from '../lib/format.js';

export function JobPipelinePage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [activeId, setActiveId] = useState(null);
  const [openApplicationId, setOpenApplicationId] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  // Pointer needs a small drag threshold or clicking a card starts a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const job = useQuery({
    queryKey: ['my-job', id],
    queryFn: async () => {
      const { items } = await jobsApi.mine({ limit: 50 });
      return items.find((entry) => entry._id === id) ?? null;
    },
  });

  const pipeline = useQuery({
    queryKey: ['pipeline', id],
    queryFn: () => jobsApi.applications({ id, limit: 100 }),
  });

  const setStage = useMutation({
    mutationFn: applicationsApi.setStage,

    /* Optimistic: the card lands in the new column immediately, and rolls back
       to the snapshot if the server rejects the move. */
    onMutate: async ({ id: applicationId, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['pipeline', id] });
      const previous = queryClient.getQueryData(['pipeline', id]);

      queryClient.setQueryData(['pipeline', id], (current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item._id === applicationId ? { ...item, stage } : item
              ),
            }
          : current
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['pipeline', id], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', id] });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['company-stats'] });
    },
  });

  // Held in a memo so the fallback array does not change identity every render.
  const applications = useMemo(() => pipeline.data?.items ?? [], [pipeline.data]);

  const byStage = useMemo(() => {
    const grouped = Object.fromEntries(STAGE_ORDER.map((stage) => [stage, []]));
    for (const application of applications) grouped[application.stage]?.push(application);
    return grouped;
  }, [applications]);

  const activeApplication = applications.find((item) => item._id === activeId);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;

    const stage = String(over.id);
    const application = applications.find((item) => item._id === active.id);
    if (!application || !STAGE_ORDER.includes(stage) || application.stage === stage) return;

    setAnnouncement(`${application.candidate?.name ?? 'Candidate'} moved to ${STAGE_LABELS[stage]}`);
    setStage.mutate({ id: application._id, stage });
  };

  if (pipeline.isPending) {
    return (
      <Container wide className="py-8 sm:py-12">
        <PageHeaderSkeleton />
        <div className="mt-7">
          <BoardSkeleton />
        </div>
      </Container>
    );
  }

  if (pipeline.isError) {
    return (
      <Container className="py-14">
        <ErrorState message={errorMessage(pipeline.error)} onRetry={pipeline.refetch} />
      </Container>
    );
  }

  return (
    <Container wide className="py-8 sm:py-12">
      <Link
        to="/recruiter/jobs"
        className="text-ink-500 hover:text-ink-900 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to your jobs
      </Link>

      <div className="mt-5">
        <PageHeader
          title={job.data ? job.data.title : 'Pipeline'}
          description={`${applications.length} applicant${applications.length === 1 ? '' : 's'} · drag a card between columns, or open one to add notes.`}
          actions={
            job.data && (
              <Button variant="outline" to={`/jobs/${job.data.slug}`}>
                View public post
              </Button>
            )
          }
        />
      </div>

      {setStage.isError && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage(setStage.error, 'That move was rolled back.')}
        </p>
      )}

      {/* Drag results are invisible to screen readers without this. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {applications.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Inbox}
          title="No applications yet"
          message="Share the job link — applicants will appear here and you can move them through your stages."
          action={
            job.data && (
              <Button to={`/jobs/${job.data.slug}`} variant="outline">
                Open the public post
              </Button>
            )
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragCancel={() => setActiveId(null)}
          onDragEnd={handleDragEnd}
        >
          {/* Columns scroll sideways rather than squashing on narrow screens. */}
          <div className="-mx-4 mt-7 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6">
            <div className="flex min-w-max items-stretch gap-3">
              {STAGE_ORDER.map((stage) => (
                <StageColumn
                  key={stage}
                  stage={stage}
                  applications={byStage[stage]}
                  activeId={activeId}
                  onOpen={(application) => setOpenApplicationId(application._id)}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeApplication && <ApplicantCard application={activeApplication} overlay />}
          </DragOverlay>
        </DndContext>
      )}

      <p className="text-ink-400 mt-4 flex items-center gap-1.5 text-xs">
        <Users className="size-3.5" aria-hidden="true" />
        Candidates are emailed automatically when you move them to a new stage.
      </p>

      {openApplicationId && (
        <ApplicantPanel
          applicationId={openApplicationId}
          jobId={id}
          onClose={() => setOpenApplicationId(null)}
        />
      )}
    </Container>
  );
}

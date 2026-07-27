import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookmarkPlus, Check, Download, Mail, MapPin, Phone, Star, X } from 'lucide-react';
import { applicationsApi, talentApi } from '../../api/endpoints.js';
import { errorMessage } from '../../api/client.js';
import { InterviewSection } from './InterviewSection.jsx';
import { Badge, STAGE_TONES } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Select, Textarea } from '../../components/ui/Field.jsx';
import { Skeleton, SkeletonGroup } from '../../components/ui/States.jsx';
import { STAGE_ORDER, initials } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';
import { useFormat } from '../../hooks/useFormat.js';

export function ApplicantPanel({ applicationId, jobId, onClose }) {
  const format = useFormat();
  const queryClient = useQueryClient();
  const [noteBody, setNoteBody] = useState('');
  const [tagDraft, setTagDraft] = useState('');

  const query = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationsApi.get(applicationId),
    enabled: Boolean(applicationId),
  });

  const application = query.data?.application;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
    queryClient.invalidateQueries({ queryKey: ['pipeline', jobId] });
  };

  const addNote = useMutation({
    mutationFn: applicationsApi.addNote,
    onSuccess: () => {
      setNoteBody('');
      refresh();
    },
  });

  const setTags = useMutation({ mutationFn: applicationsApi.setTags, onSuccess: refresh });
  const setScore = useMutation({ mutationFn: applicationsApi.setScore, onSuccess: refresh });
  const setStage = useMutation({ mutationFn: applicationsApi.setStage, onSuccess: refresh });

  const savedIds = useQuery({ queryKey: ['talent-ids'], queryFn: talentApi.ids });

  const saveToPool = useMutation({
    mutationFn: talentApi.save,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-ids'] });
      queryClient.invalidateQueries({ queryKey: ['talent-pool'] });
    },
  });

  const mutationError = [addNote, setTags, setScore, setStage, saveToPool].find((m) => m.isError);
  const withdrawn = application?.status === 'withdrawn';
  const inPool = savedIds.data?.candidateIds?.includes(String(application?.candidate?._id));

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ink-900/25 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Applicant details"
        className="border-ink-200 fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col border-s bg-white shadow-2xl"
      >
        <header className="border-ink-200 flex items-start gap-3 border-b p-5">
          {application ? (
            <>
              <span
                className="bg-brand-100 text-brand-700 flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                aria-hidden="true"
              >
                {initials(application.candidate?.name ?? '?')}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold">
                  {application.candidate?.name}
                </h2>
                {application.candidate?.profile?.headline && (
                  <p className="text-ink-600 mt-0.5 text-sm">
                    {application.candidate.profile.headline}
                  </p>
                )}
                <p className="text-ink-400 mt-1 text-xs">
                  Applied {format.relative(application.createdAt)}
                </p>
              </div>
            </>
          ) : (
            <h2 className="flex-1 text-base font-semibold">Applicant</h2>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink-400 hover:bg-ink-100 hover:text-ink-800 rounded-lg p-1.5"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {query.isPending && (
            <SkeletonGroup label="Loading applicant…" className="space-y-6 p-5">
              <div className="flex gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-9 w-40 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-9 w-36 rounded-lg" />
              </div>
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
              ))}
            </SkeletonGroup>
          )}

          {query.isError && (
            <p role="alert" className="m-5 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
              {errorMessage(query.error)}
            </p>
          )}

          {application && (
            <div className="space-y-6 p-5">
              {mutationError && (
                <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  {errorMessage(mutationError.error, 'That change did not save.')}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                {withdrawn ? (
                  <Badge tone="neutral">Withdrawn by candidate</Badge>
                ) : (
                  <>
                    <Badge tone={STAGE_TONES[application.stage]}>
                      {format.stage(application.stage)}
                    </Badge>
                    <Select
                      aria-label="Move to stage"
                      className="h-9 w-40 py-0 text-sm"
                      value={application.stage}
                      disabled={setStage.isPending}
                      onChange={(event) =>
                        setStage.mutate({ id: application._id, stage: event.target.value })
                      }
                    >
                      {STAGE_ORDER.map((stage) => (
                        <option key={stage} value={stage}>
                          {format.stage(stage)}
                        </option>
                      ))}
                    </Select>
                  </>
                )}
              </div>

              <div className="text-ink-600 space-y-2 text-sm">
                {application.candidate?.email && (
                  <a
                    href={`mailto:${application.candidate.email}`}
                    className="hover:text-brand-700 flex items-center gap-2"
                  >
                    <Mail className="text-ink-400 size-4" aria-hidden="true" />
                    {application.candidate.email}
                  </a>
                )}
                {application.candidate?.profile?.phone && (
                  <a
                    href={`tel:${application.candidate.profile.phone.replace(/[^+0-9]/g, '')}`}
                    className="hover:text-brand-700 flex items-center gap-2"
                  >
                    <Phone className="text-ink-400 size-4" aria-hidden="true" />
                    {application.candidate.profile.phone}
                  </a>
                )}
                {application.candidate?.profile?.location && (
                  <p className="flex items-center gap-2">
                    <MapPin className="text-ink-400 size-4" aria-hidden="true" />
                    {application.candidate.profile.location}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-2">
                  <Button
                    as="a"
                    variant="outline"
                    size="sm"
                    href={application.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    {application.resumeName ?? 'Resume'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={inPool}
                    loading={saveToPool.isPending}
                    onClick={() =>
                      saveToPool.mutate({
                        candidateId: application.candidate._id,
                        sourceApplication: application._id,
                        note: '',
                        tags: application.tags ?? [],
                      })
                    }
                  >
                    {inPool ? (
                      <>
                        <Check className="size-4" aria-hidden="true" />
                        In talent pool
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="size-4" aria-hidden="true" />
                        Save to pool
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Section title="Rating">
                <ScorePicker
                  value={application.score}
                  disabled={setScore.isPending}
                  onChange={(score) => setScore.mutate({ id: application._id, score })}
                />
              </Section>

              <Section title="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {application.tags?.length ? (
                    application.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setTags.mutate({
                            id: application._id,
                            tags: application.tags.filter((item) => item !== tag),
                          })
                        }
                        className="bg-ink-100 text-ink-700 hover:bg-red-50 hover:text-red-700 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        aria-label={`Remove tag ${tag}`}
                      >
                        {tag}
                        <X className="size-3" aria-hidden="true" />
                      </button>
                    ))
                  ) : (
                    <p className="text-ink-400 text-sm">No tags yet.</p>
                  )}
                </div>

                <form
                  className="mt-2.5 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const tag = tagDraft.trim().toLowerCase();
                    if (!tag || application.tags?.includes(tag)) return;
                    setTags.mutate({ id: application._id, tags: [...(application.tags ?? []), tag] });
                    setTagDraft('');
                  }}
                >
                  <Input
                    className="h-9 py-0 text-sm"
                    placeholder="Add a tag…"
                    aria-label="Add a tag"
                    maxLength={30}
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                  />
                  <Button type="submit" variant="outline" size="sm" loading={setTags.isPending}>
                    Add
                  </Button>
                </form>
              </Section>

              <InterviewSection applicationId={application._id} disabled={withdrawn} />

              {application.coverLetter && (
                <Section title="Cover note">
                  <p className="prose-plain text-sm">{application.coverLetter}</p>
                </Section>
              )}

              {application.answers?.length > 0 && (
                <Section title="Answers">
                  <dl className="space-y-3">
                    {application.answers.map((answer) => (
                      <div key={answer.question}>
                        <dt className="text-ink-800 text-sm font-medium">{answer.question}</dt>
                        <dd className="text-ink-600 mt-0.5 text-sm">{answer.answer || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                </Section>
              )}

              <Section title={`Notes (${application.notes?.length ?? 0})`}>
                <div className="space-y-3">
                  {application.notes?.map((note) => (
                    <div key={note._id} className="bg-ink-50 rounded-lg p-3">
                      <p className="text-ink-700 text-sm whitespace-pre-line">{note.body}</p>
                      <p className="text-ink-400 mt-1.5 text-xs">
                        {note.author?.name ?? 'Teammate'} · {format.relative(note.createdAt)}
                      </p>
                    </div>
                  ))}
                  {!application.notes?.length && (
                    <p className="text-ink-400 text-sm">
                      No notes yet. Notes are private to your team.
                    </p>
                  )}
                </div>

                <form
                  className="mt-3 space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!noteBody.trim()) return;
                    addNote.mutate({ id: application._id, body: noteBody.trim() });
                  }}
                >
                  <Textarea
                    rows={3}
                    className="text-sm"
                    placeholder="Add a note for your team…"
                    aria-label="Add a note"
                    maxLength={4000}
                    value={noteBody}
                    onChange={(event) => setNoteBody(event.target.value)}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    loading={addNote.isPending}
                    disabled={!noteBody.trim()}
                  >
                    Add note
                  </Button>
                </form>
              </Section>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="text-ink-500 mb-2 text-xs font-semibold tracking-wide uppercase">{title}</h3>
      {children}
    </section>
  );
}

function ScorePicker({ value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          // Clicking the current score clears it, so a rating is never a one-way door.
          onClick={() => onChange(value === score ? null : score)}
          aria-label={`${score} out of 5`}
          aria-pressed={value === score}
          className="rounded p-0.5 disabled:opacity-50"
        >
          <Star
            className={cn(
              'size-5 transition-colors',
              value != null && score <= value
                ? 'fill-amber-400 text-amber-400'
                : 'text-ink-300 hover:text-amber-300'
            )}
          />
        </button>
      ))}
      {value != null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          className="text-ink-400 hover:text-ink-700 ms-2 text-xs"
        >
          Clear
        </button>
      )}
    </div>
  );
}

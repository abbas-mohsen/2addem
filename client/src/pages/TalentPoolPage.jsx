import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookmarkX, Mail, MapPin, Search, Users } from 'lucide-react';
import { talentApi } from '../api/endpoints.js';
import { errorMessage } from '../api/client.js';
import { Container, PageHeader } from '../components/layout/AppLayout.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input, Textarea } from '../components/ui/Field.jsx';
import { EmptyState, ErrorState } from '../components/ui/States.jsx';
import { ListRowsSkeleton } from '../components/ui/Skeletons.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { initials } from '../lib/format.js';
import { useFormat } from '../hooks/useFormat.js';
import { useT } from '../i18n/index.jsx';

export function TalentPoolPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [page, setPage] = useState(1);
  const t = useT();

  const query = useQuery({
    queryKey: ['talent-pool', search, activeTag, page],
    queryFn: () =>
      talentApi.list({
        ...(search ? { q: search } : {}),
        ...(activeTag ? { tag: activeTag } : {}),
        page,
        limit: 20,
      }),
    placeholderData: (previous) => previous,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['talent-pool'] });
    queryClient.invalidateQueries({ queryKey: ['talent-ids'] });
  };

  const remove = useMutation({ mutationFn: talentApi.remove, onSuccess: invalidate });
  const update = useMutation({ mutationFn: talentApi.update, onSuccess: invalidate });

  const entries = query.data?.items ?? [];
  const allTags = [...new Set(entries.flatMap((entry) => entry.tags ?? []))];

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        title={t('talent.title')}
        description={t('talent.subtitle')}
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="text-ink-400 pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            className="ps-9"
            placeholder={t('talent.searchPlaceholder')}
            aria-label={t('talent.searchLabel')}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-ink-500 text-xs">{t('talent.tags')}</span>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setActiveTag(activeTag === tag ? '' : tag);
                setPage(1);
              }}
              aria-pressed={activeTag === tag}
              className={
                activeTag === tag
                  ? 'bg-brand-600 rounded-full px-2.5 py-1 text-xs font-medium text-white'
                  : 'bg-ink-100 text-ink-700 hover:bg-ink-200 rounded-full px-2.5 py-1 text-xs font-medium'
              }
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {remove.isError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage(remove.error)}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {query.isPending && <ListRowsSkeleton count={3} />}

        {query.isError && (
          <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
        )}

        {query.isSuccess && entries.length === 0 && (
          <EmptyState
            icon={Users}
            title={search || activeTag ? t('talent.noMatch') : t('talent.empty')}
            message={
              search || activeTag
                ? t('talent.noMatchHint')
                : t('talent.emptyHint')
            }
            action={
              !search && !activeTag && <Button to="/recruiter/jobs">{t('talent.goToJobs')}</Button>
            }
          />
        )}

        {entries.map((entry) => (
          <PoolCard
            key={entry._id}
            entry={entry}
            onRemove={() => remove.mutate(entry._id)}
            onSaveNote={(note) => update.mutate({ id: entry._id, note })}
            removing={remove.isPending && remove.variables === entry._id}
            savingNote={update.isPending && update.variables?.id === entry._id}
          />
        ))}

        <Pagination meta={query.data?.meta} onPageChange={setPage} />
      </div>
    </Container>
  );
}

function PoolCard({ entry, onRemove, onSaveNote, removing, savingNote }) {
  const format = useFormat();
  const t = useT();
  const [note, setNote] = useState(entry.note ?? '');
  const [editing, setEditing] = useState(false);
  const candidate = entry.candidate;

  return (
    <article className="border-ink-200 rounded-card shadow-card border bg-white p-5">
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
              {candidate?.profile?.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {candidate.profile.location}
                </span>
              )}
            </div>

            {candidate?.profile?.skills?.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {candidate.profile.skills.slice(0, 5).map((skill) => (
                  <Badge key={skill} tone="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}

            {entry.tags?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <Badge key={tag} tone="brand">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-ink-400 text-xs">
            {entry.savedBy?.name
              ? t('talent.savedBy', {
                  when: format.relative(entry.createdAt),
                  name: entry.savedBy.name,
                })
              : t('talent.savedRelative', { when: format.relative(entry.createdAt) })}
          </span>
          <Button variant="ghost" size="sm" loading={removing} onClick={onRemove}>
            <BookmarkX className="size-4" aria-hidden="true" />
            {t('common.remove')}
          </Button>
        </div>
      </div>

      <div className="border-ink-100 mt-4 border-t pt-3">
        {editing ? (
          <div className="space-y-2">
            <Textarea
              rows={2}
              className="text-sm"
              aria-label={t('talent.noteLabel')}
              placeholder={t('talent.notePlaceholder')}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNote(entry.note ?? '');
                  setEditing(false);
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                loading={savingNote}
                onClick={() => {
                  onSaveNote(note.trim());
                  setEditing(false);
                }}
              >
                {t('talent.saveNote')}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-ink-600 hover:text-ink-900 w-full text-start text-sm"
          >
            {entry.note || <span className="text-ink-400">{t('talent.addNote')}</span>}
          </button>
        )}
      </div>
    </article>
  );
}

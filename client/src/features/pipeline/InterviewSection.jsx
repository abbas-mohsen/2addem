import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, MapPin, Trash2, Video } from 'lucide-react';
import { interviewsApi } from '../../api/endpoints.js';
import { errorMessage } from '../../api/client.js';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Input, Select, Textarea } from '../../components/ui/Field.jsx';
import { Skeleton } from '../../components/ui/States.jsx';
import { INTERVIEW_FORMATS } from '../../lib/format.js';
import { useFormat } from '../../hooks/useFormat.js';
import { useT } from '../../i18n/index.jsx';
import { cn } from '../../lib/cn.js';

/* datetime-local wants a local "YYYY-MM-DDTHH:mm", not an ISO string. */
function defaultSlot() {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  date.setHours(10, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const PLACEHOLDERS = {
  video: 'https://meet.example.com/your-room',
  phone: '+961 …',
  onsite: 'Office address and floor',
};

export function InterviewSection({ applicationId, disabled }) {
  const queryClient = useQueryClient();
  const format = useFormat();
  const t = useT();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    scheduledFor: defaultSlot(),
    durationMins: 45,
    locationType: 'video',
    location: '',
    notes: '',
  });
  const [error, setError] = useState(null);

  const query = useQuery({
    queryKey: ['interviews', applicationId],
    queryFn: () => interviewsApi.forApplication(applicationId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['interviews', applicationId] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const create = useMutation({
    mutationFn: interviewsApi.create,
    onSuccess: () => {
      setShowForm(false);
      setForm((current) => ({ ...current, notes: '', location: '' }));
      invalidate();
    },
    onError: (mutationError) =>
      setError(errorMessage(mutationError, t('applicant.scheduleFailed'))),
  });

  const cancel = useMutation({
    mutationFn: (id) => interviewsApi.update({ id, status: 'cancelled' }),
    onSuccess: invalidate,
  });

  const remove = useMutation({ mutationFn: interviewsApi.remove, onSuccess: invalidate });

  const interviews = query.data?.interviews ?? [];
  const update = (key) => (event) => setForm((c) => ({ ...c, [key]: event.target.value }));

  return (
    <section>
      <h3 className="text-ink-500 mb-2 text-xs font-semibold tracking-wide uppercase">
        {t('applicant.interviewsCount', { count: interviews.length })}
      </h3>

      {query.isPending && <Skeleton className="h-20 rounded-lg" />}

      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="space-y-2">
        {interviews.map((interview) => {
          const cancelled = interview.status === 'cancelled';
          const Icon = interview.locationType === 'video' ? Video : MapPin;

          return (
            <div
              key={interview._id}
              className={cn(
                'border-ink-200 rounded-lg border p-3',
                cancelled ? 'bg-ink-50 opacity-70' : 'bg-white'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-ink-900 flex items-center gap-1.5 text-sm font-medium">
                    <CalendarClock className="text-ink-400 size-4" aria-hidden="true" />
                    {format.dateTime(interview.scheduledFor)}
                  </p>
                  <p className="text-ink-500 mt-1 flex items-center gap-1.5 text-xs">
                    <Icon className="size-3.5" aria-hidden="true" />
                    {format.interviewFormat(interview.locationType)} ·{' '}
                    {t('applicant.minutes', { count: interview.durationMins })}
                  </p>
                  {interview.location && (
                    <p className="text-ink-600 mt-1 truncate text-xs">{interview.location}</p>
                  )}
                  {interview.notes && (
                    <p className="text-ink-600 mt-1.5 text-xs leading-relaxed">{interview.notes}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {cancelled ? (
                    <Badge tone="neutral">{t('applicant.cancelled')}</Badge>
                  ) : (
                    <Badge tone="warning">{t('applicant.scheduled')}</Badge>
                  )}
                  {!cancelled && !disabled && (
                    <button
                      type="button"
                      onClick={() => cancel.mutate(interview._id)}
                      className="text-ink-400 text-xs hover:text-red-600"
                    >
                      {t('applicant.cancelInterview')}
                    </button>
                  )}
                  {cancelled && (
                    <button
                      type="button"
                      onClick={() => remove.mutate(interview._id)}
                      aria-label={t('applicant.removeInterview')}
                      className="text-ink-300 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {query.isSuccess && interviews.length === 0 && !showForm && (
          <p className="text-ink-400 text-sm">{t('applicant.noInterviews')}</p>
        )}
      </div>

      {disabled ? null : showForm ? (
        <form
          className="border-ink-200 mt-3 space-y-3 rounded-lg border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            create.mutate({
              applicationId,
              scheduledFor: new Date(form.scheduledFor).toISOString(),
              durationMins: Number(form.durationMins),
              locationType: form.locationType,
              location: form.location.trim(),
              notes: form.notes.trim(),
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('applicant.when')} required>
              {(props) => (
                <Input
                  {...props}
                  type="datetime-local"
                  className="h-9 py-0 text-sm"
                  value={form.scheduledFor}
                  onChange={update('scheduledFor')}
                />
              )}
            </Field>

            <Field label={t('applicant.duration')}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min="5"
                  max="480"
                  // step must divide evenly from min, or common values like 45
                  // fail constraint validation and the form silently refuses.
                  step="5"
                  className="h-9 py-0 text-sm"
                  value={form.durationMins}
                  onChange={update('durationMins')}
                />
              )}
            </Field>
          </div>

          <Field label={t('applicant.format')}>
            {(props) => (
              <Select
                {...props}
                className="h-9 py-0 text-sm"
                value={form.locationType}
                onChange={update('locationType')}
              >
                {INTERVIEW_FORMATS.map((value) => (
                  <option key={value} value={value}>
                    {format.interviewFormat(value)}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            label={
              form.locationType === 'onsite' ? t('applicant.address') : t('applicant.linkOrNumber')
            }
          >
            {(props) => (
              <Input
                {...props}
                className="h-9 py-0 text-sm"
                placeholder={PLACEHOLDERS[form.locationType]}
                value={form.location}
                onChange={update('location')}
              />
            )}
          </Field>

          <Field label={t('applicant.whatToExpect')} hint={t('applicant.whatToExpectHint')}>
            {(props) => (
              <Textarea
                {...props}
                rows={2}
                className="text-sm"
                placeholder={t('applicant.whatToExpectPlaceholder')}
                value={form.notes}
                onChange={update('notes')}
              />
            )}
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" loading={create.isPending}>
              {t('applicant.schedule')}
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>
          <CalendarClock className="size-4" aria-hidden="true" />
          {t('applicant.scheduleInterview')}
        </Button>
      )}
    </section>
  );
}

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, Sparkles } from 'lucide-react';
import { jobsApi } from '../api/endpoints.js';
import { errorMessage, fieldErrors } from '../api/client.js';
import { Container, PageHeader } from '../components/layout/AppLayout.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Field, Input, Select, Textarea } from '../components/ui/Field.jsx';
import { ErrorState } from '../components/ui/States.jsx';
import { FormSkeleton, PageHeaderSkeleton } from '../components/ui/Skeletons.jsx';

import { EMPLOYMENT_TYPES, REMOTE_TYPES } from '../lib/format.js';
import { useFormat } from '../hooks/useFormat.js';
import { useLocationSuggestions } from '../hooks/useLocationSuggestions.js';
import { BackIcon } from '../components/ui/DirectionalIcon.jsx';
import { useT } from '../i18n/index.jsx';

const BLANK = {
  title: '',
  description: '',
  responsibilities: '',
  requirements: '',
  location: '',
  remote: 'onsite',
  employmentType: 'full-time',
  salaryMin: '',
  salaryMax: '',
  currency: 'USD',
  freshUsd: true,
  remoteAbroad: false,
  skills: '',
};

const toLines = (value) =>
  value
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

const toList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

function toFormState(job) {
  if (!job) return BLANK;

  return {
    title: job.title ?? '',
    description: job.description ?? '',
    responsibilities: (job.responsibilities ?? []).join('\n'),
    requirements: (job.requirements ?? []).join('\n'),
    location: job.location ?? '',
    remote: job.remote ?? 'onsite',
    employmentType: job.employmentType ?? 'full-time',
    salaryMin: job.salaryMin ?? '',
    salaryMax: job.salaryMax ?? '',
    currency: job.currency ?? 'USD',
    freshUsd: job.freshUsd ?? true,
    remoteAbroad: job.remoteAbroad ?? false,
    skills: (job.skills ?? []).join(', '),
  };
}

/* Loading is handled here so the form below can seed its state from the job in
   a useState initialiser instead of syncing it in an effect. */
export function JobEditorPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const t = useT();

  // Editing reads from the recruiter's own list so drafts are reachable too.
  const existing = useQuery({
    queryKey: ['my-job', id],
    queryFn: async () => {
      const { items } = await jobsApi.mine({ limit: 50 });
      return items.find((job) => job._id === id) ?? null;
    },
    enabled: isEdit,
  });

  if (isEdit && existing.isPending) {
    return (
      <Container className="py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <PageHeaderSkeleton withActions={false} />
          <div className="mt-6">
            <FormSkeleton fields={6} />
          </div>
        </div>
      </Container>
    );
  }

  if (isEdit && (existing.isError || existing.data === null)) {
    return (
      <Container className="py-14">
        <ErrorState
          title={t('editor.couldNotOpen')}
          message={existing.data === null ? t('editor.notFound') : errorMessage(existing.error)}
          onRetry={existing.data === null ? undefined : existing.refetch}
        />
      </Container>
    );
  }

  return <JobForm jobId={id} job={existing.data ?? null} />;
}

function JobForm({ jobId, job }) {
  const isEdit = Boolean(jobId);
  const id = jobId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(() => toFormState(job));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [draftNotice, setDraftNotice] = useState(null);
  const { data: locations = [] } = useLocationSuggestions();
  const format = useFormat();
  const t = useT();

  const aiDraft = useMutation({
    mutationFn: jobsApi.aiDraft,
    onSuccess: ({ draft, disclaimer }) => {
      setForm((current) => ({
        ...current,
        description: draft.description,
        responsibilities: draft.responsibilities.join('\n'),
        requirements: draft.requirements.join('\n'),
      }));
      setDraftNotice(disclaimer);
      setErrors((current) => ({ ...current, description: undefined }));
    },
    onError: (error) => setSubmitError(errorMessage(error, t('editor.draftFailed'))),
  });

  const save = useMutation({
    mutationFn: (payload) => (isEdit ? jobsApi.update({ id, ...payload }) : jobsApi.create(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['my-job', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate('/recruiter/jobs');
    },
    onError: (error) => {
      setErrors(fieldErrors(error));
      setSubmitError(errorMessage(error, t('editor.errors.saveFailed')));
    },
  });

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (form.title.trim().length < 3) next.title = t('editor.errors.title');
    if (form.description.trim().length < 30) {
      next.description = t('editor.errors.description');
    }
    if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)) {
      next.salaryMax = t('editor.errors.salary');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (status) => (event) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    save.mutate({
      title: form.title.trim(),
      description: form.description.trim(),
      responsibilities: toLines(form.responsibilities),
      requirements: toLines(form.requirements),
      location: form.location.trim(),
      remote: form.remote,
      employmentType: form.employmentType,
      ...(form.salaryMin === '' ? {} : { salaryMin: Number(form.salaryMin) }),
      ...(form.salaryMax === '' ? {} : { salaryMax: Number(form.salaryMax) }),
      currency: form.currency.toUpperCase(),
      freshUsd: form.freshUsd,
      remoteAbroad: form.remoteAbroad,
      skills: toList(form.skills),
      status,
    });
  };

  return (
    <Container className="py-8 sm:py-12">
      <Link
        to="/recruiter/jobs"
        className="text-ink-500 hover:text-ink-900 inline-flex items-center gap-1.5 text-sm"
      >
        <BackIcon className="size-4" aria-hidden="true" />
        {t('common.backToJobs')}
      </Link>

      <div className="mx-auto mt-5 max-w-3xl">
        <PageHeader
          title={isEdit ? t('editor.editTitle') : t('editor.createTitle')}
          description={t('editor.subtitle')}
        />

        <form
          className="border-ink-200 rounded-card shadow-card mt-6 space-y-5 border bg-white p-5 sm:p-7"
        >
          {submitError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
              {submitError}
            </p>
          )}

          <Field label={t('editor.jobTitle')} error={errors.title} required>
            {(props) => (
              <Input
                {...props}
                placeholder={t('editor.jobTitlePlaceholder')}
                value={form.title}
                error={errors.title}
                onChange={update('title')}
              />
            )}
          </Field>

          {/* Clearly labelled as a stub: it must never read as finished copy. */}
          <div className="border-ink-200 bg-ink-50/70 rounded-lg border border-dashed p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-ink-800 flex items-center gap-1.5 text-sm font-medium">
                  <FlaskConical className="text-ink-400 size-4" aria-hidden="true" />
                  {t('editor.draftBuilder')}
                  <span className="bg-ink-200 text-ink-600 ms-1 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                    {t('editor.stub')}
                  </span>
                </p>
                <p className="text-ink-500 mt-1 max-w-lg text-xs">
                  Fills the fields below from a local template using your title, skills and work
                  model. No AI model is called — see{' '}
                  <code className="bg-ink-200/60 rounded px-1">server/src/services/ai.service.js</code>{' '}
                  to wire one up.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={aiDraft.isPending}
                disabled={form.title.trim().length < 3}
                onClick={() =>
                  aiDraft.mutate({
                    title: form.title.trim(),
                    remote: form.remote,
                    location: form.location.trim(),
                    skills: toList(form.skills),
                  })
                }
              >
                <Sparkles className="size-4" aria-hidden="true" />
                {t('editor.buildDraft')}
              </Button>
            </div>

            {form.title.trim().length < 3 && (
              <p className="text-ink-400 mt-2 text-xs">{t('editor.addTitleFirst')}</p>
            )}

            {draftNotice && (
              <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {draftNotice}
              </p>
            )}
          </div>

          <Field label={t('editor.about')} error={errors.description} required>
            {(props) => (
              <Textarea
                {...props}
                rows={8}
                placeholder={t('editor.aboutPlaceholder')}
                value={form.description}
                error={errors.description}
                onChange={update('description')}
              />
            )}
          </Field>

          <Field label={t('editor.responsibilities')} hint={t('editor.onePerLine')}>
            {(props) => (
              <Textarea
                {...props}
                rows={5}
                placeholder={'Own the design system\nMentor two engineers'}
                value={form.responsibilities}
                onChange={update('responsibilities')}
              />
            )}
          </Field>

          <Field label={t('editor.requirements')} hint={t('editor.onePerLine')}>
            {(props) => (
              <Textarea
                {...props}
                rows={5}
                placeholder={'5+ years with React\nComfortable with TypeScript'}
                value={form.requirements}
                onChange={update('requirements')}
              />
            )}
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('editor.location')} hint={t('editor.locationHint')}>
              {(props) => (
                <>
                  <Input
                    {...props}
                    list="editor-locations"
                    placeholder="Beirut"
                    value={form.location}
                    onChange={update('location')}
                  />
                  <datalist id="editor-locations">
                    {locations.map((location) => (
                      <option key={location} value={location} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>

            <Field label={t('editor.workModel')}>
              {(props) => (
                <Select {...props} value={form.remote} onChange={update('remote')}>
                  {REMOTE_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {format.remote(value)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label={t('editor.employmentType')}>
              {(props) => (
                <Select {...props} value={form.employmentType} onChange={update('employmentType')}>
                  {EMPLOYMENT_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {format.employment(value)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label={t('editor.currency')} hint={t('editor.currencyHint')}>
              {(props) => (
                <Input
                  {...props}
                  maxLength={3}
                  value={form.currency}
                  onChange={update('currency')}
                />
              )}
            </Field>

            <Field label={t('editor.salaryFrom')}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min="0"
                  step="any"
                  placeholder="60000"
                  value={form.salaryMin}
                  onChange={update('salaryMin')}
                />
              )}
            </Field>

            <Field label={t('editor.salaryTo')} error={errors.salaryMax}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min="0"
                  step="any"
                  placeholder="85000"
                  value={form.salaryMax}
                  error={errors.salaryMax}
                  onChange={update('salaryMax')}
                />
              )}
            </Field>
          </div>

          {/* Two facts a Lebanese listing has to state explicitly. */}
          <fieldset className="border-ink-200 space-y-3 rounded-lg border p-4">
            <legend className="text-ink-800 px-1 text-sm font-medium">{t('editor.payTitle')}</legend>

            <label className="text-ink-700 flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                className="border-ink-300 text-brand-600 focus:ring-brand-200 mt-0.5 size-4 rounded"
                checked={form.freshUsd}
                onChange={(event) =>
                  setForm((current) => ({ ...current, freshUsd: event.target.checked }))
                }
              />
              <span>
                {t('editor.freshUsd')}
                <span className="text-ink-500 block text-xs">
                  {t('editor.freshUsdHint')}
                </span>
              </span>
            </label>

            <label className="text-ink-700 flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                className="border-ink-300 text-brand-600 focus:ring-brand-200 mt-0.5 size-4 rounded"
                checked={form.remoteAbroad}
                onChange={(event) =>
                  setForm((current) => ({ ...current, remoteAbroad: event.target.checked }))
                }
              />
              <span>
                {t('editor.remoteAbroad')}
                <span className="text-ink-500 block text-xs">
                  {t('editor.remoteAbroadHint')}
                </span>
              </span>
            </label>
          </fieldset>

          <Field label={t('editor.skills')} hint={t('editor.skillsHint')}>
            {(props) => (
              <Input
                {...props}
                placeholder={t('editor.skillsPlaceholder')}
                value={form.skills}
                onChange={update('skills')}
              />
            )}
          </Field>

          <div className="border-ink-200 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" to="/recruiter/jobs">
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="outline"
              loading={save.isPending && save.variables?.status === 'draft'}
              onClick={submit('draft')}
            >
              {t('editor.saveDraft')}
            </Button>
            <Button
              type="submit"
              loading={save.isPending && save.variables?.status === 'published'}
              onClick={submit('published')}
            >
              {isEdit ? t('editor.savePublish') : t('editor.publishJob')}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}

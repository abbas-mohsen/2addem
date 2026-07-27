import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FlaskConical, Sparkles } from 'lucide-react';
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
          title="Could not open this job"
          message={
            existing.data === null
              ? 'We could not find it among your company’s jobs.'
              : errorMessage(existing.error)
          }
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
    onError: (error) => setSubmitError(errorMessage(error, 'Could not build a draft.')),
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
      setSubmitError(errorMessage(error, 'Could not save this job.'));
    },
  });

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (form.title.trim().length < 3) next.title = 'Give the role a title';
    if (form.description.trim().length < 30) {
      next.description = 'Describe the role in at least 30 characters';
    }
    if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)) {
      next.salaryMax = 'Maximum must be greater than the minimum';
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
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to your jobs
      </Link>

      <div className="mx-auto mt-5 max-w-3xl">
        <PageHeader
          title={isEdit ? 'Edit job' : 'Create a job'}
          description="Save it as a draft while you work on it, or publish it straight to the board."
        />

        <form
          className="border-ink-200 rounded-card shadow-card mt-6 space-y-5 border bg-white p-5 sm:p-7"
        >
          {submitError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
              {submitError}
            </p>
          )}

          <Field label="Job title" error={errors.title} required>
            {(props) => (
              <Input
                {...props}
                placeholder="Senior Frontend Engineer"
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
                  Draft builder
                  <span className="bg-ink-200 text-ink-600 ms-1 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                    Stub
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
                Build a draft
              </Button>
            </div>

            {form.title.trim().length < 3 && (
              <p className="text-ink-400 mt-2 text-xs">Add a job title first.</p>
            )}

            {draftNotice && (
              <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {draftNotice}
              </p>
            )}
          </div>

          <Field label="About the role" error={errors.description} required>
            {(props) => (
              <Textarea
                {...props}
                rows={8}
                placeholder="What the team does, what this person will own, and why it matters."
                value={form.description}
                error={errors.description}
                onChange={update('description')}
              />
            )}
          </Field>

          <Field label="Responsibilities" hint="One per line.">
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

          <Field label="Requirements" hint="One per line.">
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
            <Field label="Location" hint="Suggestions cover Lebanese cities and governorates.">
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

            <Field label="Work model">
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

            <Field label="Employment type">
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

            <Field label="Currency" hint="Three-letter code, e.g. USD or EUR.">
              {(props) => (
                <Input
                  {...props}
                  maxLength={3}
                  value={form.currency}
                  onChange={update('currency')}
                />
              )}
            </Field>

            <Field label="Salary from">
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

            <Field label="Salary to" error={errors.salaryMax}>
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
            <legend className="text-ink-800 px-1 text-sm font-medium">How this role pays</legend>

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
                Paid in fresh USD
                <span className="text-ink-500 block text-xs">
                  Shown on the listing as “fresh”. Uncheck for lira or local-bank dollars.
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
                Remote for a company based abroad
                <span className="text-ink-500 block text-xs">
                  Candidates filter on this more than any other option.
                </span>
              </span>
            </label>
          </fieldset>

          <Field label="Skills" hint="Comma separated — these power search on the board.">
            {(props) => (
              <Input
                {...props}
                placeholder="React, TypeScript, GraphQL"
                value={form.skills}
                onChange={update('skills')}
              />
            )}
          </Field>

          <div className="border-ink-200 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" to="/recruiter/jobs">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              loading={save.isPending && save.variables?.status === 'draft'}
              onClick={submit('draft')}
            >
              Save as draft
            </Button>
            <Button
              type="submit"
              loading={save.isPending && save.variables?.status === 'published'}
              onClick={submit('published')}
            >
              {isEdit ? 'Save & publish' : 'Publish job'}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}

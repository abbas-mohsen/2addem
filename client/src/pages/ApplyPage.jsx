import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, UploadCloud, X } from 'lucide-react';
import { applicationsApi, jobsApi } from '../api/endpoints.js';
import { errorMessage } from '../api/client.js';
import { Container } from '../components/layout/AppLayout.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Field, Textarea } from '../components/ui/Field.jsx';
import { CompanyLogo } from '../components/ui/Logo.jsx';
import { ErrorState } from '../components/ui/States.jsx';
import { FormSkeleton } from '../components/ui/Skeletons.jsx';
import { cn } from '../lib/cn.js';

const MAX_FILE_MB = 5;
const ACCEPTED = '.pdf,.doc,.docx';

export function ApplyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [fileError, setFileError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const jobQuery = useQuery({ queryKey: ['job', slug], queryFn: () => jobsApi.get(slug) });

  const mutation = useMutation({
    mutationFn: ({ jobId, formData }) =>
      applicationsApi.apply({
        jobId,
        formData,
        onUploadProgress: (event) =>
          setProgress(event.total ? Math.round((event.loaded / event.total) * 100) : 0),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', slug] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      navigate('/applications?applied=1', { replace: true });
    },
    onSettled: () => setProgress(0),
  });

  const acceptFile = (candidate) => {
    setFileError(null);

    if (!candidate) return;
    if (!/\.(pdf|docx?)$/i.test(candidate.name)) {
      setFileError('Upload a PDF, DOC or DOCX file');
      return;
    }
    if (candidate.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`Keep the file under ${MAX_FILE_MB}MB`);
      return;
    }

    setFile(candidate);
  };

  if (jobQuery.isPending) {
    return (
      <Container className="py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <FormSkeleton fields={3} />
        </div>
      </Container>
    );
  }

  if (jobQuery.isError) {
    return (
      <Container className="py-14">
        <ErrorState
          title="Could not load this role"
          message={errorMessage(jobQuery.error)}
          onRetry={jobQuery.refetch}
        />
      </Container>
    );
  }

  const { job, hasApplied } = jobQuery.data;

  if (hasApplied || job.status !== 'published') {
    return (
      <Container className="py-14">
        <div className="border-ink-200 rounded-card mx-auto max-w-lg border bg-white p-8 text-center">
          <h1 className="text-xl">
            {hasApplied ? 'You have already applied' : 'This role is closed'}
          </h1>
          <p className="text-ink-600 mt-2 text-sm">
            {hasApplied
              ? 'Track the progress of this application from your dashboard.'
              : 'The team is no longer accepting applications for this role.'}
          </p>
          <Button to={hasApplied ? '/applications' : '/jobs'} className="mt-5">
            {hasApplied ? 'View my applications' : 'Browse open roles'}
          </Button>
        </div>
      </Container>
    );
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!file) {
      setFileError('A resume is required');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('coverLetter', coverLetter.trim());

    mutation.mutate({ jobId: job._id, formData });
  };

  return (
    <Container className="py-8 sm:py-12">
      <Link
        to={`/jobs/${job.slug}`}
        className="text-ink-500 hover:text-ink-900 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to the role
      </Link>

      <div className="mx-auto mt-5 max-w-2xl">
        <div className="border-ink-200 rounded-card flex items-center gap-4 border bg-white p-5">
          <CompanyLogo company={job.company} />
          <div>
            <h1 className="text-lg leading-snug">Apply for {job.title}</h1>
            <p className="text-ink-500 text-sm">
              {job.company?.name} · {job.location || 'Remote'}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-ink-200 rounded-card shadow-card mt-4 space-y-6 border bg-white p-5 sm:p-7"
        >
          {mutation.isError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
              {errorMessage(mutation.error, 'Your application could not be sent.')}
            </p>
          )}

          <div className="space-y-1.5">
            <span className="text-ink-800 block text-sm font-medium">
              Resume<span className="text-brand-600 ml-0.5">*</span>
            </span>

            {file ? (
              <div className="border-ink-200 flex items-center gap-3 rounded-lg border bg-white p-3.5">
                <FileText className="text-brand-600 size-5 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-ink-900 truncate text-sm font-medium">{file.name}</p>
                  <p className="text-ink-500 text-xs">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-ink-400 hover:text-ink-700 rounded p-1"
                  aria-label="Remove file"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  acceptFile(event.dataTransfer.files?.[0]);
                }}
                className={cn(
                  'rounded-lg border-2 border-dashed p-8 text-center transition',
                  dragging ? 'border-brand-400 bg-brand-50/60' : 'border-ink-200 bg-ink-50/40',
                  fileError && 'border-red-300'
                )}
              >
                <UploadCloud className="text-ink-400 mx-auto size-7" aria-hidden="true" />
                <p className="text-ink-700 mt-3 text-sm">
                  Drag your resume here, or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-brand-700 font-medium hover:underline"
                  >
                    choose a file
                  </button>
                </p>
                <p className="text-ink-500 mt-1 text-xs">PDF, DOC or DOCX · up to {MAX_FILE_MB}MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED}
                  className="sr-only"
                  onChange={(event) => acceptFile(event.target.files?.[0])}
                />
              </div>
            )}

            {fileError && <p className="text-sm text-red-600">{fileError}</p>}
          </div>

          <Field
            label="Cover note"
            hint="Optional, but a few honest sentences go a long way."
          >
            {(props) => (
              <Textarea
                {...props}
                rows={7}
                maxLength={8000}
                placeholder={`Why ${job.company?.name ?? 'this team'}, and why this role?`}
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
              />
            )}
          </Field>

          {mutation.isPending && progress > 0 && (
            <div className="bg-ink-100 h-1.5 overflow-hidden rounded-full" aria-hidden="true">
              <div
                className="bg-brand-500 h-full transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" to={`/jobs/${job.slug}`}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Send application
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}

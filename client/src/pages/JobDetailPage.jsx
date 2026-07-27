import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Banknote, Briefcase, CheckCircle2, Clock, MapPin, Users } from 'lucide-react';
import { jobsApi } from '../api/endpoints.js';
import { errorMessage } from '../api/client.js';
import { useAuthStore } from '../context/authStore.js';
import { Container } from '../components/layout/AppLayout.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { CompanyLogo } from '../components/ui/Logo.jsx';
import { ErrorState } from '../components/ui/States.jsx';
import { JobDetailSkeleton } from '../components/ui/Skeletons.jsx';
import { useFormat } from '../hooks/useFormat.js';


export function JobDetailPage() {
  const format = useFormat();
  const { slug } = useParams();
  const user = useAuthStore((state) => state.user);

  const query = useQuery({
    queryKey: ['job', slug],
    queryFn: () => jobsApi.get(slug),
  });

  if (query.isPending) return <JobDetailSkeleton />;

  if (query.isError) {
    const notFound = query.error?.response?.status === 404;
    return (
      <Container className="py-14">
        <ErrorState
          title={notFound ? 'This role is no longer open' : 'Could not load this role'}
          message={
            notFound
              ? 'It may have been closed or removed. Browse the board for roles that are still live.'
              : errorMessage(query.error)
          }
          onRetry={notFound ? undefined : query.refetch}
        />
        <div className="mt-4 text-center">
          <Button variant="outline" to="/jobs">
            Back to all jobs
          </Button>
        </div>
      </Container>
    );
  }

  const { job, hasApplied } = query.data;
  const salary = format.salary(job);
  const isOpen = job.status === 'published';
  const canApply = !user || user.role === 'candidate';

  return (
    <Container className="py-8 sm:py-12">
      <Link
        to="/jobs"
        className="text-ink-500 hover:text-ink-900 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All jobs
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="border-ink-200 rounded-card shadow-card border bg-white p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <CompanyLogo company={job.company} size="lg" />
              <div className="min-w-0">
                <h1 className="text-title text-2xl sm:text-3xl">{job.title}</h1>
                <Link
                  to={`/companies/${job.company?.slug}`}
                  className="text-ink-600 hover:text-brand-700 mt-1 inline-block text-sm font-medium"
                >
                  {job.company?.name}
                </Link>
              </div>
            </div>

            <dl className="text-ink-600 mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <MapPin className="text-ink-400 size-4" aria-hidden="true" />
                <dt className="sr-only">Location</dt>
                <dd>{job.location || format.remote(job.remote)}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="text-ink-400 size-4" aria-hidden="true" />
                <dt className="sr-only">Employment type</dt>
                <dd>
                  {format.employment(job.employmentType)} · {format.remote(job.remote)}
                </dd>
              </div>
              {salary && (
                <div className="flex items-center gap-2">
                  <Banknote className="text-ink-400 size-4" aria-hidden="true" />
                  <dt className="sr-only">Salary</dt>
                  <dd>{salary}</dd>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="text-ink-400 size-4" aria-hidden="true" />
                <dt className="sr-only">Published</dt>
                <dd>Posted {format.relative(job.publishedAt ?? job.createdAt)}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              {job.remoteAbroad && (
                <Badge tone="success">Remote for a company abroad · paid from abroad</Badge>
              )}
              {job.skills?.map((skill) => (
                <Badge key={skill} tone="brand">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <section className="mt-6 space-y-8">
            <div>
              <h2 className="text-lg">About the role</h2>
              <p className="prose-plain mt-3">{job.description}</p>
            </div>

            {job.responsibilities?.length > 0 && (
              <BulletSection title="What you will do" items={job.responsibilities} />
            )}
            {job.requirements?.length > 0 && (
              <BulletSection title="What we are looking for" items={job.requirements} />
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-ink-200 rounded-card shadow-card border bg-white p-5">
            {!isOpen ? (
              <>
                <Badge tone="danger">Closed</Badge>
                <p className="text-ink-600 mt-3 text-sm">
                  This role is no longer accepting applications.
                </p>
                <Button variant="outline" to="/jobs" className="mt-4 w-full">
                  Find similar roles
                </Button>
              </>
            ) : hasApplied ? (
              <>
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Application sent
                </p>
                <p className="text-ink-600 mt-2 text-sm">
                  You have already applied to this role. Track its progress from your dashboard.
                </p>
                <Button variant="outline" to="/applications" className="mt-4 w-full">
                  View my applications
                </Button>
              </>
            ) : canApply ? (
              <>
                <p className="text-ink-900 font-medium">Interested?</p>
                <p className="text-ink-600 mt-1 text-sm">
                  Applying takes about a minute — a resume and a short note.
                </p>
                <Button to={`/jobs/${job.slug}/apply`} className="mt-4 w-full">
                  Apply now
                </Button>
                {!user && (
                  <p className="text-ink-500 mt-3 text-center text-xs">
                    You will be asked to sign in first.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-ink-900 font-medium">You are signed in as a recruiter</p>
                <p className="text-ink-600 mt-1 text-sm">
                  Only candidate accounts can apply to roles.
                </p>
              </>
            )}

            <div className="border-ink-200 text-ink-500 mt-5 flex items-center gap-2 border-t pt-4 text-sm">
              <Users className="size-4" aria-hidden="true" />
              {job.applicationCount} applicant{job.applicationCount === 1 ? '' : 's'} so far
            </div>
          </div>

          {job.company?.description && (
            <div className="border-ink-200 rounded-card mt-4 border bg-white p-5">
              <h2 className="text-sm font-semibold">About {job.company.name}</h2>
              <p className="text-ink-600 mt-2 line-clamp-6 text-sm leading-relaxed">
                {job.company.description}
              </p>
              <Link
                to={`/companies/${job.company.slug}`}
                className="text-brand-700 mt-3 inline-block text-sm font-medium hover:underline"
              >
                View company page
              </Link>
            </div>
          )}
        </aside>
      </div>
    </Container>
  );
}

function BulletSection({ title, items }) {
  return (
    <div>
      <h2 className="text-lg">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="text-ink-700 flex gap-2.5 text-sm leading-relaxed">
            <span className="bg-brand-400 mt-2 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

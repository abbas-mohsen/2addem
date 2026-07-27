import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Briefcase, CheckCircle2, Clock, MapPin, Users } from 'lucide-react';
import { jobsApi } from '../api/endpoints.js';
import { errorMessage } from '../api/client.js';
import { useAuthStore } from '../context/authStore.js';
import { Container } from '../components/layout/AppLayout.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { CompanyLogo } from '../components/ui/Logo.jsx';
import { ErrorState } from '../components/ui/States.jsx';
import { JobDetailSkeleton } from '../components/ui/Skeletons.jsx';
import { BackIcon } from '../components/ui/DirectionalIcon.jsx';
import { useFormat } from '../hooks/useFormat.js';
import { useT } from '../i18n/index.jsx';

export function JobDetailPage() {
  const format = useFormat();
  const t = useT();
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
          title={notFound ? t('jobs.noLongerOpen') : t('jobs.couldNotLoad')}
          message={notFound ? t('jobs.noLongerOpenHint') : errorMessage(query.error)}
          onRetry={notFound ? undefined : query.refetch}
        />
        <div className="mt-4 text-center">
          <Button variant="outline" to="/jobs">
            {t('common.allJobs')}
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
        <BackIcon className="size-4" aria-hidden="true" />
        {t('common.allJobs')}
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
                <dt className="sr-only">{t('editor.location')}</dt>
                <dd>{job.location || format.remote(job.remote)}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="text-ink-400 size-4" aria-hidden="true" />
                <dt className="sr-only">{t('editor.employmentType')}</dt>
                <dd>
                  {format.employment(job.employmentType)} · {format.remote(job.remote)}
                </dd>
              </div>
              {salary && (
                <div className="flex items-center gap-2">
                  <Banknote className="text-ink-400 size-4" aria-hidden="true" />
                  <dt className="sr-only">{t('editor.salaryFrom')}</dt>
                  <dd>{salary}</dd>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="text-ink-400 size-4" aria-hidden="true" />
                <dt className="sr-only">{t('jobStatus.published')}</dt>
                <dd>{t('jobs.postedRelative', { when: format.relative(job.publishedAt ?? job.createdAt) })}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              {job.remoteAbroad && (
                <Badge tone="success">{t('jobs.remoteAbroadLong')}</Badge>
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
              <h2 className="text-lg">{t('jobs.aboutTheRole')}</h2>
              <p className="prose-plain mt-3">{job.description}</p>
            </div>

            {job.responsibilities?.length > 0 && (
              <BulletSection title={t('jobs.whatYouWillDo')} items={job.responsibilities} />
            )}
            {job.requirements?.length > 0 && (
              <BulletSection title={t('jobs.whatWeLookFor')} items={job.requirements} />
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-ink-200 rounded-card shadow-card border bg-white p-5">
            {!isOpen ? (
              <>
                <Badge tone="danger">{t('jobs.closed')}</Badge>
                <p className="text-ink-600 mt-3 text-sm">
                  {t('jobs.noLongerAccepting')}
                </p>
                <Button variant="outline" to="/jobs" className="mt-4 w-full">
                  {t('jobs.findSimilar')}
                </Button>
              </>
            ) : hasApplied ? (
              <>
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  {t('jobs.applicationSent')}
                </p>
                <p className="text-ink-600 mt-2 text-sm">
                  {t('jobs.alreadyApplied')}
                </p>
                <Button variant="outline" to="/applications" className="mt-4 w-full">
                  {t('jobs.viewMyApplications')}
                </Button>
              </>
            ) : canApply ? (
              <>
                <p className="text-ink-900 font-medium">{t('jobs.interested')}</p>
                <p className="text-ink-600 mt-1 text-sm">
                  {t('jobs.applyBlurb')}
                </p>
                <Button to={`/jobs/${job.slug}/apply`} className="mt-4 w-full">
                  {t('jobs.applyNow')}
                </Button>
                {!user && (
                  <p className="text-ink-500 mt-3 text-center text-xs">
                    {t('jobs.signInFirst')}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-ink-900 font-medium">{t('jobs.recruiterCannotApply')}</p>
                <p className="text-ink-600 mt-1 text-sm">
                  {t('jobs.recruiterCannotApplyHint')}
                </p>
              </>
            )}

            <div className="border-ink-200 text-ink-500 mt-5 flex items-center gap-2 border-t pt-4 text-sm">
              <Users className="size-4" aria-hidden="true" />
              {t('common.applicants', { count: job.applicationCount })}
            </div>
          </div>

          {job.company?.description && (
            <div className="border-ink-200 rounded-card mt-4 border bg-white p-5">
              <h2 className="text-sm font-semibold">{t('jobs.aboutCompany', { company: job.company.name })}</h2>
              <p className="text-ink-600 mt-2 line-clamp-6 text-sm leading-relaxed">
                {job.company.description}
              </p>
              <Link
                to={`/companies/${job.company.slug}`}
                className="text-brand-700 mt-3 inline-block text-sm font-medium hover:underline"
              >
                {t('jobs.viewCompanyPage')}
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

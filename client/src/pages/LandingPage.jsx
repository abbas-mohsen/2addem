import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { KanbanSquare, Search, Sparkles, Users } from 'lucide-react';
import { jobsApi } from '../api/endpoints.js';
import { errorMessage } from '../api/client.js';
import { Container } from '../components/layout/AppLayout.jsx';
import { ErrorState } from '../components/ui/States.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Field.jsx';
import { JobCard, JobCardSkeleton } from '../features/jobs/JobCard.jsx';
import { ForwardIcon } from '../components/ui/DirectionalIcon.jsx';
import { useT } from '../i18n/index.jsx';

const FEATURES = [
  { icon: Sparkles, key: 'posts' },
  { icon: KanbanSquare, key: 'pipeline' },
  { icon: Users, key: 'candidates' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const t = useT();

  const latest = useQuery({
    queryKey: ['jobs', 'latest'],
    queryFn: () => jobsApi.list({ limit: 4, sort: 'newest' }),
  });

  const jobs = latest.data?.items ?? [];

  return (
    <>
      <section className="border-ink-200 relative overflow-hidden border-b bg-white">
        {/* Soft brand wash keeps the hero from reading as a plain white page. */}
        <div
          aria-hidden="true"
          className="from-brand-100/70 pointer-events-none absolute -top-40 -right-32 size-[34rem] rounded-full bg-gradient-to-br to-transparent blur-3xl"
        />

        <Container className="relative py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="border-ink-200 text-ink-600 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium">
              <span className="bg-brand-500 size-1.5 rounded-full" aria-hidden="true" />
              {t('landing.badge')}
            </span>

            <h1 className="text-title sm:text-display mt-5">
              {t('landing.headline')}
              <span className="text-brand-600"> {t('landing.headlineAccent')}</span>
            </h1>

            <p className="text-ink-600 mt-5 text-lg leading-relaxed">{t('landing.intro')}</p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                navigate(term.trim() ? `/jobs?q=${encodeURIComponent(term.trim())}` : '/jobs');
              }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search
                  className="text-ink-400 pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  className="h-12 ps-10"
                  placeholder={t('landing.searchPlaceholder')}
                  aria-label={t('landing.searchJobs')}
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                />
              </div>
              <Button type="submit" size="lg">
                {t('landing.searchJobs')}
              </Button>
            </form>

            <p className="text-ink-500 mt-4 text-sm">
              {t('landing.hiringInstead')}{' '}
              <Link
                to="/register?role=recruiter"
                className="text-brand-700 font-medium hover:underline"
              >
                {t('landing.postRoleFree')}
              </Link>
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, key }) => (
            <div key={key} className="border-ink-200 rounded-card border bg-white p-6">
              <span className="bg-brand-50 text-brand-600 flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold">
                {t(`landing.features.${key}.title`)}
              </h2>
              <p className="text-ink-600 mt-2 text-sm leading-relaxed">
                {t(`landing.features.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl">{t('landing.latestOpenings')}</h2>
            <p className="text-ink-500 mt-1 text-sm">{t('landing.latestSubtitle')}</p>
          </div>
          <Button variant="outline" size="sm" to="/jobs">
            {t('landing.viewAll')}
            <ForwardIcon className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-4">
          {latest.isPending &&
            Array.from({ length: 3 }, (_, index) => <JobCardSkeleton key={index} />)}

          {latest.isError && (
            <ErrorState
              title={t('landing.couldNotLoadLatest')}
              message={errorMessage(latest.error)}
              onRetry={latest.refetch}
            />
          )}

          {latest.isSuccess && jobs.length === 0 && (
            <div className="border-ink-200 rounded-card border border-dashed bg-white px-6 py-12 text-center">
              <p className="text-ink-900 font-medium">{t('landing.noRolesYet')}</p>
              <p className="text-ink-500 mt-1 text-sm">
                {t('landing.beTheFirst')}{' '}
                <Link to="/register?role=recruiter" className="text-brand-700 hover:underline">
                  {t('landing.createEmployerAccount')}
                </Link>
              </p>
            </div>
          )}

          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      </Container>
    </>
  );
}

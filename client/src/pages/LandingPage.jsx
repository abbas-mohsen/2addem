import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, KanbanSquare, Search, Sparkles, Users } from 'lucide-react';
import { jobsApi } from '../api/endpoints.js';
import { errorMessage } from '../api/client.js';
import { Container } from '../components/layout/AppLayout.jsx';
import { ErrorState } from '../components/ui/States.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Field.jsx';
import { JobCard, JobCardSkeleton } from '../features/jobs/JobCard.jsx';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Job posts that read like people wrote them',
    body: 'A structured editor for responsibilities, requirements and salary — published in a couple of minutes.',
  },
  {
    icon: KanbanSquare,
    title: 'One pipeline, no spreadsheets',
    body: 'Every applicant lands in a stage you can move, annotate and score as a team.',
  },
  {
    icon: Users,
    title: 'Candidates always know where they stand',
    body: 'Applicants track their own status instead of emailing to ask.',
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');

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
              Hiring, minus the admin
            </span>

            <h1 className="text-title sm:text-display mt-5">
              Jobs worth applying for.
              <span className="text-brand-600"> Hiring worth doing.</span>
            </h1>

            <p className="text-ink-600 mt-5 text-lg leading-relaxed">
              Hirefold is a two-sided hiring platform: candidates apply in one click and follow every
              step, teams publish roles and run the whole pipeline in one place.
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                navigate(term.trim() ? `/jobs?q=${encodeURIComponent(term.trim())}` : '/jobs');
              }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search
                  className="text-ink-400 pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  className="h-12 pl-10"
                  placeholder="Try “React”, “product designer”, “Berlin”…"
                  aria-label="Search jobs"
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                />
              </div>
              <Button type="submit" size="lg">
                Search jobs
              </Button>
            </form>

            <p className="text-ink-500 mt-4 text-sm">
              Hiring instead?{' '}
              <Link
                to="/register?role=recruiter"
                className="text-brand-700 font-medium hover:underline"
              >
                Post a role free
              </Link>
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="border-ink-200 rounded-card border bg-white p-6">
              <span className="bg-brand-50 text-brand-600 flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold">{title}</h2>
              <p className="text-ink-600 mt-2 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl">Latest openings</h2>
            <p className="text-ink-500 mt-1 text-sm">Fresh roles from teams hiring right now.</p>
          </div>
          <Button variant="outline" size="sm" to="/jobs">
            View all
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-4">
          {latest.isPending &&
            Array.from({ length: 3 }, (_, index) => <JobCardSkeleton key={index} />)}

          {latest.isError && (
            <ErrorState
              title="Could not load the latest roles"
              message={errorMessage(latest.error)}
              onRetry={latest.refetch}
            />
          )}

          {latest.isSuccess && jobs.length === 0 && (
            <div className="border-ink-200 rounded-card border border-dashed bg-white px-6 py-12 text-center">
              <p className="text-ink-900 font-medium">No roles published yet</p>
              <p className="text-ink-500 mt-1 text-sm">
                Be the first —{' '}
                <Link to="/register?role=recruiter" className="text-brand-700 hover:underline">
                  create an employer account
                </Link>
                .
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

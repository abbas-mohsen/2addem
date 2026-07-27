import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Globe, MapPin, Users } from 'lucide-react';
import { companiesApi } from '../api/endpoints.js';
import { errorMessage } from '../api/client.js';
import { Container } from '../components/layout/AppLayout.jsx';
import { Button } from '../components/ui/Button.jsx';
import { CompanyLogo } from '../components/ui/Logo.jsx';
import { EmptyState, ErrorState, Skeleton, SkeletonGroup } from '../components/ui/States.jsx';
import { ListRowsSkeleton } from '../components/ui/Skeletons.jsx';
import { JobCard } from '../features/jobs/JobCard.jsx';
import { useT } from '../i18n/index.jsx';

export function CompanyPage() {
  const { slug } = useParams();
  const t = useT();

  const query = useQuery({
    queryKey: ['company', slug],
    queryFn: () => companiesApi.bySlug(slug),
  });

  if (query.isPending) {
    return (
      <SkeletonGroup>
        <section className="border-ink-200 border-b bg-white">
          <Container className="py-10 sm:py-14">
            <div className="flex flex-wrap items-start gap-5">
              <Skeleton className="size-14 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96 max-w-full" />
                <Skeleton className="h-3.5 w-full max-w-2xl" />
                <Skeleton className="h-3.5 w-3/4 max-w-xl" />
              </div>
            </div>
          </Container>
        </section>
        <Container className="py-10 sm:py-14">
          <Skeleton className="h-6 w-40" />
          <ListRowsSkeleton className="mt-5" count={3} />
        </Container>
      </SkeletonGroup>
    );
  }

  if (query.isError) {
    return (
      <Container className="py-14">
        <ErrorState
          title={
            query.error?.response?.status === 404
              ? t('company.notFound')
              : t('company.couldNotLoad')
          }
          message={errorMessage(query.error)}
          onRetry={query.error?.response?.status === 404 ? undefined : query.refetch}
        />
        <div className="mt-4 text-center">
          <Button variant="outline" to="/jobs">
            {t('company.browseAll')}
          </Button>
        </div>
      </Container>
    );
  }

  const { company, jobs } = query.data;

  return (
    <>
      <section className="border-ink-200 border-b bg-white">
        <Container className="py-10 sm:py-14">
          <div className="flex flex-wrap items-start gap-5">
            <CompanyLogo company={company} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="text-title text-2xl sm:text-3xl">{company.name}</h1>

              <div className="text-ink-500 mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {company.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden="true" />
                    {company.location}
                  </span>
                )}
                {company.industry && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="size-4" aria-hidden="true" />
                    {company.industry}
                  </span>
                )}
                {company.size && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4" aria-hidden="true" />
                    {t('common.people', { size: company.size })}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-brand-700 inline-flex items-center gap-1.5"
                  >
                    <Globe className="size-4" aria-hidden="true" />
                    {t('company.website')}
                  </a>
                )}
              </div>

              {company.description && (
                <p className="prose-plain mt-5 max-w-3xl text-sm">{company.description}</p>
              )}
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        <h2 className="text-xl">
          {t('company.openRolesCount')}{' '}
          <span className="text-ink-400 font-normal tabular-nums">({jobs.length})</span>
        </h2>

        <div className="mt-5 space-y-4">
          {jobs.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={t('company.noOpenRoles')}
              message={t('company.noOpenRolesHint', { company: company.name })}
              action={<Button to="/jobs">{t('company.browseOther')}</Button>}
            />
          ) : (
            jobs.map((job) => <JobCard key={job._id} job={{ ...job, company }} />)
          )}
        </div>
      </Container>
    </>
  );
}

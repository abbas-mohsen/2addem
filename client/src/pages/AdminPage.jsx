import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Search, ShieldAlert, Trash2, UserX, Users } from 'lucide-react';
import { adminApi } from '../api/endpoints.js';
import { errorMessage } from '../api/client.js';
import { useAuthStore } from '../context/authStore.js';
import { Container, PageHeader } from '../components/layout/AppLayout.jsx';
import { Badge, JOB_STATUS_TONES } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input, Select } from '../components/ui/Field.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States.jsx';
import { ListRowsSkeleton, TableSkeleton } from '../components/ui/Skeletons.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';

import { cn } from '../lib/cn.js';
import { useFormat } from '../hooks/useFormat.js';
import { useT } from '../i18n/index.jsx';

const TABS = [
  { value: 'users', key: 'admin.users' },
  { value: 'jobs', key: 'admin.jobs' },
  { value: 'companies', key: 'admin.companies' },
];

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.value === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'users';

  const t = useT();
  const overview = useQuery({ queryKey: ['admin-overview'], queryFn: adminApi.overview });
  const stats = overview.data?.stats;

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        title={t('admin.title')}
        description={t('admin.subtitle')}
      />

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label={t('admin.users')}
          value={stats?.users.total}
          hint={
            stats
              ? t('admin.candidatesRecruiters', {
                  candidates: stats.users.candidates,
                  recruiters: stats.users.recruiters,
                })
              : null
          }
          loading={overview.isPending}
        />
        <StatCard
          icon={UserX}
          label={t('admin.deactivated')}
          value={stats?.users.deactivated}
          loading={overview.isPending}
        />
        <StatCard
          icon={Building2}
          label={t('admin.companies')}
          value={stats?.companies}
          loading={overview.isPending}
        />
        <StatCard
          icon={ShieldAlert}
          label={t('admin.jobs')}
          value={stats?.jobs.total}
          hint={stats ? t('admin.publishedCount', { count: stats.jobs.published }) : null}
          loading={overview.isPending}
        />
      </div>

      <div className="border-ink-200 mt-8 flex gap-1 border-b" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setSearchParams({ tab: item.value })}
            className={cn(
              '-mb-px border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
              tab === item.value
                ? 'border-brand-600 text-brand-700'
                : 'text-ink-500 hover:text-ink-900 border-transparent'
            )}
          >
            {t(item.key)}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'users' && <UsersTab />}
        {tab === 'jobs' && <JobsTab />}
        {tab === 'companies' && <CompaniesTab />}
      </div>
    </Container>
  );
}

function StatCard({ icon: Icon, label, value, hint, loading }) {
  return (
    <div className="border-ink-200 rounded-card shadow-card border bg-white p-5">
      <div className="flex items-center gap-2">
        <Icon className="text-ink-400 size-4" aria-hidden="true" />
        <p className="text-ink-500 text-sm">{label}</p>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className="text-ink-900 mt-1.5 text-2xl font-semibold tabular-nums">{value ?? 0}</p>
      )}
      {hint && !loading && <p className="text-ink-400 mt-1 text-xs">{hint}</p>}
    </div>
  );
}

function Toolbar({ children }) {
  return <div className="mb-4 flex flex-wrap gap-3">{children}</div>;
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative min-w-56 flex-1">
      <Search
        className="text-ink-400 pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        type="search"
        className="ps-9"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function UsersTab() {
  const format = useFormat();
  const queryClient = useQueryClient();
  const t = useT();
  const currentUser = useAuthStore((state) => state.user);

  const [filters, setFilters] = useState({ q: '', role: '', status: '' });
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin-users', filters, page],
    queryFn: () =>
      adminApi.users({
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
        page,
        limit: 20,
      }),
    placeholderData: (previous) => previous,
  });

  const setActive = useMutation({
    mutationFn: adminApi.setUserActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });

  const users = query.data?.items ?? [];

  return (
    <>
      <Toolbar>
        <SearchInput
          placeholder={t('admin.searchUsers')}
          value={filters.q}
          onChange={(q) => {
            setFilters((c) => ({ ...c, q }));
            setPage(1);
          }}
        />
        <Select
          aria-label={t('admin.colRole')}
          className="w-40"
          value={filters.role}
          onChange={(e) => {
            setFilters((c) => ({ ...c, role: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">{t('admin.allRoles')}</option>
          <option value="candidate">{t('admin.roleCandidates')}</option>
          <option value="recruiter">{t('admin.roleRecruiters')}</option>
          <option value="admin">{t('admin.roleAdmins')}</option>
        </Select>
        <Select
          aria-label={t('admin.colStatus')}
          className="w-40"
          value={filters.status}
          onChange={(e) => {
            setFilters((c) => ({ ...c, status: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">{t('common.anyStatus')}</option>
          <option value="active">{t('admin.statusActive')}</option>
          <option value="inactive">{t('admin.statusInactive')}</option>
        </Select>
      </Toolbar>

      {setActive.isError && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage(setActive.error)}
        </p>
      )}

      {query.isPending && <TableSkeleton rows={6} />}
      {query.isError && <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />}
      {query.isSuccess && users.length === 0 && (
        <EmptyState icon={Users} title={t('admin.noUsers')} />
      )}

      {users.length > 0 && (
        <div className="border-ink-200 rounded-card overflow-x-auto border bg-white">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-ink-200 text-ink-500 border-b text-start text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">{t('admin.colName')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.colRole')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.colCompany')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.colJoined')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.colStatus')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-ink-100 divide-y">
              {users.map((user) => (
                <tr key={user._id} className={cn(!user.isActive && 'bg-ink-50/60')}>
                  <td className="px-4 py-3">
                    <p className="text-ink-900 font-medium">{user.name}</p>
                    <p className="text-ink-500 text-xs">{user.email}</p>
                  </td>
                  <td className="text-ink-600 px-4 py-3">{t(`roles.${user.role}`)}</td>
                  <td className="text-ink-600 px-4 py-3">
                    {user.company ? (
                      <Link
                        to={`/companies/${user.company.slug}`}
                        className="hover:text-brand-700"
                      >
                        {user.company.name}
                      </Link>
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </td>
                  <td className="text-ink-500 px-4 py-3">{format.date(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <Badge tone="success">{t('admin.statusActive')}</Badge>
                    ) : (
                      <Badge tone="danger">{t('admin.statusInactive')}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    {String(user._id) !== String(currentUser?._id) && user.role !== 'admin' && (
                      <Button
                        variant={user.isActive ? 'danger' : 'outline'}
                        size="sm"
                        loading={setActive.isPending && setActive.variables?.id === user._id}
                        onClick={() =>
                          setActive.mutate({ id: user._id, isActive: !user.isActive })
                        }
                      >
                        {user.isActive ? t('admin.deactivate') : t('admin.reactivate')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <Pagination meta={query.data?.meta} onPageChange={setPage} />
      </div>
    </>
  );
}

function JobsTab() {
  const format = useFormat();
  const queryClient = useQueryClient();
  const t = useT();
  const [filters, setFilters] = useState({ q: '', status: '' });
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin-jobs', filters, page],
    queryFn: () =>
      adminApi.jobs({
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
        page,
        limit: 20,
      }),
    placeholderData: (previous) => previous,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
  };

  const takeDown = useMutation({ mutationFn: adminApi.takeDownJob, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: adminApi.deleteJob, onSuccess: invalidate });

  const jobs = query.data?.items ?? [];
  const actionError = [takeDown, remove].find((m) => m.isError);

  return (
    <>
      <Toolbar>
        <SearchInput
          placeholder={t('admin.searchJobs')}
          value={filters.q}
          onChange={(q) => {
            setFilters((c) => ({ ...c, q }));
            setPage(1);
          }}
        />
        <Select
          aria-label={t('admin.colStatus')}
          className="w-40"
          value={filters.status}
          onChange={(e) => {
            setFilters((c) => ({ ...c, status: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">{t('common.anyStatus')}</option>
          <option value="published">{t('jobStatus.published')}</option>
          <option value="draft">{t('jobStatus.draft')}</option>
          <option value="closed">{t('jobStatus.closed')}</option>
        </Select>
      </Toolbar>

      {actionError && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage(actionError.error)}
        </p>
      )}

      {query.isPending && <ListRowsSkeleton count={4} />}
      {query.isError && <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />}
      {query.isSuccess && jobs.length === 0 && (
        <EmptyState icon={ShieldAlert} title={t('admin.noJobs')} />
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <article
            key={job._id}
            className="border-ink-200 rounded-card flex flex-wrap items-start justify-between gap-4 border bg-white p-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">
                  {job.status === 'draft' ? (
                    job.title
                  ) : (
                    <Link to={`/jobs/${job.slug}`} className="hover:text-brand-700">
                      {job.title}
                    </Link>
                  )}
                </h3>
                <Badge tone={JOB_STATUS_TONES[job.status]}>{format.jobStatus(job.status)}</Badge>
              </div>
              <p className="text-ink-500 mt-1 text-xs">
                {t('admin.postedBy', {
                  company: job.company?.name ?? '',
                  author: job.createdBy?.name ?? '',
                  date: format.date(job.createdAt),
                })}
              </p>
              <p className="text-ink-500 mt-1 text-xs">
                {t('admin.jobMeta', {
                  applicants: t('common.applicants', { count: job.applicationCount }),
                  views: t('common.views', { count: job.views }),
                })}
              </p>
            </div>

            <div className="flex gap-2">
              {job.status !== 'closed' && (
                <Button
                  variant="danger"
                  size="sm"
                  loading={takeDown.isPending && takeDown.variables === job._id}
                  onClick={() => takeDown.mutate(job._id)}
                >
                  {t('admin.takeDown')}
                </Button>
              )}
              {job.applicationCount === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  loading={remove.isPending && remove.variables === job._id}
                  onClick={() => remove.mutate(job._id)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  {t('admin.delete')}
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4">
        <Pagination meta={query.data?.meta} onPageChange={setPage} />
      </div>
    </>
  );
}

function CompaniesTab() {
  const format = useFormat();
  const t = useT();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin-companies', page],
    queryFn: () => adminApi.companies({ page, limit: 20 }),
    placeholderData: (previous) => previous,
  });

  const companies = query.data?.items ?? [];

  return (
    <>
      {query.isPending && <ListRowsSkeleton count={4} />}
      {query.isError && <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />}
      {query.isSuccess && companies.length === 0 && (
        <EmptyState icon={Building2} title={t('admin.noCompanies')} />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {companies.map((company) => (
          <article key={company._id} className="border-ink-200 rounded-card border bg-white p-4">
            <h3 className="text-sm font-semibold">
              <Link to={`/companies/${company.slug}`} className="hover:text-brand-700">
                {company.name}
              </Link>
            </h3>
            <p className="text-ink-500 mt-1 text-xs">
              {[
                company.industry,
                company.location,
                company.size && t('common.people', { size: company.size }),
              ]
                .filter(Boolean)
                .join(' · ') || t('admin.noProfileDetails')}
            </p>
            <p className="text-ink-400 mt-1 text-xs">
              {t('admin.createdRelative', { date: format.date(company.createdAt) })}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4">
        <Pagination meta={query.data?.meta} onPageChange={setPage} />
      </div>
    </>
  );
}

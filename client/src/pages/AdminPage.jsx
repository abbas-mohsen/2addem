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
import { formatDate } from '../lib/format.js';
import { cn } from '../lib/cn.js';

const TABS = [
  { value: 'users', label: 'Users' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'companies', label: 'Companies' },
];

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.value === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'users';

  const overview = useQuery({ queryKey: ['admin-overview'], queryFn: adminApi.overview });
  const stats = overview.data?.stats;

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        title="Moderation"
        description="Every account, company and job on the platform. Act carefully — people depend on these records."
      />

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Users"
          value={stats?.users.total}
          hint={stats ? `${stats.users.candidates} candidates · ${stats.users.recruiters} recruiters` : null}
          loading={overview.isPending}
        />
        <StatCard
          icon={UserX}
          label="Deactivated"
          value={stats?.users.deactivated}
          loading={overview.isPending}
        />
        <StatCard
          icon={Building2}
          label="Companies"
          value={stats?.companies}
          loading={overview.isPending}
        />
        <StatCard
          icon={ShieldAlert}
          label="Jobs"
          value={stats?.jobs.total}
          hint={stats ? `${stats.jobs.published} published` : null}
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
            {item.label}
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
        className="text-ink-400 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        type="search"
        className="pl-9"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function UsersTab() {
  const queryClient = useQueryClient();
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
          placeholder="Search name or email"
          value={filters.q}
          onChange={(q) => {
            setFilters((c) => ({ ...c, q }));
            setPage(1);
          }}
        />
        <Select
          aria-label="Role"
          className="w-40"
          value={filters.role}
          onChange={(e) => {
            setFilters((c) => ({ ...c, role: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          <option value="candidate">Candidates</option>
          <option value="recruiter">Recruiters</option>
          <option value="admin">Admins</option>
        </Select>
        <Select
          aria-label="Status"
          className="w-40"
          value={filters.status}
          onChange={(e) => {
            setFilters((c) => ({ ...c, status: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
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
        <EmptyState icon={Users} title="No users match those filters" />
      )}

      {users.length > 0 && (
        <div className="border-ink-200 rounded-card overflow-x-auto border bg-white">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-ink-200 text-ink-500 border-b text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
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
                  <td className="text-ink-600 px-4 py-3 capitalize">{user.role}</td>
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
                  <td className="text-ink-500 px-4 py-3">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="danger">Deactivated</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {String(user._id) !== String(currentUser?._id) && user.role !== 'admin' && (
                      <Button
                        variant={user.isActive ? 'danger' : 'outline'}
                        size="sm"
                        loading={setActive.isPending && setActive.variables?.id === user._id}
                        onClick={() =>
                          setActive.mutate({ id: user._id, isActive: !user.isActive })
                        }
                      >
                        {user.isActive ? 'Deactivate' : 'Reactivate'}
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
  const queryClient = useQueryClient();
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
          placeholder="Search job titles"
          value={filters.q}
          onChange={(q) => {
            setFilters((c) => ({ ...c, q }));
            setPage(1);
          }}
        />
        <Select
          aria-label="Job status"
          className="w-40"
          value={filters.status}
          onChange={(e) => {
            setFilters((c) => ({ ...c, status: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
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
        <EmptyState icon={ShieldAlert} title="No jobs match those filters" />
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
                <Badge tone={JOB_STATUS_TONES[job.status]} className="capitalize">
                  {job.status}
                </Badge>
              </div>
              <p className="text-ink-500 mt-1 text-xs">
                {job.company?.name} · posted by {job.createdBy?.name} ·{' '}
                {formatDate(job.createdAt)}
              </p>
              <p className="text-ink-500 mt-1 text-xs">
                {job.applicationCount} applicant{job.applicationCount === 1 ? '' : 's'} ·{' '}
                {job.views} views
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
                  Take down
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
                  Delete
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
        <EmptyState icon={Building2} title="No companies yet" />
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
              {[company.industry, company.location, company.size && `${company.size} people`]
                .filter(Boolean)
                .join(' · ') || 'No profile details yet'}
            </p>
            <p className="text-ink-400 mt-1 text-xs">Created {formatDate(company.createdAt)}</p>
          </article>
        ))}
      </div>

      <div className="mt-4">
        <Pagination meta={query.data?.meta} onPageChange={setPage} />
      </div>
    </>
  );
}

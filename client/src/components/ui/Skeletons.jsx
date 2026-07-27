import { Skeleton, SkeletonGroup } from './States.jsx';
import { Container } from '../layout/AppLayout.jsx';
import { cn } from '../../lib/cn.js';

/* Each skeleton mirrors the layout it stands in for, so the page does not jump
   when real content arrives. Generic spinners are only used for actions. */

export function PageHeaderSkeleton({ withActions = true }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2.5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {withActions && <Skeleton className="h-11 w-32 rounded-lg" />}
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="border-ink-200 rounded-card border bg-white p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-7 w-14" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export function ListRowsSkeleton({ count = 4, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="border-ink-200 rounded-card border bg-white p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="size-11 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton className="hidden h-8 w-24 rounded-lg sm:block" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function JobDetailSkeleton() {
  return (
    <SkeletonGroup label="Loading role…">
      <Container className="py-8 sm:py-12">
        <Skeleton className="h-4 w-24" />

        <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div>
            <div className="border-ink-200 rounded-card border bg-white p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <Skeleton className="size-14 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-4 w-40" />
                ))}
              </div>

              <div className="mt-6 flex gap-2">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className={cn('h-3.5', index % 3 === 2 ? 'w-2/3' : 'w-full')} />
              ))}
            </div>
          </div>

          <div className="border-ink-200 rounded-card h-fit border bg-white p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-3/4" />
            <Skeleton className="mt-4 h-11 w-full rounded-lg" />
          </div>
        </div>
      </Container>
    </SkeletonGroup>
  );
}

export function BoardSkeleton({ columns = 5 }) {
  return (
    <SkeletonGroup label="Loading pipeline…">
      <div className="-mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6">
        <div className="flex min-w-max items-start gap-3">
          {Array.from({ length: columns }, (_, column) => (
            <div key={column} className="border-ink-200 bg-ink-50/60 w-72 shrink-0 rounded-xl border p-2.5">
              <div className="flex items-center gap-2 px-1 pb-3">
                <Skeleton className="size-2 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="ml-auto h-5 w-6 rounded-full" />
              </div>

              <div className="space-y-2">
                {Array.from({ length: column % 2 === 0 ? 2 : 1 }, (_, card) => (
                  <div key={card} className="border-ink-200 rounded-lg border bg-white p-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-7 rounded-full" />
                      <Skeleton className="h-3.5 w-28" />
                    </div>
                    <Skeleton className="mt-2.5 h-3 w-full" />
                    <Skeleton className="mt-2 h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonGroup>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <SkeletonGroup label="Loading…">
      <div className="border-ink-200 rounded-card overflow-hidden border bg-white">
        <div className="border-ink-200 flex gap-6 border-b px-4 py-3">
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton key={index} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="border-ink-100 flex items-center gap-6 border-b px-4 py-4 last:border-0">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            {Array.from({ length: columns - 2 }, (_, index) => (
              <Skeleton key={index} className="h-3.5 flex-1" />
            ))}
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}

export function FormSkeleton({ fields = 5 }) {
  return (
    <SkeletonGroup label="Loading form…">
      <div className="border-ink-200 rounded-card space-y-5 border bg-white p-5 sm:p-7">
        {Array.from({ length: fields }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className={cn('rounded-lg', index === 1 ? 'h-32' : 'h-11')} />
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-2">
          <Skeleton className="h-11 w-24 rounded-lg" />
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>
      </div>
    </SkeletonGroup>
  );
}

/* Shown while the session is being restored, in place of a bare spinner. */
export function PageBootSkeleton() {
  return (
    <SkeletonGroup label="Loading…">
      <Container className="py-10 sm:py-14">
        <PageHeaderSkeleton />
        <div className="mt-7">
          <StatCardsSkeleton count={3} />
        </div>
        <ListRowsSkeleton className="mt-6" count={3} />
      </Container>
    </SkeletonGroup>
  );
}

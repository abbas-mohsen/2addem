import { Link } from 'react-router-dom';
import { Banknote, MapPin } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Skeleton } from '../../components/ui/States.jsx';
import { CompanyLogo } from '../../components/ui/Logo.jsx';
import {
  EMPLOYMENT_LABELS,
  REMOTE_LABELS,
  formatRelative,
  formatSalary,
} from '../../lib/format.js';

export function JobCard({ job }) {
  const salary = formatSalary(job);

  return (
    <article className="border-ink-200 rounded-card shadow-card hover:shadow-lift group relative border bg-white p-5 transition-shadow">
      <div className="flex items-start gap-4">
        <CompanyLogo company={job.company} />

        <div className="min-w-0 flex-1">
          <h3 className="text-base leading-snug font-semibold">
            {/* Stretched link keeps the whole card clickable without nesting anchors. */}
            <Link to={`/jobs/${job.slug}`} className="after:absolute after:inset-0">
              {job.title}
            </Link>
          </h3>
          <p className="text-ink-600 mt-0.5 text-sm">{job.company?.name}</p>

          <div className="text-ink-500 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden="true" />
              {job.location || REMOTE_LABELS[job.remote]}
            </span>
            {salary && (
              <span className="inline-flex items-center gap-1.5">
                <Banknote className="size-3.5" aria-hidden="true" />
                {salary}
              </span>
            )}
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <Badge tone="brand">{REMOTE_LABELS[job.remote]}</Badge>
            {job.remoteAbroad && <Badge tone="success">Remote · paid from abroad</Badge>}
            <Badge tone="outline">{EMPLOYMENT_LABELS[job.employmentType]}</Badge>
            {job.skills?.slice(0, 3).map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>
        </div>

        <time
          className="text-ink-400 hidden shrink-0 text-xs sm:block"
          dateTime={job.publishedAt ?? job.createdAt}
        >
          {formatRelative(job.publishedAt ?? job.createdAt)}
        </time>
      </div>
    </article>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="border-ink-200 rounded-card border bg-white p-5">
      <div className="flex gap-4">
        <Skeleton className="size-11 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <Skeleton className="hidden h-3 w-16 sm:block" />
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn.js';

export function Logo({ className }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2', className)}>
      <span className="bg-brand-600 flex size-8 items-center justify-center rounded-lg">
        <svg viewBox="0 0 24 24" className="size-4 text-white" aria-hidden="true">
          <path
            d="M4 7h16M4 12h10M4 17h6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="text-ink-900 text-lg font-semibold tracking-tight">Hirefold</span>
    </Link>
  );
}

export function CompanyLogo({ company, size = 'md', className }) {
  const dimensions = size === 'lg' ? 'size-14 text-lg' : size === 'sm' ? 'size-8 text-xs' : 'size-11 text-sm';

  if (company?.logoUrl) {
    return (
      <img
        src={company.logoUrl}
        alt=""
        className={cn('rounded-lg border-ink-200 border object-cover', dimensions, className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-brand-50 text-brand-700 flex shrink-0 items-center justify-center rounded-lg font-semibold',
        dimensions,
        className
      )}
    >
      {(company?.name ?? '?').charAt(0).toUpperCase()}
    </span>
  );
}

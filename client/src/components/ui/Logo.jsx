import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn.js';

/* The mark is the Arabizi "2" of 2addem (قدّم, "apply") whose base stroke runs
   out into an arrow — the root ق-د-م means to step forward. Drawn as geometry
   rather than text so it never depends on a font being available. */
export function LogoMark({ size = 32, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="2addem"
      className={cn('shrink-0', className)}
    >
      <rect width="40" height="40" rx="10" className="fill-brand-600" />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white"
      >
        <path d="M12.6,15 C12.6,11 15.8,8.2 20,8.2 C24.2,8.2 27.4,10.9 27.4,14.8 C27.4,18.2 25.1,20.4 21.9,23 L12.4,30.6" />
        <path d="M12.4,30.6 L23.4,30.6" />
      </g>
      <path d="M23,27.4 L30.2,30.6 L23,33.8 Z" className="fill-white" />
    </svg>
  );
}

export function Wordmark({ className }) {
  return (
    <span className={cn('text-ink-900 text-lg font-semibold tracking-tight', className)}>
      <span className="text-brand-600">2</span>addem
    </span>
  );
}

export function Logo({ className }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2.5', className)} aria-label="2addem home">
      <LogoMark />
      <Wordmark />
    </Link>
  );
}

export function CompanyLogo({ company, size = 'md', className }) {
  const dimensions =
    size === 'lg' ? 'size-14 text-lg' : size === 'sm' ? 'size-8 text-xs' : 'size-11 text-sm';

  if (company?.logoUrl) {
    return (
      <img
        src={company.logoUrl}
        alt=""
        className={cn('border-ink-200 rounded-lg border object-cover', dimensions, className)}
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

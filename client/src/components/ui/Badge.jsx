import { cn } from '../../lib/cn.js';

const TONES = {
  neutral: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  outline: 'border border-ink-200 text-ink-600',
};

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export const STAGE_TONES = {
  applied: 'neutral',
  screening: 'brand',
  interview: 'warning',
  offer: 'success',
  hired: 'success',
  rejected: 'danger',
};

export const JOB_STATUS_TONES = {
  draft: 'neutral',
  published: 'success',
  closed: 'danger',
};

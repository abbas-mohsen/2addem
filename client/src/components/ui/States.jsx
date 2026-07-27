import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { Button } from './Button.jsx';

export function Spinner({ className }) {
  return <Loader2 className={cn('text-ink-400 size-5 animate-spin', className)} aria-hidden="true" />;
}

export function LoadingState({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-16', className)} role="status">
      <Spinner />
      <span className="text-ink-500 text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }) {
  return (
    <div
      className={cn(
        'border-ink-200 rounded-card flex flex-col items-center gap-3 border border-dashed bg-white px-6 py-14 text-center',
        className
      )}
      role="alert"
    >
      <AlertTriangle className="size-6 text-red-500" aria-hidden="true" />
      <div>
        <p className="text-ink-900 font-medium">{title}</p>
        {message && <p className="text-ink-500 mt-1 text-sm">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, action, className }) {
  return (
    <div
      className={cn(
        'border-ink-200 rounded-card flex flex-col items-center gap-3 border border-dashed bg-white px-6 py-14 text-center',
        className
      )}
    >
      {Icon && (
        <span className="bg-brand-50 text-brand-600 flex size-11 items-center justify-center rounded-full">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <div>
        <p className="text-ink-900 font-medium">{title}</p>
        {message && <p className="text-ink-500 mx-auto mt-1 max-w-sm text-sm">{message}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('bg-ink-100 animate-pulse rounded-md', className)} />;
}

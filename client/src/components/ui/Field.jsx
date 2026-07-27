import { useId } from 'react';
import { cn } from '../../lib/cn.js';

export function Field({ label, error, hint, required, children, className }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-ink-800 block text-sm font-medium">
          {label}
          {required && <span className="text-brand-600 ml-0.5">*</span>}
        </label>
      )}

      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}

      {hint && !error && (
        <p id={`${id}-hint`} className="text-ink-500 text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, error, ...props }) {
  return <input className={cn('field-input', error && 'border-red-400', className)} {...props} />;
}

export function Textarea({ className, error, rows = 5, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn('field-input resize-y', error && 'border-red-400', className)}
      {...props}
    />
  );
}

export function Select({ className, error, children, ...props }) {
  return (
    <select className={cn('field-input pr-9', error && 'border-red-400', className)} {...props}>
      {children}
    </select>
  );
}

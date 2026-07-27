import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, UserRound } from 'lucide-react';
import { homePathFor, useAuthStore } from '../context/authStore.js';
import { errorMessage, fieldErrors } from '../api/client.js';
import { Button } from '../components/ui/Button.jsx';
import { Field, Input } from '../components/ui/Field.jsx';
import { AuthShell } from '../components/layout/AuthShell.jsx';
import { cn } from '../lib/cn.js';

const ROLES = [
  {
    value: 'candidate',
    label: "I'm looking for a job",
    description: 'Apply and track your applications',
    icon: UserRound,
  },
  {
    value: 'recruiter',
    label: "I'm hiring",
    description: 'Post roles and manage applicants',
    icon: Briefcase,
  },
];

export function RegisterPage() {
  const signUp = useAuthStore((state) => state.signUp);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    role: searchParams.get('role') === 'recruiter' ? 'recruiter' : 'candidate',
    name: '',
    email: '',
    password: '',
    companyName: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isRecruiter = form.role === 'recruiter';

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Tell us your name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    // Mirrors the server rule so users are not bounced by a round trip.
    if (form.password.length < 8) next.password = 'Use at least 8 characters';
    if (isRecruiter && form.companyName.trim().length < 2) {
      next.companyName = 'Enter your company name';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(isRecruiter ? { companyName: form.companyName.trim() } : {}),
      };
      const user = await signUp(payload);
      navigate(homePathFor(user), { replace: true });
    } catch (error) {
      setErrors(fieldErrors(error));
      setSubmitError(errorMessage(error, 'Could not create your account.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="One account, whichever side of the table you are on."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-brand-700 font-medium hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="text-ink-800 mb-2 text-sm font-medium">I want to…</legend>
          {ROLES.map((role) => {
            const Icon = role.icon;
            const selected = form.role === role.value;
            return (
              <label
                key={role.value}
                className={cn(
                  'flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition',
                  selected
                    ? 'border-brand-500 bg-brand-50/60 ring-brand-100 ring-2'
                    : 'border-ink-200 hover:border-ink-300'
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={selected}
                  onChange={update('role')}
                  className="sr-only"
                />
                <span className="flex items-center gap-2">
                  <Icon
                    className={cn('size-4', selected ? 'text-brand-600' : 'text-ink-400')}
                    aria-hidden="true"
                  />
                  <span className="text-ink-900 text-sm font-medium">{role.label}</span>
                </span>
                <span className="text-ink-500 text-xs">{role.description}</span>
              </label>
            );
          })}
        </fieldset>

        {submitError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
            {submitError}
          </p>
        )}

        <Field label="Full name" error={errors.name} required>
          {(props) => (
            <Input
              {...props}
              autoComplete="name"
              placeholder="Ada Lovelace"
              value={form.name}
              error={errors.name}
              onChange={update('name')}
            />
          )}
        </Field>

        {isRecruiter && (
          <Field label="Company" error={errors.companyName} required>
            {(props) => (
              <Input
                {...props}
                autoComplete="organization"
                placeholder="Northwind Labs"
                value={form.companyName}
                error={errors.companyName}
                onChange={update('companyName')}
              />
            )}
          </Field>
        )}

        <Field label="Email" error={errors.email} required>
          {(props) => (
            <Input
              {...props}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={form.email}
              error={errors.email}
              onChange={update('email')}
            />
          )}
        </Field>

        <Field
          label="Password"
          error={errors.password}
          hint="At least 8 characters."
          required
        >
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.password}
              error={errors.password}
              onChange={update('password')}
            />
          )}
        </Field>

        <Button type="submit" className="w-full" loading={submitting}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

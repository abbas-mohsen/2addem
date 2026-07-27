import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { homePathFor, useAuthStore } from '../context/authStore.js';
import { errorMessage } from '../api/client.js';
import { Button } from '../components/ui/Button.jsx';
import { Field, Input } from '../components/ui/Field.jsx';
import { AuthShell } from '../components/layout/AuthShell.jsx';
import { useT } from '../i18n/index.jsx';

export function LoginPage() {
  const signIn = useAuthStore((state) => state.signIn);
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = t('auth.errors.email');
    if (!form.password) next.password = t('auth.errors.password');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const user = await signIn(form);
      navigate(location.state?.from?.pathname ?? homePathFor(user), { replace: true });
    } catch (error) {
      setSubmitError(errorMessage(error, t('auth.errors.signInFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.welcomeBack')}
      subtitle={t('auth.signInSubtitle')}
      footer={
        <>
          {t('auth.newHere')}{' '}
          <Link to="/register" className="text-brand-700 font-medium hover:underline">
            {t('auth.createOne')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {submitError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
            {submitError}
          </p>
        )}

        <Field label={t('auth.email')} error={errors.email} required>
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

        <Field label={t('auth.password')} error={errors.password} required>
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              error={errors.password}
              onChange={update('password')}
            />
          )}
        </Field>

        <Button type="submit" className="w-full" loading={submitting}>
          {t('auth.signInAction')}
        </Button>
      </form>
    </AuthShell>
  );
}

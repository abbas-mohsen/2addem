import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ExternalLink } from 'lucide-react';
import { companiesApi } from '../api/endpoints.js';
import { errorMessage, fieldErrors } from '../api/client.js';
import { Container, PageHeader } from '../components/layout/AppLayout.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Field, Input, Select, Textarea } from '../components/ui/Field.jsx';
import { CompanyLogo } from '../components/ui/Logo.jsx';
import { ErrorState } from '../components/ui/States.jsx';
import { FormSkeleton, PageHeaderSkeleton } from '../components/ui/Skeletons.jsx';
import { COMPANY_SIZES } from '../lib/format.js';
import { useT } from '../i18n/index.jsx';

export function CompanyProfilePage() {
  const query = useQuery({ queryKey: ['my-company'], queryFn: companiesApi.mine });

  if (query.isPending) {
    return (
      <Container className="py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <PageHeaderSkeleton />
          <div className="mt-6">
            <FormSkeleton fields={6} />
          </div>
        </div>
      </Container>
    );
  }

  if (query.isError) {
    return (
      <Container className="py-14">
        <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
      </Container>
    );
  }

  return <CompanyForm company={query.data.company} />;
}

function CompanyForm({ company }) {
  const queryClient = useQueryClient();
  const t = useT();

  const [form, setForm] = useState({
    name: company?.name ?? '',
    logoUrl: company?.logoUrl ?? '',
    website: company?.website ?? '',
    description: company?.description ?? '',
    location: company?.location ?? '',
    industry: company?.industry ?? '',
    size: company?.size ?? '1-10',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: companiesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      queryClient.invalidateQueries({ queryKey: ['company', company?.slug] });
      setSaved(true);
    },
    onError: (error) => {
      setErrors(fieldErrors(error));
      setSubmitError(errorMessage(error, t('company.saveFailed')));
    },
  });

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSaved(false);
  };

  const isUrl = (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitError(null);

    const next = {};
    if (form.name.trim().length < 2) next.name = t('company.nameError');
    if (form.website && !isUrl(form.website)) next.website = t('company.urlError');
    if (form.logoUrl && !isUrl(form.logoUrl)) next.logoUrl = t('company.urlError');

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    save.mutate({
      name: form.name.trim(),
      logoUrl: form.logoUrl.trim(),
      website: form.website.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      industry: form.industry.trim(),
      size: form.size,
    });
  };

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title={t('company.profileTitle')}
          description={t('company.profileSubtitle')}
          actions={
            company?.slug && (
              <Button variant="outline" as="a" href={`/companies/${company.slug}`} target="_blank">
                {t('company.viewCareerPage')}
                <ExternalLink className="size-4" aria-hidden="true" />
              </Button>
            )
          }
        />

        <form
          onSubmit={handleSubmit}
          className="border-ink-200 rounded-card shadow-card mt-6 space-y-5 border bg-white p-5 sm:p-7"
        >
          {submitError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
              {submitError}
            </p>
          )}

          {saved && !save.isPending && (
            <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
              <Check className="size-4" aria-hidden="true" />
              {t('company.saved')}
            </p>
          )}

          <div className="flex items-center gap-4">
            <CompanyLogo company={{ ...company, ...form }} size="lg" />
            <div className="flex-1">
              <Field label={t('company.logoUrl')} error={errors.logoUrl} hint={t('company.logoHint')}>
                {(props) => (
                  <Input
                    {...props}
                    placeholder="https://example.com/logo.png"
                    value={form.logoUrl}
                    error={errors.logoUrl}
                    onChange={update('logoUrl')}
                  />
                )}
              </Field>
            </div>
          </div>

          <Field label={t('company.name')} error={errors.name} required>
            {(props) => (
              <Input {...props} value={form.name} error={errors.name} onChange={update('name')} />
            )}
          </Field>

          <Field
            label={t('company.about')}
            hint={t('company.aboutHint')}
          >
            {(props) => (
              <Textarea
                {...props}
                rows={7}
                maxLength={6000}
                placeholder={t('company.aboutPlaceholder')}
                value={form.description}
                onChange={update('description')}
              />
            )}
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('company.website')} error={errors.website}>
              {(props) => (
                <Input
                  {...props}
                  placeholder="https://example.com"
                  value={form.website}
                  error={errors.website}
                  onChange={update('website')}
                />
              )}
            </Field>

            <Field label={t('company.headquarters')}>
              {(props) => (
                <Input
                  {...props}
                  placeholder="Beirut, Lebanon"
                  value={form.location}
                  onChange={update('location')}
                />
              )}
            </Field>

            <Field label={t('company.industry')}>
              {(props) => (
                <Input
                  {...props}
                  placeholder="Software"
                  value={form.industry}
                  onChange={update('industry')}
                />
              )}
            </Field>

            <Field label={t('company.size')}>
              {(props) => (
                <Select {...props} value={form.size} onChange={update('size')}>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {t('common.people', { size })}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <div className="border-ink-200 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" to="/recruiter">
              {t('company.backToDashboard')}
            </Button>
            <Button type="submit" loading={save.isPending}>
              {t('common.saveChanges')}
            </Button>
          </div>
        </form>

        {company?.slug && (
          <p className="text-ink-500 mt-4 text-sm">
            {t('company.publicPage')}{' '}
            <Link to={`/companies/${company.slug}`} className="text-brand-700 hover:underline">
              /companies/{company.slug}
            </Link>
          </p>
        )}
      </div>
    </Container>
  );
}

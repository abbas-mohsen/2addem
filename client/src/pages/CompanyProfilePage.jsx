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
import { ErrorState, LoadingState } from '../components/ui/States.jsx';

const SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

export function CompanyProfilePage() {
  const query = useQuery({ queryKey: ['my-company'], queryFn: companiesApi.mine });

  if (query.isPending) return <LoadingState label="Loading company…" />;

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
      setSubmitError(errorMessage(error, 'Could not save your company profile.'));
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
    if (form.name.trim().length < 2) next.name = 'Company name is required';
    if (form.website && !isUrl(form.website)) next.website = 'Enter a full URL, including https://';
    if (form.logoUrl && !isUrl(form.logoUrl)) next.logoUrl = 'Enter a full URL, including https://';

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
          title="Company profile"
          description="This is what candidates see on your public career page and next to every job."
          actions={
            company?.slug && (
              <Button variant="outline" as="a" href={`/companies/${company.slug}`} target="_blank">
                View career page
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
              Saved. Your career page is up to date.
            </p>
          )}

          <div className="flex items-center gap-4">
            <CompanyLogo company={{ ...company, ...form }} size="lg" />
            <div className="flex-1">
              <Field label="Logo URL" error={errors.logoUrl} hint="Square images work best.">
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

          <Field label="Company name" error={errors.name} required>
            {(props) => (
              <Input {...props} value={form.name} error={errors.name} onChange={update('name')} />
            )}
          </Field>

          <Field
            label="About the company"
            hint="Two or three honest paragraphs beat a mission statement."
          >
            {(props) => (
              <Textarea
                {...props}
                rows={7}
                maxLength={6000}
                placeholder="What you build, who you build it for, and what it is like to work there."
                value={form.description}
                onChange={update('description')}
              />
            )}
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Website" error={errors.website}>
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

            <Field label="Headquarters">
              {(props) => (
                <Input
                  {...props}
                  placeholder="Beirut, Lebanon"
                  value={form.location}
                  onChange={update('location')}
                />
              )}
            </Field>

            <Field label="Industry">
              {(props) => (
                <Input
                  {...props}
                  placeholder="Software"
                  value={form.industry}
                  onChange={update('industry')}
                />
              )}
            </Field>

            <Field label="Company size">
              {(props) => (
                <Select {...props} value={form.size} onChange={update('size')}>
                  {SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size} people
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <div className="border-ink-200 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" to="/recruiter">
              Back to dashboard
            </Button>
            <Button type="submit" loading={save.isPending}>
              Save changes
            </Button>
          </div>
        </form>

        {company?.slug && (
          <p className="text-ink-500 mt-4 text-sm">
            Public career page:{' '}
            <Link to={`/companies/${company.slug}`} className="text-brand-700 hover:underline">
              /companies/{company.slug}
            </Link>
          </p>
        )}
      </div>
    </Container>
  );
}

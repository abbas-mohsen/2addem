import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { authApi } from '../api/endpoints.js';
import { errorMessage, fieldErrors } from '../api/client.js';
import { useAuthStore } from '../context/authStore.js';
import { useLocationSuggestions } from '../hooks/useLocationSuggestions.js';
import { Container, PageHeader } from '../components/layout/AppLayout.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Field, Input, Textarea } from '../components/ui/Field.jsx';
import { initials } from '../lib/format.js';
import { isUrl, PHONE_PATTERN } from '../lib/validate.js';
import { useT } from '../i18n/index.jsx';

const MAX_SKILLS = 30;
const MAX_SKILL_LENGTH = 40;

/* Server issue paths are nested (profile.links.website) but the form is flat,
   so the backstop messages have to be re-keyed to reach the right field. */
function flatFieldErrors(error) {
  return Object.fromEntries(
    Object.entries(fieldErrors(error)).map(([field, message]) => [
      field.replace(/^profile\.(links\.)?/, ''),
      message,
    ])
  );
}

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { data: locations = [] } = useLocationSuggestions();
  const t = useT();

  // ProtectedRoute holds the route until the session resolves, so the store
  // user is always populated here and no second fetch is needed.
  const profile = user.profile ?? {};

  const [form, setForm] = useState({
    name: user.name ?? '',
    avatarUrl: user.avatarUrl ?? '',
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    phone: profile.phone ?? '',
    experienceYears: profile.experienceYears == null ? '' : String(profile.experienceYears),
    website: profile.links?.website ?? '',
    linkedin: profile.links?.linkedin ?? '',
    github: profile.links?.github ?? '',
  });
  const [skills, setSkills] = useState(profile.skills ?? []);
  const [skillDraft, setSkillDraft] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: ({ user: updated }) => {
      setUser(updated);
      setSaved(true);
    },
    onError: (error) => {
      setErrors(flatFieldErrors(error));
      setSubmitError(errorMessage(error, t('profile.saveFailed')));
    },
  });

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSaved(false);
  };

  const addSkill = (event) => {
    event.preventDefault();
    const skill = skillDraft.trim();
    if (!skill || skills.length >= MAX_SKILLS) return;
    // Case-insensitive, because "React" and "react" are one skill to a reader.
    if (skills.some((item) => item.toLowerCase() === skill.toLowerCase())) {
      setSkillDraft('');
      return;
    }
    setSkills((current) => [...current, skill]);
    setSkillDraft('');
    setSaved(false);
  };

  const removeSkill = (skill) => {
    setSkills((current) => current.filter((item) => item !== skill));
    setSaved(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitError(null);

    const next = {};
    if (form.name.trim().length < 2) next.name = t('profile.nameError');
    if (form.phone && !PHONE_PATTERN.test(form.phone)) next.phone = t('profile.phoneError');
    if (form.avatarUrl && !isUrl(form.avatarUrl)) next.avatarUrl = t('profile.urlError');
    for (const key of ['website', 'linkedin', 'github']) {
      if (form[key] && !isUrl(form[key])) next[key] = t('profile.urlError');
    }

    const years = form.experienceYears.trim();
    if (years !== '' && (Number.isNaN(Number(years)) || Number(years) < 0 || Number(years) > 60)) {
      next.experienceYears = t('profile.yearsError');
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    save.mutate({
      name: form.name.trim(),
      avatarUrl: form.avatarUrl.trim(),
      profile: {
        headline: form.headline.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        phone: form.phone.trim(),
        skills,
        // null clears it; omitting the key would leave the old value in place,
        // because the server merges the profile rather than replacing it.
        experienceYears: years === '' ? null : Number(years),
        links: {
          website: form.website.trim(),
          linkedin: form.linkedin.trim(),
          github: form.github.trim(),
        },
      },
    });
  };

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t('profile.title')} description={t('profile.subtitle')} />

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {submitError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
              {submitError}
            </p>
          )}

          {saved && !save.isPending && (
            <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
              <Check className="size-4" aria-hidden="true" />
              {t('profile.saved')}
            </p>
          )}

          <section className="border-ink-200 rounded-card shadow-card space-y-5 border bg-white p-5 sm:p-7">
            <h2 className="text-ink-900 text-base font-semibold">{t('profile.basics')}</h2>

            <div className="flex items-center gap-4">
              {form.avatarUrl && isUrl(form.avatarUrl) ? (
                <img
                  src={form.avatarUrl}
                  alt=""
                  className="bg-ink-100 size-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  className="bg-brand-100 text-brand-700 flex size-14 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  aria-hidden="true"
                >
                  {initials(form.name || user.name)}
                </span>
              )}
              <div className="flex-1">
                <Field
                  label={t('profile.avatarUrl')}
                  error={errors.avatarUrl}
                  hint={t('profile.avatarHint')}
                >
                  {(props) => (
                    <Input
                      {...props}
                      placeholder="https://example.com/photo.jpg"
                      value={form.avatarUrl}
                      error={errors.avatarUrl}
                      onChange={update('avatarUrl')}
                    />
                  )}
                </Field>
              </div>
            </div>

            <Field label={t('profile.name')} error={errors.name} required>
              {(props) => (
                <Input
                  {...props}
                  maxLength={120}
                  value={form.name}
                  error={errors.name}
                  onChange={update('name')}
                />
              )}
            </Field>

            <Field
              label={t('profile.headline')}
              error={errors.headline}
              hint={t('profile.headlineHint')}
            >
              {(props) => (
                <Input
                  {...props}
                  maxLength={160}
                  placeholder={t('profile.headlinePlaceholder')}
                  value={form.headline}
                  error={errors.headline}
                  onChange={update('headline')}
                />
              )}
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('profile.location')} error={errors.location}>
                {(props) => (
                  <>
                    <Input
                      {...props}
                      list="profile-locations"
                      maxLength={120}
                      placeholder="Beirut"
                      value={form.location}
                      error={errors.location}
                      onChange={update('location')}
                    />
                    <datalist id="profile-locations">
                      {locations.map((location) => (
                        <option key={location} value={location} />
                      ))}
                    </datalist>
                  </>
                )}
              </Field>

              <Field
                label={t('profile.phone')}
                error={errors.phone}
                hint={t('profile.phoneHint')}
              >
                {(props) => (
                  <Input
                    {...props}
                    type="tel"
                    maxLength={32}
                    placeholder="+961 3 000 000"
                    value={form.phone}
                    error={errors.phone}
                    onChange={update('phone')}
                  />
                )}
              </Field>

              <Field label={t('profile.experienceYears')} error={errors.experienceYears}>
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    min={0}
                    max={60}
                    step={1}
                    value={form.experienceYears}
                    error={errors.experienceYears}
                    onChange={update('experienceYears')}
                  />
                )}
              </Field>
            </div>
          </section>

          <section className="border-ink-200 rounded-card shadow-card space-y-5 border bg-white p-5 sm:p-7">
            <h2 className="text-ink-900 text-base font-semibold">{t('profile.aboutYou')}</h2>

            <Field label={t('profile.bio')} error={errors.bio} hint={t('profile.bioHint')}>
              {(props) => (
                <Textarea
                  {...props}
                  rows={7}
                  maxLength={4000}
                  placeholder={t('profile.bioPlaceholder')}
                  value={form.bio}
                  error={errors.bio}
                  onChange={update('bio')}
                />
              )}
            </Field>

            <div className="space-y-1.5">
              <p className="text-ink-800 text-sm font-medium">{t('profile.skills')}</p>

              <div className="flex flex-wrap gap-1.5">
                {skills.length ? (
                  skills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="bg-ink-100 text-ink-700 hover:bg-red-50 hover:text-red-700 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                      aria-label={t('profile.removeSkill', { skill })}
                    >
                      {skill}
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  ))
                ) : (
                  <p className="text-ink-400 text-sm">{t('profile.noSkills')}</p>
                )}
              </div>

              <div className="mt-2.5 flex gap-2">
                <Input
                  className="h-9 py-0 text-sm"
                  placeholder={t('profile.addSkill')}
                  aria-label={t('profile.addSkillLabel')}
                  maxLength={MAX_SKILL_LENGTH}
                  value={skillDraft}
                  disabled={skills.length >= MAX_SKILLS}
                  onChange={(event) => setSkillDraft(event.target.value)}
                  // The skills input sits inside the profile form, so Enter has
                  // to add a skill rather than submit the whole page.
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') addSkill(event);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={skills.length >= MAX_SKILLS}
                  onClick={addSkill}
                >
                  {t('common.add')}
                </Button>
              </div>

              <p className="text-ink-500 text-xs">
                {skills.length >= MAX_SKILLS
                  ? t('profile.skillsFull', { max: MAX_SKILLS })
                  : t('profile.skillsHint')}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('profile.website')} error={errors.website}>
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

              <Field label={t('profile.linkedin')} error={errors.linkedin}>
                {(props) => (
                  <Input
                    {...props}
                    placeholder="https://linkedin.com/in/you"
                    value={form.linkedin}
                    error={errors.linkedin}
                    onChange={update('linkedin')}
                  />
                )}
              </Field>

              <Field label={t('profile.github')} error={errors.github}>
                {(props) => (
                  <Input
                    {...props}
                    placeholder="https://github.com/you"
                    value={form.github}
                    error={errors.github}
                    onChange={update('github')}
                  />
                )}
              </Field>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" to="/applications">
              {t('profile.backToApplications')}
            </Button>
            <Button type="submit" loading={save.isPending}>
              {t('common.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}

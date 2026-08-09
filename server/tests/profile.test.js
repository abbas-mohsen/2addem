import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createClient,
  registerCandidate,
  resetDatabase,
  startTestServer,
  stopTestServer,
} from './helpers/harness.js';

before(async () => {
  await startTestServer();
  await resetDatabase();
});

after(stopTestServer);

const fullProfile = {
  headline: 'Front-end engineer, four years in React',
  bio: 'Built the checkout at a Beirut fintech.',
  location: 'Beirut',
  phone: '+961 3 123 456',
  skills: ['React', 'TypeScript'],
  experienceYears: 4,
  links: {
    website: 'https://example.com',
    linkedin: 'https://linkedin.com/in/example',
    github: 'https://github.com/example',
  },
};

describe('PATCH /auth/me', () => {
  it('stores every profile field the form sends', async () => {
    const { client } = await registerCandidate();

    const response = await client.patch('/auth/me', { profile: fullProfile });

    assert.equal(response.status, 200);
    const { profile } = response.data.user;
    assert.equal(profile.headline, fullProfile.headline);
    assert.equal(profile.phone, fullProfile.phone);
    assert.equal(profile.location, 'Beirut');
    assert.deepEqual(profile.skills, ['React', 'TypeScript']);
    assert.equal(profile.experienceYears, 4);
    assert.equal(profile.links.github, 'https://github.com/example');
  });

  it('persists across requests', async () => {
    const { client } = await registerCandidate();
    await client.patch('/auth/me', { profile: fullProfile });

    const response = await client.get('/auth/me');

    assert.equal(response.data.user.profile.headline, fullProfile.headline);
  });

  it('merges rather than replaces, so one field does not wipe the rest', async () => {
    const { client } = await registerCandidate();
    await client.patch('/auth/me', { profile: fullProfile });

    await client.patch('/auth/me', { profile: { location: 'Tripoli' } });
    const response = await client.get('/auth/me');

    assert.equal(response.data.user.profile.location, 'Tripoli');
    assert.equal(response.data.user.profile.headline, fullProfile.headline);
    assert.deepEqual(response.data.user.profile.skills, ['React', 'TypeScript']);
  });

  it('clears years of experience on null instead of coercing it to zero', async () => {
    const { client } = await registerCandidate();
    await client.patch('/auth/me', { profile: { experienceYears: 4 } });

    const response = await client.patch('/auth/me', { profile: { experienceYears: null } });

    assert.equal(response.status, 200);
    assert.equal(
      response.data.user.profile.experienceYears ?? null,
      null,
      'null must clear the field, not read as "no experience"'
    );
  });

  it('empties a text field when the form sends an empty string', async () => {
    const { client } = await registerCandidate();
    await client.patch('/auth/me', { profile: fullProfile });

    const response = await client.patch('/auth/me', { profile: { headline: '' } });

    assert.equal(response.data.user.profile.headline ?? '', '');
  });

  it('updates the account name alongside the profile', async () => {
    const { client } = await registerCandidate();

    const response = await client.patch('/auth/me', {
      name: 'Rana Haddad',
      profile: { headline: 'Designer' },
    });

    assert.equal(response.data.user.name, 'Rana Haddad');
    assert.equal(response.data.user.profile.headline, 'Designer');
  });

  it('cannot be used to change role, email or company', async () => {
    const { client, user } = await registerCandidate();

    await client.patch('/auth/me', {
      role: 'admin',
      email: 'promoted@test.local',
      isActive: false,
    });
    const response = await client.get('/auth/me');

    assert.equal(response.data.user.role, 'candidate');
    assert.equal(response.data.user.email, user.email);
    assert.equal(response.data.user.isActive, true);
  });

  it('requires a session', async () => {
    const client = createClient();
    const response = await client.patch('/auth/me', { name: 'Nobody' });
    assert.equal(response.status, 401);
  });
});

describe('PATCH /auth/me validation', () => {
  const cases = [
    {
      label: 'a phone number with letters',
      body: { profile: { phone: 'call me maybe' } },
      field: 'profile.phone',
    },
    {
      label: 'a link that is not a URL',
      body: { profile: { links: { website: 'example.com' } } },
      field: 'profile.links.website',
    },
    {
      label: 'more than sixty years of experience',
      body: { profile: { experienceYears: 99 } },
      field: 'profile.experienceYears',
    },
    { label: 'a one-character name', body: { name: 'A' }, field: 'name' },
    {
      label: 'an unsupported locale',
      body: { locale: 'fr' },
      field: 'locale',
    },
  ];

  for (const { label, body, field } of cases) {
    it(`rejects ${label}`, async () => {
      const { client } = await registerCandidate();

      const response = await client.patch('/auth/me', body);

      assert.equal(response.status, 400, JSON.stringify(response.body));
      assert.equal(response.body.success, false);
      assert.ok(
        response.error.details.some((detail) => detail.field === field),
        `expected an issue on "${field}", got ${JSON.stringify(response.error.details)}`
      );
    });
  }

  // The client re-keys these onto its flat form fields, so the shape matters.
  it('reports nested issues with a dotted path', async () => {
    const { client } = await registerCandidate();

    const response = await client.patch('/auth/me', {
      profile: { links: { linkedin: 'nope' } },
    });

    assert.equal(response.error.details[0].field, 'profile.links.linkedin');
  });
});

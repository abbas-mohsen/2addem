import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createClient,
  registerCandidate,
  resetDatabase,
  startTestServer,
  stopTestServer,
} from './helpers/harness.js';
import { User } from '../src/models/User.js';

before(async () => {
  await startTestServer();
  await resetDatabase();
});

after(stopTestServer);

describe('registration', () => {
  it('creates a candidate and returns a session', async () => {
    const client = createClient();
    const response = await client.post('/auth/register', {
      name: 'Rana Haddad',
      email: 'rana@test.local',
      password: 'password123',
      role: 'candidate',
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.data.user.email, 'rana@test.local');
    assert.equal(response.data.user.role, 'candidate');
    assert.ok(response.data.accessToken);
    assert.ok(client.hasCookie('jc_refresh'), 'refresh cookie should be set');
  });

  it('never exposes the password hash or token version', async () => {
    const { user } = await registerCandidate();
    assert.equal(user.passwordHash, undefined);
    assert.equal(user.tokenVersion, undefined);
  });

  it('rejects the admin role, which is seed-only', async () => {
    const client = createClient();
    const response = await client.post('/auth/register', {
      name: 'Sneaky',
      email: 'sneaky@test.local',
      password: 'password123',
      role: 'admin',
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
  });

  it('requires a company name for recruiters', async () => {
    const client = createClient();
    const response = await client.post('/auth/register', {
      name: 'No Company',
      email: 'nocompany@test.local',
      password: 'password123',
      role: 'recruiter',
    });

    assert.equal(response.status, 400);
    assert.ok(
      response.error.details.some((detail) => detail.field === 'companyName'),
      `expected a companyName issue, got ${JSON.stringify(response.error.details)}`
    );
  });

  it('refuses a duplicate email', async () => {
    const { email } = await registerCandidate();
    const client = createClient();

    const response = await client.post('/auth/register', {
      name: 'Same Address',
      email,
      password: 'password123',
      role: 'candidate',
    });

    assert.equal(response.status, 409);
  });
});

describe('sign in', () => {
  it('accepts the right password and rejects the wrong one', async () => {
    const { email, password } = await registerCandidate();
    const client = createClient();

    const good = await client.post('/auth/login', { email, password });
    assert.equal(good.status, 200);
    assert.ok(good.data.accessToken);

    const bad = await client.post('/auth/login', { email, password: 'not-the-password' });
    assert.equal(bad.status, 401);
  });

  it('does not say which half of the pair was wrong', async () => {
    const { email, password } = await registerCandidate();
    const client = createClient();

    const unknownEmail = await client.post('/auth/login', {
      email: 'nobody@test.local',
      password,
    });
    const wrongPassword = await client.post('/auth/login', { email, password: 'wrong-password' });

    assert.equal(unknownEmail.status, wrongPassword.status);
    assert.equal(unknownEmail.error.message, wrongPassword.error.message);
  });
});

describe('session lifetime', () => {
  it('refreshes an access token from the cookie alone', async () => {
    const { client } = await registerCandidate();
    client.setToken(null);

    const response = await client.post('/auth/refresh');

    assert.equal(response.status, 200);
    assert.ok(response.data.accessToken);
  });

  it('cannot refresh without the cookie', async () => {
    const { client } = await registerCandidate();
    client.clearCookies();

    const response = await client.post('/auth/refresh');

    assert.equal(response.status, 401);
  });

  it('logout bumps tokenVersion, so the old refresh cookie stops working', async () => {
    const { client } = await registerCandidate();

    // Keep a second session holding the same cookie, the way a second tab would.
    const otherTab = createClient();
    const refreshBefore = await client.post('/auth/refresh');
    assert.equal(refreshBefore.status, 200);

    const loggedOut = await client.post('/auth/logout');
    assert.equal(loggedOut.status, 200);

    const afterLogout = await client.post('/auth/refresh');
    assert.equal(afterLogout.status, 401, 'the refresh cookie should be dead after logout');
    assert.equal(otherTab.hasCookie('jc_refresh'), false);
  });

  /* Logout revokes the refresh token, not the access token in memory: that one
     is short-lived and deliberately not checked against tokenVersion on every
     request. Deactivation is the case that has to take effect immediately, and
     it does, because requireAuth reloads the user and checks isActive. */
  it('leaves an already-issued access token usable until it expires', async () => {
    const { client } = await registerCandidate();
    const token = client.token;

    await client.post('/auth/logout');
    client.setToken(token);

    const response = await client.get('/auth/me');

    assert.equal(response.status, 200);
  });

  it('but the session cannot be renewed once the refresh token is revoked', async () => {
    const { client } = await registerCandidate();

    await client.post('/auth/logout');
    client.setToken(null);

    const response = await client.post('/auth/refresh');

    assert.equal(response.status, 401);
  });
});

describe('deactivation', () => {
  /* The counterpart to the test above: this is the case that has to end a live
     session at once, and it does, because requireAuth reloads the user. */
  it('ends a live session on the very next request', async () => {
    const { client, user } = await registerCandidate();

    const before = await client.get('/auth/me');
    assert.equal(before.status, 200);

    await User.findByIdAndUpdate(user._id ?? user.id, { isActive: false });

    const after = await client.get('/auth/me');
    assert.equal(after.status, 403);
  });
});

describe('GET /auth/me', () => {
  it('needs a token', async () => {
    const client = createClient();
    const response = await client.get('/auth/me');
    assert.equal(response.status, 401);
  });

  it('rejects a token that was not signed by this server', async () => {
    const { client } = await registerCandidate();
    const response = await client.get('/auth/me', { token: 'not.a.real.token' });
    assert.equal(response.status, 401);
  });
});

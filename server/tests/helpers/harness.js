import mongoose from 'mongoose';
import { createApp } from '../../src/app.js';

/* One Express app on an ephemeral port per test file, driven over real HTTP.
   That keeps the tests honest about middleware, cookies and status codes,
   which is where this app's interesting behaviour lives. */

let server = null;
let baseUrl = null;

export async function startTestServer() {
  if (server) return baseUrl;

  const dbName = new URL(process.env.MONGODB_URI.replace('mongodb://', 'http://')).pathname.slice(1);
  // A missing --import would point these at the development database, and the
  // first reset() would empty it. Refuse rather than find out afterwards.
  if (!dbName.endsWith('_test')) {
    throw new Error(
      `Refusing to run against "${dbName}": the test database name must end in _test. ` +
        'Run the suite with `npm test`, which loads tests/helpers/env.mjs.'
    );
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  await new Promise((resolve) => {
    server = createApp().listen(0, '127.0.0.1', resolve);
  });

  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  return baseUrl;
}

export async function stopTestServer() {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
  server = null;
  baseUrl = null;
}

/* Between files, not between tests: most tests here build a small world and
   then assert several things about it. */
export async function resetDatabase() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

const isExpired = (cookie) => /max-age=0/i.test(cookie) || /expires=thu, 01 jan 1970/i.test(cookie);

/* A session: holds the access token and the refresh cookie the way the browser
   would, so logout and refresh can be tested at all. */
export function createClient() {
  const cookies = new Map();
  let accessToken = null;

  async function request(method, path, options = {}) {
    const headers = { Accept: 'application/json', ...options.headers };

    const token = 'token' in options ? options.token : accessToken;
    if (token) headers.Authorization = `Bearer ${token}`;

    let body;
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    if (cookies.size) {
      headers.Cookie = [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');
    }

    const response = await fetch(`${baseUrl}${path}`, { method, headers, body });

    for (const raw of response.headers.getSetCookie()) {
      const separator = raw.indexOf('=');
      const name = raw.slice(0, separator);
      const value = raw.slice(separator + 1).split(';')[0];
      if (isExpired(raw)) cookies.delete(name);
      else cookies.set(name, value);
    }

    const payload = await response.json().catch(() => null);

    return {
      status: response.status,
      body: payload,
      data: payload?.data,
      error: payload?.error,
      headers: response.headers,
    };
  }

  const client = {
    get: (path, options) => request('GET', path, options),
    post: (path, body, options) => request('POST', path, { ...options, body }),
    patch: (path, body, options) => request('PATCH', path, { ...options, body }),
    delete: (path, options) => request('DELETE', path, options),

    get token() {
      return accessToken;
    },
    setToken(token) {
      accessToken = token;
    },
    hasCookie: (name) => cookies.has(name),
    clearCookies: () => cookies.clear(),
  };

  return client;
}

let sequence = 0;
const unique = (prefix) => `${prefix}-${Date.now().toString(36)}-${(sequence += 1)}`;

/* Registration is the only way an account comes into being in this app, so the
   factories go through it rather than writing documents behind its back. */
export async function registerCandidate(overrides = {}) {
  const client = createClient();
  const email = overrides.email ?? `${unique('candidate')}@test.local`;

  const response = await client.post('/auth/register', {
    name: overrides.name ?? 'Test Candidate',
    email,
    password: overrides.password ?? 'password123',
    role: 'candidate',
  });

  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`could not register candidate: ${JSON.stringify(response.body)}`);
  }

  client.setToken(response.data.accessToken);
  return { client, user: response.data.user, email, password: overrides.password ?? 'password123' };
}

export async function registerRecruiter(overrides = {}) {
  const client = createClient();
  const email = overrides.email ?? `${unique('recruiter')}@test.local`;

  const response = await client.post('/auth/register', {
    name: overrides.name ?? 'Test Recruiter',
    email,
    password: overrides.password ?? 'password123',
    role: 'recruiter',
    companyName: overrides.companyName ?? unique('Company'),
  });

  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`could not register recruiter: ${JSON.stringify(response.body)}`);
  }

  client.setToken(response.data.accessToken);
  return { client, user: response.data.user, email, password: overrides.password ?? 'password123' };
}

export const jobPayload = (overrides = {}) => ({
  title: 'Front-end engineer',
  description: 'We are looking for someone to own the candidate-facing side of our product.',
  location: 'Beirut',
  remote: 'hybrid',
  employmentType: 'full-time',
  status: 'published',
  ...overrides,
});

export async function createJob(recruiterClient, overrides = {}) {
  const response = await recruiterClient.post('/jobs', jobPayload(overrides));
  if (response.status !== 201) {
    throw new Error(`could not create job: ${JSON.stringify(response.body)}`);
  }
  return response.data.job;
}

import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createClient,
  createJob,
  registerRecruiter,
  resetDatabase,
  startTestServer,
  stopTestServer,
} from './helpers/harness.js';

/* Every client feature — errorMessage(), fieldErrors(), unwrap(), unwrapList()
   — is written against one response shape. If the envelope drifts, the UI
   breaks in ways that are hard to trace back here. */

before(async () => {
  await startTestServer();
  await resetDatabase();
});

after(stopTestServer);

describe('success envelope', () => {
  it('wraps a single resource as { success, data }', async () => {
    const client = createClient();

    const response = await client.get('/health');

    assert.equal(response.status, 200);
    assert.deepEqual(Object.keys(response.body).sort(), ['data', 'success']);
    assert.equal(response.body.success, true);
  });

  it('wraps a list as { success, data, meta } with page information', async () => {
    const recruiter = await registerRecruiter();
    await createJob(recruiter.client);

    const response = await createClient().get('/jobs');

    assert.equal(response.body.success, true);
    assert.ok(Array.isArray(response.body.data));
    assert.ok(response.body.meta, 'a list response must carry pagination meta');
    for (const key of ['page', 'limit', 'total']) {
      assert.ok(key in response.body.meta, `meta.${key} is missing`);
    }
  });
});

describe('error envelope', () => {
  it('reports an unknown route as a 404 in the same shape', async () => {
    const response = await createClient().get('/no-such-endpoint');

    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.ok(response.body.error.message);
  });

  it('reports validation failures with a field and a message per issue', async () => {
    const recruiter = await registerRecruiter();

    const response = await recruiter.client.post('/jobs', { title: 'no' });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.ok(Array.isArray(response.error.details));
    for (const detail of response.error.details) {
      assert.equal(typeof detail.field, 'string');
      assert.equal(typeof detail.message, 'string');
    }
  });

  it('never leaks a stack trace', async () => {
    const response = await createClient().get('/no-such-endpoint');

    assert.equal(response.body.error.stack, undefined);
    assert.ok(!JSON.stringify(response.body).includes('at Object.'));
  });

  it('rejects a body that is not valid JSON without crashing', async () => {
    const recruiter = await registerRecruiter();

    const response = await fetch(`${await startTestServer()}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recruiter.client.token}`,
      },
      body: '{ not json',
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.stack, undefined, 'a bad request must not return a stack trace');
  });

  it('rejects an oversized body as a 413 rather than a server fault', async () => {
    const recruiter = await registerRecruiter();

    const response = await fetch(`${await startTestServer()}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recruiter.client.token}`,
      },
      body: JSON.stringify({ title: 'x'.repeat(2 * 1024 * 1024) }),
    });

    assert.equal(response.status, 413);
    assert.equal((await response.json()).success, false);
  });
});

describe('query validation', () => {
  it('coerces and validates pagination on the public board', async () => {
    const response = await createClient().get('/jobs?page=2&limit=5');

    assert.equal(response.status, 200);
    assert.equal(response.body.meta.page, 2);
    assert.equal(response.body.meta.limit, 5);
  });

  it('refuses an unsupported filter value rather than ignoring it', async () => {
    const response = await createClient().get('/jobs?remote=teleportation');

    assert.equal(response.status, 400);
  });
});

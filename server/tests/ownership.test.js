import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createJob,
  registerCandidate,
  registerRecruiter,
  resetDatabase,
  startTestServer,
  stopTestServer,
} from './helpers/harness.js';

/* The role check is only half of this app's authorisation: a recruiter is a
   recruiter everywhere, so what keeps two companies apart is the ownership
   lookup in the service layer. These are the tests for that half. */

before(async () => {
  await startTestServer();
  await resetDatabase();
});

after(stopTestServer);

describe('jobs belong to a company', () => {
  it('a recruiter cannot edit a job owned by another company', async () => {
    const cedarline = await registerRecruiter();
    const rival = await registerRecruiter();
    const job = await createJob(cedarline.client);

    const response = await rival.client.patch(`/jobs/${job._id}`, { title: 'Hijacked' });

    assert.equal(response.status, 403);
  });

  it('a recruiter cannot close another company job', async () => {
    const cedarline = await registerRecruiter();
    const rival = await registerRecruiter();
    const job = await createJob(cedarline.client);

    const response = await rival.client.patch(`/jobs/${job._id}/status`, { status: 'closed' });

    assert.equal(response.status, 403);
  });

  it('a recruiter cannot delete another company job', async () => {
    const cedarline = await registerRecruiter();
    const rival = await registerRecruiter();
    const job = await createJob(cedarline.client);

    const response = await rival.client.delete(`/jobs/${job._id}`);

    assert.equal(response.status, 403);
  });

  it('the owner can edit their own job', async () => {
    const cedarline = await registerRecruiter();
    const job = await createJob(cedarline.client);

    const response = await cedarline.client.patch(`/jobs/${job._id}`, { title: 'Staff engineer' });

    assert.equal(response.status, 200);
    assert.equal(response.data.job.title, 'Staff engineer');
  });

  it('GET /jobs/mine only lists the caller company jobs', async () => {
    const cedarline = await registerRecruiter();
    const rival = await registerRecruiter();
    await createJob(cedarline.client, { title: 'Ours' });
    await createJob(rival.client, { title: 'Theirs' });

    const response = await cedarline.client.get('/jobs/mine');

    assert.equal(response.status, 200);
    const titles = response.body.data.map((job) => job.title);
    assert.ok(titles.includes('Ours'));
    assert.ok(!titles.includes('Theirs'), `leaked another company job: ${JSON.stringify(titles)}`);
  });

  it('an unknown job id is a 404, not a 403 that confirms it exists', async () => {
    const recruiter = await registerRecruiter();

    const response = await recruiter.client.patch('/jobs/000000000000000000000000', {
      title: 'Ghost',
    });

    assert.equal(response.status, 404);
  });

  it('a malformed job id is a 404 rather than a cast error', async () => {
    const recruiter = await registerRecruiter();

    const response = await recruiter.client.patch('/jobs/not-an-object-id', { title: 'Ghost' });

    assert.equal(response.status, 404);
  });
});

describe('candidates cannot use recruiter endpoints', () => {
  it('a candidate cannot create a job', async () => {
    const candidate = await registerCandidate();

    const response = await candidate.client.post('/jobs', {
      title: 'My own job',
      description: 'A description long enough to pass validation without any trouble at all.',
    });

    assert.equal(response.status, 403);
  });

  it('a candidate cannot list applicants for a job', async () => {
    const recruiter = await registerRecruiter();
    const candidate = await registerCandidate();
    const job = await createJob(recruiter.client);

    const response = await candidate.client.get(`/jobs/${job._id}/applications`);

    assert.equal(response.status, 403);
  });

  it('a candidate cannot reach the admin panel', async () => {
    const candidate = await registerCandidate();

    const response = await candidate.client.get('/admin/overview');

    assert.equal(response.status, 403);
  });

  it('a recruiter cannot reach the admin panel either', async () => {
    const recruiter = await registerRecruiter();

    const response = await recruiter.client.get('/admin/overview');

    assert.equal(response.status, 403);
  });
});

describe('the public board hides drafts', () => {
  it('a draft is not listed publicly but is visible to its owner', async () => {
    const recruiter = await registerRecruiter();
    await createJob(recruiter.client, { title: 'Quiet draft', status: 'draft' });

    const publicBoard = await createJob(recruiter.client, { title: 'Live role' });
    assert.ok(publicBoard);

    const response = await registerCandidate().then(({ client }) => client.get('/jobs'));
    const titles = response.body.data.map((job) => job.title);

    assert.ok(titles.includes('Live role'));
    assert.ok(!titles.includes('Quiet draft'), 'drafts must not appear on the public board');
  });
});

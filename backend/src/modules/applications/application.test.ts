import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  ApplicationStage,
  ApprovalStatus,
  AuthProvider,
  JobStatus,
  UserRole,
  type GeoLocation,
} from '@rokdajob/shared';
import { createApp } from '@/app';
import { User, hashPassword } from '@/modules/auth/user.model';
import { CategoryModel } from '@/modules/catalog/category.model';
import { CompanyModel } from '@/modules/employer/company.model';
import { JobModel } from '@/modules/jobs/job.model';
import { ApplicationModel } from './application.model';

const API = '/api/v1';

let mongo: MongoMemoryServer;
const app = createApp();

const MUMBAI: GeoLocation = {
  formatted: 'Andheri East, Mumbai, Maharashtra',
  state: 'Maharashtra',
  stateSlug: 'maharashtra',
  district: 'Mumbai Suburban',
  districtSlug: 'mumbai-suburban',
  city: 'Mumbai',
  citySlug: 'mumbai',
  locality: 'Andheri East',
  localitySlug: 'andheri-east',
  pincode: '400069',
  geo: { type: 'Point', coordinates: [72.8656, 19.1197] },
};

interface Actor {
  id: string;
  token: string;
}

async function makeUser(
  role: UserRole,
  overrides: { name: string; username: string; email: string },
): Promise<Actor> {
  await User.create({
    ...overrides,
    passwordHash: await hashPassword('goodpass1'),
    providers: [AuthProvider.LOCAL],
    role,
    approval: {
      status: role === UserRole.EMPLOYER ? ApprovalStatus.APPROVED : ApprovalStatus.AUTO_APPROVED,
    },
    registrationComplete: true,
    emailVerifiedAt: new Date(),
  });

  const response = await request(app)
    .post(`${API}/auth/login`)
    .send({ identifier: overrides.email, password: 'goodpass1' });

  return { id: response.body.data.user.id as string, token: response.body.data.tokens.accessToken };
}

/**
 * A published job, built straight through the models.
 *
 * Going through `POST /jobs` would drag in the whole location catalogue for something
 * these tests do not exercise; what they need is a job that exists and is open.
 */
async function makeJob(
  employer: Actor,
  overrides: { workersRequired?: number; status?: JobStatus; slug?: string } = {},
) {
  const category = await CategoryModel.findOneAndUpdate(
    { slug: 'construction' },
    { $setOnInsert: { name: 'Construction', slug: 'construction', icon: 'hard-hat', order: 1 } },
    { upsert: true, new: true },
  );

  const company = await CompanyModel.findOneAndUpdate(
    { owner: employer.id },
    {
      $setOnInsert: {
        name: 'Sharma Construction',
        slug: 'sharma-construction',
        owner: employer.id,
      },
    },
    { upsert: true, new: true },
  );

  return JobModel.create({
    employer: employer.id,
    company: company._id,
    title: 'Mason needed for shop renovation',
    slug: overrides.slug ?? `mason-mumbai-${Date.now().toString(36)}`,
    category: category._id,
    skills: [],
    description: 'Two weeks of brickwork and plastering on a ground floor shop in Andheri.',
    workersRequired: overrides.workersRequired ?? 2,
    location: MUMBAI,
    salary: { amount: 800, type: 'PER_DAY', negotiable: false },
    status: overrides.status ?? JobStatus.PUBLISHED,
    publishedAt: new Date(),
  });
}

let worker: Actor;
let otherWorker: Actor;
let employer: Actor;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'rokdajob-test' });
  // The `{job, worker}` uniqueness is an index, so the tests that rely on it need it built.
  await ApplicationModel.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));

  worker = await makeUser(UserRole.WORKER, {
    name: 'Ravi Kumar',
    username: 'ravi.kumar',
    email: 'ravi@example.com',
  });
  otherWorker = await makeUser(UserRole.WORKER, {
    name: 'Imran Shaikh',
    username: 'imran.shaikh',
    email: 'imran@example.com',
  });
  employer = await makeUser(UserRole.EMPLOYER, {
    name: 'Sunil Sharma',
    username: 'sunil_builds',
    email: 'sunil@example.com',
  });
});

describe('POST /jobs/:id/apply', () => {
  it('turns a worker away until they sign in', async () => {
    const job = await makeJob(employer);

    const response = await request(app).post(`${API}/jobs/${job.id}/apply`).send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
    expect(await ApplicationModel.countDocuments({})).toBe(0);
  });

  it('accepts an application from a signed-in worker', async () => {
    const job = await makeJob(employer);

    const response = await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({ coverNote: 'I can start tomorrow.' });

    expect(response.status).toBe(201);
    expect(response.body.data.stage).toBe(ApplicationStage.APPLIED);
    expect(response.body.data.coverNote).toBe('I can start tomorrow.');
    expect(response.body.data.job.id).toBe(job.id);
    expect(response.body.data.stageHistory).toHaveLength(1);

    const refreshed = await JobModel.findById(job._id);
    expect(refreshed!.applicationCount).toBe(1);
  });

  it('is idempotent — a second tap returns the same application, not an error', async () => {
    const job = await makeJob(employer);
    const apply = () =>
      request(app)
        .post(`${API}/jobs/${job.id}/apply`)
        .set('Authorization', `Bearer ${worker.token}`)
        .send({});

    const first = await apply();
    const second = await apply();

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(await ApplicationModel.countDocuments({})).toBe(1);
  });

  it('survives two taps that arrive at the same moment', async () => {
    const job = await makeJob(employer);
    const apply = () =>
      request(app)
        .post(`${API}/jobs/${job.id}/apply`)
        .set('Authorization', `Bearer ${worker.token}`)
        .send({});

    const responses = await Promise.all([apply(), apply()]);

    expect(responses.every((response) => response.status < 400)).toBe(true);
    expect(await ApplicationModel.countDocuments({})).toBe(1);
  });

  it('refuses a job that is not open', async () => {
    const job = await makeJob(employer, { status: JobStatus.PAUSED });

    const response = await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({});

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('JOB_NOT_OPEN');
  });

  it('refuses an employer applying to their own job', async () => {
    const job = await makeJob(employer);

    const response = await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({});

    expect(response.status).toBe(403);
  });

  it('saves a phone number given at the moment of applying', async () => {
    const job = await makeJob(employer);

    await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({ phone: '+91 98765 43210' })
      .expect(201);

    const saved = await User.findById(worker.id);
    expect(saved!.phone).toBe('9876543210');
  });
});

describe('GET /jobs/:idOrSlug/my-application', () => {
  it('answers null before applying and the application after', async () => {
    const job = await makeJob(employer, { slug: 'mason-andheri' });

    const before = await request(app)
      .get(`${API}/jobs/mason-andheri/my-application`)
      .set('Authorization', `Bearer ${worker.token}`);
    expect(before.status).toBe(200);
    expect(before.body.data).toBeNull();

    await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({});

    const after = await request(app)
      .get(`${API}/jobs/mason-andheri/my-application`)
      .set('Authorization', `Bearer ${worker.token}`);
    expect(after.body.data.stage).toBe(ApplicationStage.APPLIED);
  });
});

describe('DELETE /me/applications/:id', () => {
  it('withdraws without deleting the row, and lets the worker apply again', async () => {
    const job = await makeJob(employer);
    const applied = await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({});

    const withdrawn = await request(app)
      .delete(`${API}/me/applications/${applied.body.data.id}`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({ reason: 'Found other work' });

    expect(withdrawn.status).toBe(200);
    expect(withdrawn.body.data.stage).toBe(ApplicationStage.WITHDRAWN);
    expect(await ApplicationModel.countDocuments({})).toBe(1);
    expect((await JobModel.findById(job._id))!.applicationCount).toBe(0);

    const again = await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({});

    expect(again.status).toBe(201);
    expect(again.body.data.id).toBe(applied.body.data.id);
    expect(again.body.data.stage).toBe(ApplicationStage.APPLIED);
  });

  it('refuses to withdraw someone else’s application', async () => {
    const job = await makeJob(employer);
    const applied = await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({});

    const response = await request(app)
      .delete(`${API}/me/applications/${applied.body.data.id}`)
      .set('Authorization', `Bearer ${otherWorker.token}`)
      .send({});

    expect(response.status).toBe(403);
  });
});

describe('the employer pipeline', () => {
  async function applyBoth(job: { id: string }) {
    const first = await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({});
    const second = await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${otherWorker.token}`)
      .send({});
    return [first.body.data.id as string, second.body.data.id as string] as const;
  }

  it('lists the applicants on the employer’s own job only', async () => {
    const job = await makeJob(employer);
    await applyBoth(job);

    const mine = await request(app)
      .get(`${API}/jobs/${job.id}/applications`)
      .set('Authorization', `Bearer ${employer.token}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data).toHaveLength(2);

    const theirs = await request(app)
      .get(`${API}/jobs/${job.id}/applications`)
      .set('Authorization', `Bearer ${worker.token}`);
    expect(theirs.status).toBe(403);
  });

  it('moves an applicant along the board', async () => {
    const job = await makeJob(employer);
    const [applicationId] = await applyBoth(job);

    const response = await request(app)
      .patch(`${API}/employer/applications/${applicationId}/stage`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({ stage: 'SHORTLISTED', note: 'Good nearby experience' });

    expect(response.status).toBe(200);
    expect(response.body.data.stage).toBe(ApplicationStage.SHORTLISTED);
    expect(response.body.data.stageHistory).toHaveLength(2);
  });

  it('hires, takes the vacancy, and closes the job on the last one', async () => {
    const job = await makeJob(employer, { workersRequired: 1 });
    const [applicationId] = await applyBoth(job);

    const response = await request(app)
      .post(`${API}/employer/applications/${applicationId}/hire`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data.stage).toBe(ApplicationStage.HIRED);
    expect(response.body.data.hiredAt).toBeTruthy();

    const refreshed = await JobModel.findById(job._id);
    expect(refreshed!.hiredCount).toBe(1);
    expect(refreshed!.status).toBe(JobStatus.FILLED);
  });

  it('gives the last vacancy to exactly one of two simultaneous hires', async () => {
    const job = await makeJob(employer, { workersRequired: 1 });
    const [first, second] = await applyBoth(job);

    const responses = await Promise.all(
      [first, second].map((id) =>
        request(app)
          .post(`${API}/employer/applications/${id}/hire`)
          .set('Authorization', `Bearer ${employer.token}`)
          .send({}),
      ),
    );

    const statuses = responses.map((response) => response.status).sort();
    expect(statuses).toEqual([200, 422]);
    expect(responses.find((response) => response.status === 422)!.body.error.code).toBe(
      'VACANCIES_FULL',
    );
    expect((await JobModel.findById(job._id))!.hiredCount).toBe(1);
  });

  it('stops a filled job from taking new applications', async () => {
    const job = await makeJob(employer, { workersRequired: 1 });
    const applied = await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({});

    await request(app)
      .post(`${API}/employer/applications/${applied.body.data.id}/hire`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({})
      .expect(200);

    const late = await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${otherWorker.token}`)
      .send({});

    expect(late.status).toBe(422);
    expect(['JOB_NOT_OPEN', 'VACANCIES_FULL']).toContain(late.body.error.code);
  });

  it('rejecting a hired worker returns their position and reopens the job', async () => {
    const job = await makeJob(employer, { workersRequired: 1 });
    const applied = await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({});

    await request(app)
      .post(`${API}/employer/applications/${applied.body.data.id}/hire`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({});

    const rejected = await request(app)
      .post(`${API}/employer/applications/${applied.body.data.id}/reject`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({ reason: 'Did not turn up' });

    expect(rejected.status).toBe(200);
    expect(rejected.body.data.stage).toBe(ApplicationStage.REJECTED);

    const refreshed = await JobModel.findById(job._id);
    expect(refreshed!.hiredCount).toBe(0);
    expect(refreshed!.status).toBe(JobStatus.HIRING);
  });

  it('refuses to touch an application on another employer’s job', async () => {
    const job = await makeJob(employer);
    const [applicationId] = await applyBoth(job);

    const intruder = await makeUser(UserRole.EMPLOYER, {
      name: 'Other Contractor',
      username: 'other_co',
      email: 'other@example.com',
    });

    const response = await request(app)
      .patch(`${API}/employer/applications/${applicationId}/stage`)
      .set('Authorization', `Bearer ${intruder.token}`)
      .send({ stage: 'SHORTLISTED' });

    expect(response.status).toBe(403);
  });
});

describe('GET /me/applications', () => {
  it('returns the worker’s own applications, newest first', async () => {
    const first = await makeJob(employer, { slug: 'job-one' });
    const second = await makeJob(employer, { slug: 'job-two' });

    for (const job of [first, second]) {
      await request(app)
        .post(`${API}/jobs/${job.id}/apply`)
        .set('Authorization', `Bearer ${worker.token}`)
        .send({});
    }

    const response = await request(app)
      .get(`${API}/me/applications`)
      .set('Authorization', `Bearer ${worker.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].job.slug).toBe('job-two');
    expect(response.body.meta.total).toBe(2);
  });

  it('shows nothing of another worker’s applications', async () => {
    const job = await makeJob(employer);
    await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({});

    const response = await request(app)
      .get(`${API}/me/applications`)
      .set('Authorization', `Bearer ${otherWorker.token}`);

    expect(response.body.data).toHaveLength(0);
  });
});

describe('messaging about a job', () => {
  it('lets a worker write to the employer without knowing who they are', async () => {
    const job = await makeJob(employer);

    const response = await request(app)
      .post(`${API}/conversations`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({ job: job.id, text: 'Is the site near Andheri station?' });

    expect(response.status).toBe(201);
    expect(response.body.data.conversation.participants).toHaveLength(2);
    expect(response.body.data.conversation.job.id).toBe(job.id);
    expect(response.body.data.message.body).toBe('Is the site near Andheri station?');

    // The employer sees it, with one unread.
    const inbox = await request(app)
      .get(`${API}/conversations`)
      .set('Authorization', `Bearer ${employer.token}`);
    expect(inbox.body.data).toHaveLength(1);
    expect(inbox.body.data[0].unreadCount).toBe(1);
  });

  it('reuses the one thread for the same pair and job', async () => {
    const job = await makeJob(employer);
    const write = (text: string) =>
      request(app)
        .post(`${API}/conversations`)
        .set('Authorization', `Bearer ${worker.token}`)
        .send({ job: job.id, text });

    const first = await write('Is there accommodation?');
    const second = await write('And what about food?');

    expect(second.body.data.conversation.id).toBe(first.body.data.conversation.id);

    const messages = await request(app)
      .get(`${API}/conversations/${first.body.data.conversation.id}/messages`)
      .set('Authorization', `Bearer ${employer.token}`);
    expect(messages.body.data).toHaveLength(2);
  });

  it('attaches the thread to the application when there is one', async () => {
    const job = await makeJob(employer);
    const applied = await request(app)
      .post(`${API}/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({});

    await request(app)
      .post(`${API}/conversations`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({ job: job.id, text: 'Applied just now — happy to come by tomorrow.' });

    const application = await ApplicationModel.findById(applied.body.data.id);
    expect(application!.conversation).toBeTruthy();
  });

  it('refuses a worker opening a thread with no job behind it', async () => {
    const response = await request(app)
      .post(`${API}/conversations`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({ recipient: employer.id, text: 'Any work going?' });

    expect(response.status).toBe(400);
  });

  it('keeps a third party out of a conversation', async () => {
    const job = await makeJob(employer);
    const started = await request(app)
      .post(`${API}/conversations`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({ job: job.id, text: 'Hello' });

    const response = await request(app)
      .get(`${API}/conversations/${started.body.data.conversation.id}/messages`)
      .set('Authorization', `Bearer ${otherWorker.token}`);

    expect(response.status).toBe(403);
  });

  it('clears the unread count when the thread is opened', async () => {
    const job = await makeJob(employer);
    const started = await request(app)
      .post(`${API}/conversations`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({ job: job.id, text: 'Hello' });

    await request(app)
      .post(`${API}/conversations/${started.body.data.conversation.id}/read`)
      .set('Authorization', `Bearer ${employer.token}`)
      .expect(200);

    const unread = await request(app)
      .get(`${API}/conversations/unread-count`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(unread.body.data.total).toBe(0);
  });
});

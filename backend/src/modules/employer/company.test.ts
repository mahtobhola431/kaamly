import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ApprovalStatus, AuthProvider, UserRole } from '@rokdajob/shared';
import { createApp } from '@/app';
import { User, hashPassword } from '@/modules/auth/user.model';
import { CompanyModel } from './company.model';

const API = '/api/v1';

let mongo: MongoMemoryServer;
const app = createApp();

let token: string;
let workerToken: string;

async function signIn(email: string, password: string): Promise<string> {
  const response = await request(app)
    .post(`${API}/auth/login`)
    .send({ identifier: email, password });
  return response.body.data.tokens.accessToken as string;
}

async function makeUser(role: UserRole, email: string, username: string): Promise<void> {
  await User.create({
    name: role === UserRole.EMPLOYER ? 'Sunil Sharma' : 'Ravi Kumar',
    username,
    email,
    passwordHash: await hashPassword('goodpass1'),
    providers: [AuthProvider.LOCAL],
    role,
    ...(role === UserRole.EMPLOYER ? { companyName: 'Sharma Construction' } : {}),
    approval: {
      status: role === UserRole.EMPLOYER ? ApprovalStatus.APPROVED : ApprovalStatus.AUTO_APPROVED,
    },
    registrationComplete: true,
    emailVerifiedAt: new Date(),
  });
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'rokdajob-test' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));

  await makeUser(UserRole.EMPLOYER, 'sunil@example.com', 'sunil_builds');
  await makeUser(UserRole.WORKER, 'ravi@example.com', 'ravi.kumar');
  token = await signIn('sunil@example.com', 'goodpass1');
  workerToken = await signIn('ravi@example.com', 'goodpass1');
});

describe('GET /employer/company', () => {
  it('creates the company from the name given at registration', async () => {
    const response = await request(app)
      .get(`${API}/employer/company`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Sharma Construction');
    expect(response.body.data.verification).toEqual({ company: false, gstin: false });
    // Nothing invented: a fresh company has no location, rating or description.
    expect(response.body.data.location).toBeUndefined();
    expect(response.body.data.ratingCount).toBe(0);
    expect(response.body.data.activeJobCount).toBe(0);
  });

  it('is closed to workers', async () => {
    const response = await request(app)
      .get(`${API}/employer/company`)
      .set('Authorization', `Bearer ${workerToken}`);

    expect(response.status).toBe(403);
  });
});

/**
 * The company is created lazily on first use, so a test that wants to seed a field on it
 * has to make it exist first. Reading is what does that.
 */
async function seedCompany(fields: Record<string, unknown>): Promise<void> {
  await request(app).get(`${API}/employer/company`).set('Authorization', `Bearer ${token}`);
  const company = await CompanyModel.findOne({});
  company!.set(fields);
  await company!.save();
}

describe('PATCH /employer/company', () => {
  it('saves the details a contractor enters', async () => {
    const response = await request(app)
      .patch(`${API}/employer/company`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sharma Infra Contractors',
        type: 'CONSTRUCTION',
        about: 'Civil contracting across Mumbai and Thane. Weekly payouts.',
        size: '50-200 workers',
        foundedYear: 2011,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Sharma Infra Contractors');
    expect(response.body.data.type).toBe('CONSTRUCTION');
    expect(response.body.data.foundedYear).toBe(2011);

    // Renaming re-slugs, or every public URL would keep the old name.
    expect(response.body.data.slug).toBe('sharma-infra-contractors');
  });

  it('clears the GSTIN badge when the number changes', async () => {
    await seedCompany({ gstin: '27ABCDE1234F1Z5', 'verification.gstin': true });

    const response = await request(app)
      .patch(`${API}/employer/company`)
      .set('Authorization', `Bearer ${token}`)
      .send({ gstin: '29ABCDE1234F1Z5' });

    expect(response.status).toBe(200);
    expect(response.body.data.gstin).toBe('29ABCDE1234F1Z5');
    // A verified badge belongs to the number an admin actually checked.
    expect(response.body.data.verification.gstin).toBe(false);
  });

  it('keeps the badge when the GSTIN is resubmitted unchanged', async () => {
    await seedCompany({ gstin: '27ABCDE1234F1Z5', 'verification.gstin': true });

    const response = await request(app)
      .patch(`${API}/employer/company`)
      .set('Authorization', `Bearer ${token}`)
      .send({ gstin: '27ABCDE1234F1Z5', about: 'Same number, new description.' });

    expect(response.body.data.verification.gstin).toBe(true);
  });

  it('rejects a malformed GSTIN', async () => {
    const response = await request(app)
      .patch(`${API}/employer/company`)
      .set('Authorization', `Bearer ${token}`)
      .send({ gstin: 'NOT-A-GSTIN' });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].path).toBe('gstin');
  });

  it('refuses a founding year in the future', async () => {
    const response = await request(app)
      .patch(`${API}/employer/company`)
      .set('Authorization', `Bearer ${token}`)
      .send({ foundedYear: new Date().getFullYear() + 5 });

    expect(response.status).toBe(400);
  });

  it('does not let a company verify itself', async () => {
    await request(app)
      .patch(`${API}/employer/company`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sharma Infra', verification: { company: true, gstin: true } })
      .expect(200);

    const company = await CompanyModel.findOne({});
    expect(company!.verification.company).toBe(false);
    expect(company!.verification.gstin).toBe(false);
  });

  it('does not let a company set its own rating', async () => {
    await request(app)
      .patch(`${API}/employer/company`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sharma Infra', ratingAvg: 5, ratingCount: 999 })
      .expect(200);

    const company = await CompanyModel.findOne({});
    expect(company!.ratingAvg).toBe(0);
    expect(company!.ratingCount).toBe(0);
  });

  it('clears a field when sent an empty string', async () => {
    await request(app)
      .patch(`${API}/employer/company`)
      .set('Authorization', `Bearer ${token}`)
      .send({ about: 'Something' })
      .expect(200);

    const response = await request(app)
      .patch(`${API}/employer/company`)
      .set('Authorization', `Bearer ${token}`)
      .send({ about: '' });

    expect(response.body.data.about).toBeUndefined();
  });

  it('is closed to workers', async () => {
    const response = await request(app)
      .patch(`${API}/employer/company`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ name: 'Not mine' });

    expect(response.status).toBe(403);
  });
});

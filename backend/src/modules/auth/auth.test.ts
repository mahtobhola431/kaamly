import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AdminLevel, ApprovalStatus, AuthProvider, UserRole } from '@rokdajob/shared';
import { createApp } from '@/app';
import { authenticate, requireApproved } from '@/middleware/authenticate';
import { errorHandler } from '@/middleware/error-handler';
import { User, hashPassword } from './user.model';

const API = '/api/v1';

let mongo: MongoMemoryServer;
const app = createApp();

/** A stand-in for a future job-posting route, used to prove the approval gate bites. */
const gatedApp = (() => {
  const probe = express();
  probe.get('/gated', authenticate, requireApproved, (_req, res) => {
    res.json({ success: true, data: { reached: true } });
  });
  probe.use(errorHandler);
  return probe;
})();

const workerPayload = {
  role: 'WORKER',
  name: 'Ravi Kumar',
  username: 'ravi.kumar',
  email: 'ravi@example.com',
  password: 'goodpass1',
};

const contractorPayload = {
  role: 'EMPLOYER',
  name: 'Sunil Sharma',
  username: 'sunil_builds',
  email: 'sunil@example.com',
  password: 'goodpass1',
  companyName: 'Sharma Construction',
};

async function seedAdmin() {
  return User.create({
    name: 'Admin',
    username: 'admin',
    email: 'admin@example.com',
    passwordHash: await hashPassword('adminpass1'),
    providers: [AuthProvider.LOCAL],
    role: UserRole.ADMIN,
    adminLevel: AdminLevel.SUPER,
    approval: { status: ApprovalStatus.AUTO_APPROVED },
    emailVerifiedAt: new Date(),
  });
}

async function loginAs(identifier: string, password: string) {
  const response = await request(app).post(`${API}/auth/login`).send({ identifier, password });
  return response;
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
});

describe('POST /auth/register', () => {
  it('registers an employee and lets them act immediately', async () => {
    const response = await request(app).post(`${API}/auth/register`).send(workerPayload);

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe(UserRole.WORKER);
    expect(response.body.data.user.approval.status).toBe(ApprovalStatus.AUTO_APPROVED);
    expect(response.body.data.user.username).toBe('ravi.kumar');
    expect(response.body.data.tokens.accessToken).toBeTruthy();

    // The refresh token is a cookie, never part of the JSON body.
    expect(JSON.stringify(response.body)).not.toContain('rj_rt');
    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(
      cookies.some((cookie) => cookie.startsWith('rj_rt=') && cookie.includes('HttpOnly')),
    ).toBe(true);
  });

  it('registers a contractor as pending approval', async () => {
    const response = await request(app).post(`${API}/auth/register`).send(contractorPayload);

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe(UserRole.EMPLOYER);
    expect(response.body.data.user.approval.status).toBe(ApprovalStatus.PENDING);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post(`${API}/auth/register`).send(workerPayload);
    const response = await request(app)
      .post(`${API}/auth/register`)
      .send({ ...workerPayload, username: 'ravi.two' });

    expect(response.status).toBe(409);
  });

  it('rejects a duplicate username with 409', async () => {
    await request(app).post(`${API}/auth/register`).send(workerPayload);
    const response = await request(app)
      .post(`${API}/auth/register`)
      .send({ ...workerPayload, email: 'other@example.com' });

    expect(response.status).toBe(409);
  });

  it('requires a company name from contractors', async () => {
    const { companyName: _omitted, ...withoutCompany } = contractorPayload;
    const response = await request(app).post(`${API}/auth/register`).send(withoutCompany);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an attempt to self-register as ADMIN', async () => {
    const response = await request(app)
      .post(`${API}/auth/register`)
      .send({ ...workerPayload, role: 'ADMIN' });

    expect(response.status).toBe(400);
  });

  it('rejects a weak password', async () => {
    const response = await request(app)
      .post(`${API}/auth/register`)
      .send({ ...workerPayload, password: 'short' });

    expect(response.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post(`${API}/auth/register`).send(workerPayload);
  });

  it('accepts an email address', async () => {
    const response = await loginAs('ravi@example.com', 'goodpass1');
    expect(response.status).toBe(200);
    expect(response.body.data.user.username).toBe('ravi.kumar');
  });

  it('accepts a username', async () => {
    const response = await loginAs('ravi.kumar', 'goodpass1');
    expect(response.status).toBe(200);
  });

  it('is case-insensitive on the identifier', async () => {
    const response = await loginAs('RAVI@example.com', 'goodpass1');
    expect(response.status).toBe(200);
  });

  it('rejects a wrong password without revealing the account exists', async () => {
    const wrongPassword = await loginAs('ravi@example.com', 'wrongpass1');
    const unknownAccount = await loginAs('nobody@example.com', 'wrongpass1');

    expect(wrongPassword.status).toBe(401);
    expect(unknownAccount.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownAccount.body.error.message);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('never returns the password hash', async () => {
    const response = await loginAs('ravi@example.com', 'goodpass1');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain('$2a$');
  });

  it('locks the account after repeated failures', async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await loginAs('ravi@example.com', 'wrongpass1');
    }

    // Even the correct password is refused while the lock holds.
    const response = await loginAs('ravi@example.com', 'goodpass1');
    expect(response.status).toBe(429);
  });
});

describe('contractor approval gate', () => {
  let contractorToken: string;
  let contractorId: string;
  let adminToken: string;

  beforeEach(async () => {
    const registered = await request(app).post(`${API}/auth/register`).send(contractorPayload);
    contractorToken = registered.body.data.tokens.accessToken;
    contractorId = registered.body.data.user.id;

    await seedAdmin();
    const adminLogin = await loginAs('admin@example.com', 'adminpass1');
    adminToken = adminLogin.body.data.tokens.accessToken;
  });

  it('lets a pending contractor sign in and read their own status', async () => {
    const login = await loginAs('sunil@example.com', 'goodpass1');

    // Pending is a 403 with a distinct code, so the client can show a waiting screen
    // instead of bouncing the user back to the login form.
    expect(login.status).toBe(403);
    expect(login.body.error.code).toBe('ACCOUNT_PENDING_APPROVAL');

    const me = await request(app)
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${contractorToken}`);

    expect(me.status).toBe(200);
    expect(me.body.data.approval.status).toBe(ApprovalStatus.PENDING);
  });

  it('blocks a pending contractor from gated routes', async () => {
    const response = await request(gatedApp)
      .get('/gated')
      .set('Authorization', `Bearer ${contractorToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ACCOUNT_PENDING_APPROVAL');
  });

  it('shows the contractor in the admin queue', async () => {
    const response = await request(app)
      .get(`${API}/admin/contractors?status=PENDING`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      email: 'sunil@example.com',
      companyName: 'Sharma Construction',
    });
  });

  it('opens the gate once an admin approves', async () => {
    const approval = await request(app)
      .patch(`${API}/admin/contractors/${contractorId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'GST verified' });

    expect(approval.status).toBe(200);
    expect(approval.body.data.approval.status).toBe(ApprovalStatus.APPROVED);

    const gated = await request(gatedApp)
      .get('/gated')
      .set('Authorization', `Bearer ${contractorToken}`);
    expect(gated.status).toBe(200);

    // The existing token keeps working: the gate reads live state, not the token claims.
    const login = await loginAs('sunil@example.com', 'goodpass1');
    expect(login.status).toBe(200);
  });

  it('treats a repeat approval as a no-op rather than an error', async () => {
    const url = `${API}/admin/contractors/${contractorId}/approve`;
    await request(app).patch(url).set('Authorization', `Bearer ${adminToken}`).send({});
    const second = await request(app)
      .patch(url)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(second.status).toBe(200);
    expect(second.body.data.approval.status).toBe(ApprovalStatus.APPROVED);
  });

  it('keeps the contractor out after a rejection, with the reason attached', async () => {
    const rejection = await request(app)
      .patch(`${API}/admin/contractors/${contractorId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Company registration could not be verified' });

    expect(rejection.status).toBe(200);

    const login = await loginAs('sunil@example.com', 'goodpass1');
    expect(login.status).toBe(403);
    expect(login.body.error.code).toBe('ACCOUNT_REJECTED');
    expect(login.body.error.message).toContain('could not be verified');
  });

  it('requires a reason to reject', async () => {
    const response = await request(app)
      .patch(`${API}/admin/contractors/${contractorId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('records every decision in the audit trail', async () => {
    await request(app)
      .patch(`${API}/admin/contractors/${contractorId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'checked' });

    const activities = await mongoose.connection
      .db!.collection('adminactivities')
      .find({})
      .toArray();

    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({
      action: 'CONTRACTOR_APPROVED',
      targetType: 'User',
      note: 'checked',
    });
  });
});

describe('admin route protection', () => {
  it('refuses a worker token', async () => {
    const registered = await request(app).post(`${API}/auth/register`).send(workerPayload);
    const token = registered.body.data.tokens.accessToken;

    const response = await request(app)
      .get(`${API}/admin/contractors`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it('refuses an anonymous request', async () => {
    const response = await request(app).get(`${API}/admin/contractors`);
    expect(response.status).toBe(401);
  });

  it('refuses a SUPPORT admin the right to decide', async () => {
    const admin = await seedAdmin();
    admin.adminLevel = AdminLevel.SUPPORT;
    await admin.save();

    const registered = await request(app).post(`${API}/auth/register`).send(contractorPayload);
    const login = await loginAs('admin@example.com', 'adminpass1');
    const token = login.body.data.tokens.accessToken;

    // Reading the queue is allowed at SUPPORT...
    const list = await request(app)
      .get(`${API}/admin/contractors`)
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);

    // ...but deciding is not.
    const approve = await request(app)
      .patch(`${API}/admin/contractors/${registered.body.data.user.id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(approve.status).toBe(403);
  });
});

describe('session lifecycle', () => {
  it('rotates the refresh token and revokes the family on reuse', async () => {
    const agent = request.agent(app);
    await agent.post(`${API}/auth/register`).send(workerPayload);

    const first = await agent.post(`${API}/auth/refresh`).send();
    expect(first.status).toBe(200);
    expect(first.body.data.tokens.accessToken).toBeTruthy();

    // Capture the rotated cookie, then replay the one it replaced.
    const rotated = (first.headers['set-cookie'] as unknown as string[])
      .find((cookie) => cookie.startsWith('rj_rt='))!
      .split(';')[0]!;

    const second = await agent.post(`${API}/auth/refresh`).send();
    expect(second.status).toBe(200);

    const replay = await request(app).post(`${API}/auth/refresh`).set('Cookie', rotated).send();
    expect(replay.status).toBe(401);

    // Replay detection kills the whole family, so the current token dies too.
    const afterReplay = await agent.post(`${API}/auth/refresh`).send();
    expect(afterReplay.status).toBe(401);
  });

  it('stops accepting the refresh token after logout', async () => {
    const agent = request.agent(app);
    await agent.post(`${API}/auth/register`).send(workerPayload);

    const logout = await agent.post(`${API}/auth/logout`).send();
    expect(logout.status).toBe(204);

    const refresh = await agent.post(`${API}/auth/refresh`).send();
    expect(refresh.status).toBe(401);
  });

  it('refuses to refresh without a cookie', async () => {
    const response = await request(app).post(`${API}/auth/refresh`).send();
    expect(response.status).toBe(401);
  });

  it('rejects a garbage access token', async () => {
    const response = await request(app)
      .get(`${API}/auth/me`)
      .set('Authorization', 'Bearer not-a-real-token');

    expect(response.status).toBe(401);
  });
});

describe('GET /auth/availability', () => {
  it('reports what is taken', async () => {
    await request(app).post(`${API}/auth/register`).send(workerPayload);

    const taken = await request(app).get(`${API}/auth/availability?username=ravi.kumar`);
    expect(taken.body.data.username).toBe(false);

    const free = await request(app).get(`${API}/auth/availability?username=someone.else`);
    expect(free.body.data.username).toBe(true);
  });
});

describe('password reset', () => {
  it('ends every session once the password changes', async () => {
    const agent = request.agent(app);
    await agent.post(`${API}/auth/register`).send(workerPayload);

    const forgot = await request(app)
      .post(`${API}/auth/password/forgot`)
      .send({ email: 'ravi@example.com' });
    expect(forgot.status).toBe(200);

    // The emailed token is only stored as a digest, so the test re-mints one the same way
    // the service does rather than trying to read the original back out.
    const { generateToken, hashToken } = await import('@/utils/crypto');
    const token = generateToken(32);
    await User.updateOne(
      { email: 'ravi@example.com' },
      {
        $set: {
          passwordResetTokenHash: hashToken(token),
          passwordResetExpiresAt: new Date(Date.now() + 60_000),
        },
      },
    );

    const reset = await request(app).post(`${API}/auth/password/reset`).send({
      token,
      password: 'brandnew123',
      confirmPassword: 'brandnew123',
    });
    expect(reset.status).toBe(200);

    expect((await loginAs('ravi@example.com', 'goodpass1')).status).toBe(401);
    expect((await loginAs('ravi@example.com', 'brandnew123')).status).toBe(200);
    expect((await agent.post(`${API}/auth/refresh`).send()).status).toBe(401);
  });

  it('answers the same way for an unknown address', async () => {
    const response = await request(app)
      .post(`${API}/auth/password/forgot`)
      .send({ email: 'nobody@example.com' });

    expect(response.status).toBe(200);
  });

  it('refuses an expired reset token', async () => {
    await request(app).post(`${API}/auth/register`).send(workerPayload);

    const { generateToken, hashToken } = await import('@/utils/crypto');
    const token = generateToken(32);
    await User.updateOne(
      { email: 'ravi@example.com' },
      {
        $set: {
          passwordResetTokenHash: hashToken(token),
          passwordResetExpiresAt: new Date(Date.now() - 1000),
        },
      },
    );

    const response = await request(app)
      .post(`${API}/auth/password/reset`)
      .send({ token, password: 'brandnew123', confirmPassword: 'brandnew123' });

    expect(response.status).toBe(400);
  });
});

describe('google sign-in', () => {
  it('answers 503 while no Google credentials are configured', async () => {
    const response = await request(app).get(`${API}/auth/google`);

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('OAUTH_FAILED');
  });

  it('refuses a callback whose state does not match the cookie', async () => {
    const response = await request(app)
      .get(`${API}/auth/google/callback?code=abcdefghijkl&state=forged-state-value`)
      .set('Cookie', 'rj_oauth_state=a-different-value');

    expect(response.status).toBe(400);
  });

  it('links Google onto an existing password account rather than duplicating it', async () => {
    await request(app).post(`${API}/auth/register`).send(workerPayload);

    const { loginWithGoogle } = await import('./auth.service');
    const result = await loginWithGoogle(
      {
        googleId: 'google-sub-123',
        email: 'ravi@example.com',
        emailVerified: true,
        name: 'Ravi Kumar',
      },
      undefined,
      {},
    );

    expect(result.isNewUser).toBe(false);
    expect(result.session.user.providers).toEqual(
      expect.arrayContaining([AuthProvider.LOCAL, AuthProvider.GOOGLE]),
    );
    expect(await User.countDocuments({ email: 'ravi@example.com' })).toBe(1);

    // Google vouched for the address, so it counts as verified.
    expect(result.session.user.emailVerified).toBe(true);
  });

  it('parks a first-time Google user without a role until they choose one', async () => {
    const { completeRegistration, loginWithGoogle } = await import('./auth.service');

    const result = await loginWithGoogle(
      {
        googleId: 'google-sub-456',
        email: 'newcomer@example.com',
        emailVerified: true,
        name: 'New Comer',
      },
      undefined,
      {},
    );

    expect(result.isNewUser).toBe(true);
    expect(result.needsRole).toBe(true);
    expect(result.session.user.registrationComplete).toBe(false);
    // A username is derived from the email when Google gives us no handle.
    expect(result.session.user.username).toBe('newcomer');

    const completed = await completeRegistration(result.session.user.id, {
      role: 'EMPLOYER',
      companyName: 'Newcomer Works',
    });

    // Choosing contractor at this point drops into the same approval queue.
    expect(completed.role).toBe(UserRole.EMPLOYER);
    expect(completed.approval.status).toBe(ApprovalStatus.PENDING);
    expect(completed.registrationComplete).toBe(true);
  });

  it('registers a Google user straight into the role carried on the state', async () => {
    const { loginWithGoogle } = await import('./auth.service');

    const result = await loginWithGoogle(
      {
        googleId: 'google-sub-789',
        email: 'direct@example.com',
        emailVerified: true,
        name: 'Direct Worker',
      },
      'WORKER',
      {},
    );

    expect(result.needsRole).toBe(false);
    expect(result.session.user.role).toBe(UserRole.WORKER);
    expect(result.session.user.approval.status).toBe(ApprovalStatus.AUTO_APPROVED);
  });

  it('refuses a Google profile whose email is unverified', async () => {
    const { loginWithGoogle } = await import('./auth.service');

    await expect(
      loginWithGoogle(
        {
          googleId: 'google-sub-000',
          email: 'unverified@example.com',
          emailVerified: false,
          name: 'Unverified',
        },
        'WORKER',
        {},
      ),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

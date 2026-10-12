import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Port of the Java IamSecurityAndAuthTest: the same 10 scenarios against the
 * Node.js API and a real PostgreSQL, plus lockout and portal checks.
 */
describe('IAM: registration, login, tokens and role isolation', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const PASSWORD = 'SecurePass123!';

  const http = () => request(app.getHttpServer());

  async function seedUser(
    username: string,
    roles: string[],
    extra: { accountStatus?: string; accountLockedUntil?: Date } = {},
  ): Promise<void> {
    const roleRows = await prisma.role.findMany({ where: { name: { in: roles } } });
    await prisma.user.create({
      data: {
        userCode: `USR-T-${username}`,
        username,
        email: `${username}@test.factorygrid.com`,
        passwordHash: await bcrypt.hash(PASSWORD, 4),
        fullName: `Test ${username}`,
        companyName: 'Test Co',
        ...extra,
        roles: { create: roleRows.map((role) => ({ roleId: role.id })) },
      },
    });
  }

  async function login(usernameOrEmail: string, password = PASSWORD) {
    return http().post('/api/v1/auth/login').send({ usernameOrEmail, password });
  }

  beforeAll(async () => {
    app = await createApp({ logger: false });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);

    await seedUser('t_admin', ['ROLE_ADMIN']);
    await seedUser('t_inactive', ['ROLE_BUYER'], { accountStatus: 'INACTIVE' });
    await seedUser('t_locked', ['ROLE_BUYER'], { accountLockedUntil: new Date(Date.now() + 15 * 60_000) });
    await seedUser('t_buyer', ['ROLE_BUYER']);
    await seedUser('t_victim', ['ROLE_BUYER']);
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. buyer registration creates a user with ROLE_BUYER only and isolates the buyer portal', async () => {
    const res = await http().post('/api/v1/auth/register/buyer').send({
      username: 'new_buyer_user',
      email: 'New.Buyer@Pharma.in',
      password: PASSWORD,
      fullName: 'New Buyer',
      companyName: 'Pharma Buyers Ltd',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('new_buyer_user');
    expect(res.body.user.email).toBe('new.buyer@pharma.in');
    expect(res.body.user.roles).toEqual(['ROLE_BUYER']);
    expect(res.body.user.passwordHash).toBeUndefined();

    const token = (await login('new_buyer_user')).body.accessToken;
    const buyer = await http().get('/api/v1/buyer/dashboard').set('Authorization', `Bearer ${token}`);
    expect(buyer.status).toBe(200);
    expect(buyer.body.data.portal).toBe('BUYER');

    const mfg = await http().get('/api/v1/manufacturer/dashboard').set('Authorization', `Bearer ${token}`);
    expect(mfg.status).toBe(403);
  });

  it('2. manufacturer registration gives ROLE_MANUFACTURER and ROLE_SUPPLIER and isolates the manufacturer portal', async () => {
    const res = await http().post('/api/v1/auth/register/manufacturer').send({
      username: 'new_mfg_user',
      email: 'mfg@plant.in',
      password: PASSWORD,
      fullName: 'New Manufacturer',
      companyName: 'Plant Pvt Ltd',
      factoryDetails: 'Unit 4, Baddi',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.roles).toEqual(expect.arrayContaining(['ROLE_MANUFACTURER', 'ROLE_SUPPLIER']));
    expect(res.body.user.passwordHash).toBeUndefined();

    const token = (await login('mfg@plant.in')).body.accessToken;
    const mfg = await http().get('/api/v1/manufacturer/dashboard').set('Authorization', `Bearer ${token}`);
    expect(mfg.status).toBe(200);
    expect(mfg.body.data.portal).toBe('MANUFACTURER');

    const buyer = await http().get('/api/v1/buyer/dashboard').set('Authorization', `Bearer ${token}`);
    expect(buyer.status).toBe(403);
  });

  it('3. duplicate username or email is rejected with 409', async () => {
    const body = {
      username: 'dup_user',
      email: 'dup@test.in',
      password: PASSWORD,
      fullName: 'Dup',
      companyName: 'Dup Co',
    };
    expect((await http().post('/api/v1/auth/register/buyer').send(body)).status).toBe(201);

    const again = await http().post('/api/v1/auth/register/buyer').send({ ...body, username: 'dup_user_2' });
    expect(again.status).toBe(409);
    expect(again.body.error).toBe('Conflict');
  });

  it('4. validation rejects an invalid email and a short password with field errors', async () => {
    const res = await http().post('/api/v1/auth/register/buyer').send({
      username: 'bad_input',
      email: 'not-an-email',
      password: 'short',
      fullName: 'Bad Input',
      companyName: 'Bad Co',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Bad Request');
    expect(res.body.errors.email).toBeTruthy();
    expect(res.body.errors.password).toBeTruthy();
  });

  it('5. a wrong password is rejected with 401', async () => {
    const res = await login('t_buyer', 'WrongPassword!');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
    expect(res.body.message).toBe('Invalid username or password');
  });

  it('6. an inactive account is rejected with 403', async () => {
    const res = await login('t_inactive');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('7. a locked account is rejected with 423', async () => {
    const res = await login('t_locked');
    expect(res.status).toBe(423);
    expect(res.body.error).toBe('Locked');
  });

  it('8. the user list is admin-only', async () => {
    const adminToken = (await login('t_admin')).body.accessToken;
    const res = await http().get('/api/v1/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].passwordHash).toBeUndefined();

    const buyerToken = (await login('t_buyer')).body.accessToken;
    const denied = await http().get('/api/v1/admin/users').set('Authorization', `Bearer ${buyerToken}`);
    expect(denied.status).toBe(403);
  });

  it('9. protected endpoints reject missing or forged tokens with 401', async () => {
    const missing = await http().get('/api/v1/auth/me');
    expect(missing.status).toBe(401);
    expect(missing.body.error).toBe('Unauthorized');

    const forged = await http().get('/api/v1/admin/users').set('Authorization', 'Bearer not.a.token');
    expect(forged.status).toBe(401);
  });

  it('10. refresh rotates the token and logout revokes it', async () => {
    const first = await login('t_buyer');
    expect(first.status).toBe(200);

    const refreshed = await http().post('/api/v1/auth/refresh').send({ refreshToken: first.body.refreshToken });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toBeTruthy();
    expect(refreshed.body.refreshToken).not.toBe(first.body.refreshToken);

    const reused = await http().post('/api/v1/auth/refresh').send({ refreshToken: first.body.refreshToken });
    expect(reused.status).toBe(401);

    const logout = await http().post('/api/v1/auth/logout').send({ refreshToken: refreshed.body.refreshToken });
    expect(logout.status).toBe(200);

    const afterLogout = await http().post('/api/v1/auth/refresh').send({ refreshToken: refreshed.body.refreshToken });
    expect(afterLogout.status).toBe(401);

    const me = await http().get('/api/v1/auth/me').set('Authorization', `Bearer ${refreshed.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.username).toBe('t_buyer');
  });

  it('11. five wrong passwords lock the account', async () => {
    for (let attempt = 1; attempt <= 5; attempt++) {
      expect((await login('t_victim', 'WrongPassword!')).status).toBe(401);
    }
    expect((await login('t_victim')).status).toBe(423);
  });

  it('12. a portal the user has no role for is refused', async () => {
    const res = await http()
      .post('/api/v1/auth/login')
      .send({ usernameOrEmail: 't_buyer', password: PASSWORD, portalType: 'MANUFACTURER' });
    expect(res.status).toBe(401);
  });

  it('13. malformed JSON gets a clean 400', async () => {
    const res = await http().post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Malformed JSON request payload');
  });
});

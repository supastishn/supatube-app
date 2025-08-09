const { request, registerAndLogin, authHeader } = require('./helpers/testUtils');

describe('User Auth & Profile', () => {
  test('register validations', async () => {
    const r1 = await request.post('/api/users/register').send({ username: '', password: 'password123' });
    expect(r1.status).toBe(400);
    const r2 = await request.post('/api/users/register').send({ username: 'u1', password: 'short' });
    expect(r2.status).toBe(400);
  });

  test('register and login', async () => {
    const username = 'alice_' + Date.now();
    const registerRes = await request.post('/api/users/register').send({ username, password: 'password123' });
    expect([201,409]).toContain(registerRes.status);
    const loginRes = await request.post('/api/users/login').send({ username, password: 'password123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
  });

  test('login invalid creds', async () => {
    const res = await request.post('/api/users/login').send({ username: 'nope', password: 'password123' });
    expect([401,400]).toContain(res.status);
  });

  test('get profile requires auth', async () => {
    const res = await request.get('/api/users/me');
    expect(res.status).toBe(401);
  });

  test('get profile works', async () => {
    const { token, user } = await registerAndLogin();
    const res = await request.get('/api/users/me').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
    expect(typeof res.body.subscribers).toBe('number');
  });
});

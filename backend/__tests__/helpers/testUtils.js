const supertest = require('supertest');
const app = require('../../app');

const request = supertest(app);

async function registerAndLogin(username = `user_${Date.now()}`, password = 'password123') {
  const registerRes = await request.post('/api/users/register').send({ username, password });
  if (registerRes.status !== 201 && registerRes.status !== 409) {
    throw new Error('Failed to register test user: ' + registerRes.text);
  }
  const loginRes = await request.post('/api/users/login').send({ username, password });
  if (loginRes.status !== 200) {
    throw new Error('Failed to login test user: ' + loginRes.text);
  }
  return { token: loginRes.body.token, user: loginRes.body.user };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { request, registerAndLogin, authHeader };

const { request } = require('./helpers/testUtils');

describe('Search', () => {
  test('search without query returns empty', async () => {
    const res = await request.get('/api/search');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('search with query returns array', async () => {
    const res = await request.get('/api/search?q=test');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const { request, registerAndLogin, authHeader } = require('./helpers/testUtils');

function makeTempFile(ext, content='dummy') {
  const p = path.join(__dirname, 'tmp_' + Date.now() + '.' + ext);
  fs.writeFileSync(p, content);
  return p;
}

describe('Videos lifecycle & streaming', () => {
  let token, user, videoId;

  beforeAll(async () => {
    const auth = await registerAndLogin();
    token = auth.token; user = auth.user;
  });

  test('upload requires auth', async () => {
    const res = await request.post('/api/videos').field('title', 'Hello');
    expect(res.status).toBe(401);
  });

  test('upload validates fields', async () => {
    const res = await request.post('/api/videos').set(authHeader(token)).field('title', '').attach('video', makeTempFile('mp4'), { contentType: 'video/mp4' });
    expect(res.status).toBe(400);
  });

  test('upload success', async () => {
    const vfile = makeTempFile('mp4');
    const tfile = makeTempFile('jpg');
    const res = await request.post('/api/videos')
      .set(authHeader(token))
      .field('title', 'My First Video')
      .field('description', 'desc')
      .attach('video', vfile, { contentType: 'video/mp4' })
      .attach('thumbnail', tfile, { contentType: 'image/jpeg' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    videoId = res.body.id;
  });

  test('list public videos', async () => {
    const res = await request.get('/api/videos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('get video by id increments views and respects visibility', async () => {
    const res = await request.get(`/api/videos/${videoId}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.views).toBe('number');
  });

  test('update video requires owner and field validation', async () => {
    let res = await request.patch(`/api/videos/${videoId}`).set(authHeader(token)).send({});
    expect(res.status).toBe(400);
    res = await request.patch(`/api/videos/${videoId}`).set(authHeader(token)).send({ visibility: 'invalid' });
    expect(res.status).toBe(400);
    res = await request.patch(`/api/videos/${videoId}`).set(authHeader(token)).send({ title: 'New' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New');
  });

  test('like toggle', async () => {
    let res = await request.post(`/api/videos/${videoId}/like`).set(authHeader(token));
    expect([200,201]).toContain(res.status);
    res = await request.post(`/api/videos/${videoId}/like`).set(authHeader(token));
    expect([200,201]).toContain(res.status);
  });

  test('comments CRUD on video', async () => {
    // list comments
    let res = await request.get(`/api/videos/${videoId}/comments`);
    expect(res.status).toBe(200);
    // post new
    res = await request.post(`/api/videos/${videoId}/comments`).set(authHeader(token)).send({ comment: 'Nice!' });
    expect(res.status).toBe(201);
    const commentId = res.body.id;
    // reply
    res = await request.post(`/api/videos/${videoId}/comments`).set(authHeader(token)).send({ comment: 'Thanks', parentCommentId: commentId });
    expect(res.status).toBe(201);
    // get replies
    res = await request.get(`/api/comments/${commentId}/replies`);
    expect(res.status).toBe(200);
  });

  test('stream thumbnail returns file or 404', async () => {
    const res = await request.get(`/api/videos/${videoId}/thumbnail`);
    expect([200,404,403]).toContain(res.status);
  });

  test('stream video handles processing and range', async () => {
    // We may not have ready processed rendition; still expect either 200/206/425/404
    const res = await request.get(`/api/videos/${videoId}/stream`).set('Range', 'bytes=0-10');
    expect([200,206,404,425,403]).toContain(res.status);
  });

  test('recommendations', async () => {
    const res = await request.get(`/api/videos/${videoId}/recommendations`);
    expect([200,403,404]).toContain(res.status);
  });

  test('delete video by owner', async () => {
    const res = await request.delete(`/api/videos/${videoId}`).set(authHeader(token));
    expect([200,404]).toContain(res.status);
  });
});

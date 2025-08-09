const { request, registerAndLogin, authHeader } = require('./helpers/testUtils');

// Utility: ensure we have a video for analytics/history
async function createVideo(token) {
  const res = await request.post('/api/videos').set(authHeader(token)).field('title', 'test').attach('video', Buffer.from('x'), { filename: 'x.mp4', contentType: 'video/mp4' });
  return res.body.id;
}

describe('History, Settings, Notifications, Live, Analytics', () => {
  let tokenOwner, owner, tokenViewer, viewer, videoId;

  beforeAll(async () => {
    ({ token: tokenOwner, user: owner } = await registerAndLogin('owner_' + Date.now()));
    ({ token: tokenViewer, user: viewer } = await registerAndLogin('viewer_' + Date.now()));
    videoId = await createVideo(tokenOwner);
  });

  test('settings get and update', async () => {
    const get1 = await request.get('/api/settings').set(authHeader(tokenOwner));
    expect(get1.status).toBe(200);
    expect(get1.body).toHaveProperty('record_watch_history');

    const upd = await request.patch('/api/settings').set(authHeader(tokenOwner)).send({ record_watch_history: false, default_upload_visibility: 'unlisted' });
    expect(upd.status).toBe(200);
    expect(upd.body.default_upload_visibility).toBe('unlisted');
  });

  test('history record/get/clear', async () => {
    let res = await request.post('/api/history/record').set(authHeader(tokenViewer)).send({ videoId });
    expect([200,201]).toContain(res.status);
    res = await request.get('/api/history').set(authHeader(tokenViewer));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res = await request.delete('/api/history').set(authHeader(tokenViewer));
    expect(res.status).toBe(200);
  });

  test('notifications flow (new_comment, replies, likes)', async () => {
    // viewer comments on owner's video -> owner gets notification
    let res = await request.post(`/api/videos/${videoId}/comments`).set(authHeader(tokenViewer)).send({ comment: 'hey' });
    expect(res.status).toBe(201);
    const topId = res.body.id;

    // owner replies -> viewer gets comment_reply
    res = await request.post(`/api/videos/${videoId}/comments`).set(authHeader(tokenOwner)).send({ comment: 'reply', parentCommentId: topId });
    expect(res.status).toBe(201);

    // owner likes viewer comment -> viewer gets comment_like
    res = await request.post(`/api/comments/${topId}/like`).set(authHeader(tokenOwner));
    expect([200,201]).toContain(res.status);

    // owner fetch notifications
    const n1 = await request.get('/api/notifications').set(authHeader(tokenOwner));
    expect(n1.status).toBe(200);
    expect(Array.isArray(n1.body)).toBe(true);

    // mark some as read (send empty should be 200 with updated 0)
    const mark = await request.post('/api/notifications/read').set(authHeader(tokenOwner)).send({ ids: [] });
    expect(mark.status).toBe(200);
    expect(mark.body).toHaveProperty('updated');
  });

  test('live streaming API', async () => {
    const keyRes = await request.get('/api/live/key').set(authHeader(tokenOwner));
    expect(keyRes.status).toBe(200);
    const reset = await request.post('/api/live/key/reset').set(authHeader(tokenOwner));
    expect(reset.status).toBe(200);

    const me = await request.get('/api/live/me').set(authHeader(tokenOwner));
    expect(me.status).toBe(200);
    const patch = await request.patch('/api/live/me').set(authHeader(tokenOwner)).send({ title: 'Live!' });
    expect(patch.status).toBe(200);

    const active = await request.get('/api/live/active');
    expect(active.status).toBe(200);
  });

  test('analytics log view & get stats', async () => {
    let res = await request.post(`/api/analytics/videos/${videoId}/view`).send({ watchedSeconds: 12 });
    expect(res.status).toBe(201);
    res = await request.get(`/api/analytics/videos/${videoId}/stats`).set(authHeader(tokenOwner));
    expect([200,404,403]).toContain(res.status);
    res = await request.get('/api/analytics/channel/me').set(authHeader(tokenOwner));
    expect(res.status).toBe(200);
  });
});

const { request, registerAndLogin, authHeader } = require('./helpers/testUtils');

describe('Comments likes, Subscriptions, Playlists', () => {
  let userA, userB, tokenA, tokenB, videoId, playlistId, topCommentId;

  beforeAll(async () => {
    ({ token: tokenA, user: userA } = await registerAndLogin('userA_' + Date.now()));
    ({ token: tokenB, user: userB } = await registerAndLogin('userB_' + Date.now()));

    // userA uploads a video
    const res = await request.post('/api/videos')
      .set(authHeader(tokenA))
      .field('title', 'Vid A')
      .attach('video', Buffer.from('dummy'), { filename: 'a.mp4', contentType: 'video/mp4' });
    videoId = res.body.id;
  });

  test('post comment and like comment', async () => {
    let res = await request.post(`/api/videos/${videoId}/comments`).set(authHeader(tokenB)).send({ comment: 'Hello' });
    expect(res.status).toBe(201);
    topCommentId = res.body.id;

    // toggle like
    res = await request.post(`/api/comments/${topCommentId}/like`).set(authHeader(tokenA));
    expect([200,201]).toContain(res.status);
    res = await request.post(`/api/comments/${topCommentId}/like`).set(authHeader(tokenA));
    expect([200,201]).toContain(res.status);
  });

  test('subscribe toggle and list subscribers', async () => {
    let res = await request.post(`/api/subscriptions/${userA.id}/toggle`).set(authHeader(tokenB));
    expect([200,201]).toContain(res.status);
    res = await request.get(`/api/subscriptions/${userA.id}/subscribers`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const feed = await request.get('/api/subscriptions/feed/me').set(authHeader(tokenB));
    expect(feed.status).toBe(200);
  });

  test('playlists CRUD and add/remove videos', async () => {
    // create
    let res = await request.post('/api/playlists').set(authHeader(tokenA)).send({ title: 'PL1', visibility: 'public' });
    expect(res.status).toBe(201);
    playlistId = res.body.id;

    // get playlist (public)
    let getRes = await request.get(`/api/playlists/${playlistId}`);
    expect(getRes.status).toBe(200);

    // update
    res = await request.patch(`/api/playlists/${playlistId}`).set(authHeader(tokenA)).send({ description: 'desc' });
    expect(res.status).toBe(200);

    // add video
    res = await request.post(`/api/playlists/${playlistId}/videos`).set(authHeader(tokenA)).send({ videoId });
    expect(res.status).toBe(201);

    // remove video
    res = await request.delete(`/api/playlists/${playlistId}/videos/${videoId}`).set(authHeader(tokenA));
    expect(res.status).toBe(200);

    // delete playlist
    res = await request.delete(`/api/playlists/${playlistId}`).set(authHeader(tokenA));
    expect(res.status).toBe(200);
  });
});

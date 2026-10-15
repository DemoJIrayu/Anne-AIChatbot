import request from 'supertest';
import { describe, expect, it } from 'vitest';
import createApp from '../src/app.js';

/**
 * QA tests for src/app.ts (the Express app, module under test is created fresh
 * per test so no shared mutable state leaks between cases).
 */
describe('app: GET /health and request handling', () => {
  it('returns exactly { status: "ok" } with a JSON content type', async () => {
    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toEqual({ status: 'ok' });
    expect(Object.keys(response.body as Record<string, unknown>)).toEqual([
      'status',
    ]);
  });

  it('ignores query strings and only serves GET /health', async () => {
    const app = createApp();

    const withQuery = await request(app).get('/health?verbose=1&x=2');
    expect(withQuery.status).toBe(200);
    expect(withQuery.body).toEqual({ status: 'ok' });

    for (const method of ['post', 'put', 'patch', 'delete'] as const) {
      const response = await request(app)[method]('/health');
      expect(response.status, `${method.toUpperCase()} /health`).toBe(404);
    }

    const unknownRoute = await request(app).get('/health-check');
    expect(unknownRoute.status).toBe(404);
  });

  it('rejects malformed JSON with 400 and oversized JSON with 413', async () => {
    const app = createApp();

    const malformed = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(malformed.status).toBe(400);

    // guards against the body size limit being disabled: default limit is 100kb
    const oversized = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ data: 'x'.repeat(200 * 1024) }));

    expect(oversized.status).toBe(413);
  });
});

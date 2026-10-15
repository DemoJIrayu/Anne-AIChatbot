import { describe, it, expect } from 'vitest';
import createApp from '../src/app.js';
import supertest from 'supertest';

describe('Health Check Endpoint', () => {
  const app = createApp();

  it('should return 200 OK with correct JSON response', async () => {
    const response = await supertest(app)
      .get('/health')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({ status: 'ok' });
  });
});

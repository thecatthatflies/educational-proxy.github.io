// __tests__/server.test.js
import request from 'supertest';
import { app, cleanup } from '../server.js';

describe('Server', () => {
  test('should respond to / with 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });

  test('should respond to /games with 200', async () => {
    const res = await request(app).get('/games');
    expect(res.status).toBe(200);
  });

  test('should handle 404', async () => {
    const res = await request(app).get('/non-existent');
    expect(res.status).toBe(404);
  });

  test('should redirect /gxmes to /games', async () => {
    const res = await request(app).get('/gxmes');
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe('/games');
  });

  // Clean up after all tests using the exported cleanup function
  afterAll(async () => {
    await cleanup();
  });
});

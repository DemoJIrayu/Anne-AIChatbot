import request from 'supertest';
import App from '../src/app';
import config from '../src/config';

// Mock database connections to avoid initialization errors in tests
vi.mock('../src/db/postgres/connection', () => {
  return {
    default: {
      getInstance: vi.fn().mockReturnValue({
        getClient: vi.fn().mockReturnValue({})
      })
    }
  };
});

vi.mock('../src/db/mongodb/connection', () => {
  return {
    default: {
      getInstance: vi.fn().mockReturnValue({
        getClient: vi.fn().mockReturnValue({})
      })
    }
  };
});

vi.mock('../src/db/redis/connection', () => {
  return {
    default: {
      getInstance: vi.fn().mockReturnValue({
        getClient: vi.fn().mockReturnValue({})
      })
    }
  };
});

// Mock Prisma client to avoid initialization errors
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => {
      return {
        $connect: vi.fn().mockResolvedValue(undefined),
        $disconnect: vi.fn().mockResolvedValue(undefined)
      };
    })
  };
});

describe('Health Check Endpoint', () => {
  let app: App;
  
  beforeAll(() => {
    // Set required environment variables for testing
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_BASE_URL = 'https://api.openai.com/v1';
    
    app = new App(config.port);
  });

  it('should return 200 status and correct response', async () => {
    const response = await request(app.app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  it('should return 404 for non-existent routes', async () => {
    const response = await request(app.app).get('/non-existent');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message', 'Route not found');
  });
});
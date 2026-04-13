const request = require('supertest');
const app = require('../server');

// Mock database pool
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

// Mock AI services
jest.mock('../services/aiService', () => ({
  processDocument: jest.fn(),
  generateEmbedding: jest.fn().mockResolvedValue(new Array(768).fill(0.1)),
  generateRAGAnswer: jest.fn().mockResolvedValue('Test answer'),
}));

jest.mock('../services/ragService', () => ({
  chunkText: jest.fn().mockReturnValue(['chunk1', 'chunk2']),
  storeEmbeddings: jest.fn().mockResolvedValue(undefined),
  retrieveRelevantChunks: jest.fn().mockResolvedValue([]),
}));

const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/auth/login - valid credentials returns 200 + token', async () => {
    const hash = await bcrypt.hash('teacher123', 10);
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Demo Teacher', email: 'teacher@demo.com', password_hash: hash, role: 'teacher' }]
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@demo.com', password: 'teacher123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('teacher');
  });

  test('POST /api/auth/login - invalid credentials returns 401', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@email.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
  });
});

describe('Documents Routes', () => {
  test('GET /api/documents - without auth returns 401', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(401);
  });

  test('GET /api/documents - with valid teacher token returns 200', async () => {
    const token = jwt.sign(
      { id: 1, email: 'teacher@demo.com', name: 'Demo Teacher', role: 'teacher' },
      process.env.JWT_SECRET || 'secret'
    );
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

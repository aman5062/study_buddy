const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateEmbedding, generateRAGAnswer } = require('../services/aiService');
const { retrieveRelevantChunks } = require('../services/ragService');

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { message, documentId } = req.body;
    
    const queryEmbedding = await generateEmbedding(message);
    const chunks = await retrieveRelevantChunks(pool, queryEmbedding, documentId ? parseInt(documentId) : null);
    
    const context = chunks.map(c => c.chunk_text).join('\n\n');
    
    const historyResult = await pool.query(
      'SELECT role, message FROM chat_history WHERE user_id = $1 AND (document_id = $2 OR ($2::integer IS NULL AND document_id IS NULL)) ORDER BY created_at DESC LIMIT 10',
      [req.user.id, documentId || null]
    );
    const history = historyResult.rows.reverse();
    
    const answer = await generateRAGAnswer(message, context, history);
    
    await pool.query(
      'INSERT INTO chat_history (user_id, document_id, role, message) VALUES ($1, $2, $3, $4)',
      [req.user.id, documentId || null, 'user', message]
    );
    await pool.query(
      'INSERT INTO chat_history (user_id, document_id, role, message) VALUES ($1, $2, $3, $4)',
      [req.user.id, documentId || null, 'assistant', answer]
    );
    
    const sources = chunks.map(c => ({ chunk: c.chunk_text.slice(0, 100) + '...', documentTitle: c.title }));
    res.json({ answer, sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    const { documentId } = req.query;
    const result = await pool.query(
      'SELECT * FROM chat_history WHERE user_id = $1 AND (document_id = $2 OR ($2::integer IS NULL AND document_id IS NULL)) ORDER BY created_at ASC',
      [req.user.id, documentId || null]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

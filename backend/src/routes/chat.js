const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateEmbedding, generateRAGAnswer } = require('../services/aiService');
const { retrieveRelevantChunks } = require('../services/ragService');

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { message, documentId } = req.body;
    const docId = Number.parseInt(documentId, 10);

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!Number.isInteger(docId)) {
      return res.status(400).json({ error: 'documentId is required for contextual answers' });
    }

    const docResult = await pool.query('SELECT id, teacher_id, status FROM documents WHERE id = $1', [docId]);
    const doc = docResult.rows[0];

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (doc.status !== 'ready') {
      return res.status(409).json({ error: 'Document is still processing' });
    }

    if (req.user.role === 'teacher' && doc.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this document' });
    }
    
    const queryEmbedding = await generateEmbedding(message);
    const chunks = await retrieveRelevantChunks(pool, queryEmbedding, docId);
    
    const context = chunks.map(c => c.chunk_text).join('\n\n');
    
    const historyResult = await pool.query(
      'SELECT role, message FROM chat_history WHERE user_id = $1 AND (document_id = $2 OR ($2::integer IS NULL AND document_id IS NULL)) ORDER BY created_at ASC LIMIT 10',
      [req.user.id, docId]
    );
    const history = historyResult.rows;
    
    const answer = await generateRAGAnswer(message, context, history);
    
    await pool.query(
      'INSERT INTO chat_history (user_id, document_id, role, message) VALUES ($1, $2, $3, $4)',
      [req.user.id, documentId || null, 'user', message]
    );
    await pool.query(
      'INSERT INTO chat_history (user_id, document_id, role, message) VALUES ($1, $2, $3, $4)',
      [req.user.id, docId, 'assistant', answer]
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

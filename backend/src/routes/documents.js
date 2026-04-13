const express = require('express');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const pool = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadPDF } = require('../middleware/upload');
const { processDocument } = require('../services/aiService');
const { chunkText, storeEmbeddings } = require('../services/ragService');

const router = express.Router();

router.post('/upload', authenticate, requireRole('teacher'), uploadPDF.single('file'), async (req, res) => {
  try {
    const { title } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Insert with processing status
    const docResult = await pool.query(
      'INSERT INTO documents (teacher_id, title, filename, file_path, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, title, file.originalname, file.path, 'processing']
    );
    const doc = docResult.rows[0];

    // Process async
    (async () => {
      try {
        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdfParse(dataBuffer);
        const text = pdfData.text;

        const aiResult = await processDocument(text);
        
        await pool.query(
          'UPDATE documents SET status=$1, summary=$2, qa=$3, flashcards=$4, mindmap=$5, predictions=$6 WHERE id=$7',
          ['ready', aiResult.summary, JSON.stringify(aiResult.qa), JSON.stringify(aiResult.flashcards),
           JSON.stringify(aiResult.mindmap), JSON.stringify(aiResult.predictions), doc.id]
        );

        const chunks = chunkText(text);
        await storeEmbeddings(pool, doc.id, chunks);
      } catch (err) {
        console.error('Processing error:', err);
        await pool.query("UPDATE documents SET status='failed' WHERE id=$1", [doc.id]);
      }
    })();

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'teacher') {
      result = await pool.query(
        'SELECT * FROM documents WHERE teacher_id = $1 ORDER BY created_at DESC',
        [req.user.id]
      );
    } else {
      result = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Document not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const doc = await pool.query('SELECT * FROM documents WHERE id = $1 AND teacher_id = $2', [req.params.id, req.user.id]);
    if (!doc.rows[0]) return res.status(404).json({ error: 'Document not found' });
    if (fs.existsSync(doc.rows[0].file_path)) fs.unlinkSync(doc.rows[0].file_path);
    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

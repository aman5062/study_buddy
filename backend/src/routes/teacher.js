const express = require('express');
const pool = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/students', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/students/:id', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1 AND role = 'student'", [req.params.id]);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

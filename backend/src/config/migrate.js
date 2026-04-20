const pool = require('./database');

async function ensureDatabaseSchema() {
  await pool.query(`
    ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS formulas JSONB,
      ADD COLUMN IF NOT EXISTS real_world_examples JSONB,
      ADD COLUMN IF NOT EXISTS common_mistakes JSONB
  `);
}

module.exports = { ensureDatabaseSchema };

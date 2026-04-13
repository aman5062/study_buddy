const { generateEmbedding } = require('./aiService');

function chunkText(text) {
  const chunkSize = 500;
  const overlap = 50;
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start += chunkSize - overlap;
  }
  
  return chunks;
}

async function storeEmbeddings(pool, documentId, chunks) {
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);
    const embeddingStr = '[' + embedding.join(',') + ']';
    await pool.query(
      'INSERT INTO document_chunks (document_id, chunk_text, chunk_index, embedding) VALUES ($1, $2, $3, $4::vector)',
      [documentId, chunks[i], i, embeddingStr]
    );
  }
}

async function retrieveRelevantChunks(pool, queryEmbedding, documentId, limit = 5) {
  const embeddingStr = '[' + queryEmbedding.join(',') + ']';
  let query, params;
  
  if (documentId) {
    query = `
      SELECT dc.chunk_text, dc.document_id, d.title,
             1 - (dc.embedding <=> $1::vector) AS similarity
      FROM document_chunks dc
      JOIN documents d ON d.id = dc.document_id
      WHERE dc.document_id = $2
      ORDER BY dc.embedding <=> $1::vector
      LIMIT $3
    `;
    params = [embeddingStr, documentId, limit];
  } else {
    query = `
      SELECT dc.chunk_text, dc.document_id, d.title,
             1 - (dc.embedding <=> $1::vector) AS similarity
      FROM document_chunks dc
      JOIN documents d ON d.id = dc.document_id
      ORDER BY dc.embedding <=> $1::vector
      LIMIT $2
    `;
    params = [embeddingStr, limit];
  }
  
  const result = await pool.query(query, params);
  return result.rows;
}

module.exports = { chunkText, storeEmbeddings, retrieveRelevantChunks };

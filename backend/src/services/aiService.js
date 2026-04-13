const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Maximum characters to send to the AI model to stay within token limits
const MAX_DOCUMENT_LENGTH = 30000;

async function processDocument(text) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const truncated = text.slice(0, MAX_DOCUMENT_LENGTH);
  
  const prompt = `Analyze the following educational document and return a JSON object with exactly these fields:
{
  "summary": "A comprehensive 3-5 paragraph summary of the document",
  "qa": [{"question": "...", "answer": "..."}, ...] (10-15 Q&A pairs),
  "flashcards": [{"term": "...", "definition": "..."}, ...] (10-15 flashcards),
  "mindmap": {
    "topic": "Main Topic",
    "subtopics": [
      {"topic": "Subtopic 1", "subtopics": [{"topic": "Detail", "subtopics": []}]},
      ...
    ]
  },
  "predictions": [{"topic": "...", "reason": "...", "priority": "high|medium|low"}, ...] (5-8 exam predictions)
}

Return ONLY valid JSON, no markdown, no explanation.

Document:
${truncated}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  // Strip markdown code blocks if present
  const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

async function generateRAGAnswer(query, context, history) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const historyText = history.slice(-6).map(h => `${h.role}: ${h.message}`).join('\n');
  
  const prompt = `You are a helpful study assistant. Use the provided context to answer the student's question accurately.

Context from documents:
${context}

${historyText ? `Conversation history:\n${historyText}\n` : ''}
Student question: ${query}

Provide a clear, educational answer based on the context. If the context doesn't contain enough information, say so.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { processDocument, generateEmbedding, generateRAGAnswer };

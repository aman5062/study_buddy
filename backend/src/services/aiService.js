const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const MAX_DOCUMENT_LENGTH = 50000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const EMPTY_RESULT = {
  summary: '',
  qa: [],
  flashcards: [],
  mindmap: { topic: 'Document', subtopics: [] },
  predictions: [],
};

function extractJSON(text) {
  // Remove markdown code fences
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (_) { /* fall through */ }

  // Try to find a JSON object in the text via brace matching
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    } catch (_) { /* fall through */ }
  }

  throw new Error('Could not extract valid JSON from AI response');
}

function validateAndFill(data) {
  const result = { ...EMPTY_RESULT };

  if (typeof data.summary === 'string' && data.summary.trim()) {
    result.summary = data.summary.trim();
  }

  if (Array.isArray(data.qa)) {
    result.qa = data.qa.filter(
      (item) => item && typeof item.question === 'string' && typeof item.answer === 'string'
    );
  }

  if (Array.isArray(data.flashcards)) {
    result.flashcards = data.flashcards.filter(
      (item) => item && typeof item.term === 'string' && typeof item.definition === 'string'
    );
  }

  if (data.mindmap && typeof data.mindmap.topic === 'string') {
    result.mindmap = data.mindmap;
  }

  if (Array.isArray(data.predictions)) {
    result.predictions = data.predictions.filter(
      (item) => item && typeof item.topic === 'string' && typeof item.reason === 'string'
    ).map((item) => ({
      topic: item.topic,
      reason: item.reason,
      priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
    }));
  }

  return result;
}

async function processDocument(text) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const truncated = text.slice(0, MAX_DOCUMENT_LENGTH);

  const prompt = `You are an expert educational content analyzer. Analyze the document below and return ONLY a valid JSON object (no markdown, no code fences, no extra text) with ALL of these fields fully populated:

{
  "summary": "A detailed 4-6 paragraph summary covering all major topics, key concepts, and important details from the document. Be comprehensive.",
  "qa": [
    {"question": "Specific question about the content?", "answer": "Detailed answer based on the document."},
    ... at least 12 question-answer pairs covering the breadth of the document
  ],
  "flashcards": [
    {"term": "Key Term or Concept", "definition": "Clear, concise definition or explanation."},
    ... at least 12 flashcards for key vocabulary, concepts, and facts
  ],
  "mindmap": {
    "topic": "Central Topic of the Document",
    "subtopics": [
      {
        "topic": "Main Section 1",
        "subtopics": [
          {"topic": "Key Detail A", "subtopics": []},
          {"topic": "Key Detail B", "subtopics": []}
        ]
      },
      {
        "topic": "Main Section 2",
        "subtopics": [
          {"topic": "Key Detail C", "subtopics": []}
        ]
      }
    ]
  },
  "predictions": [
    {"topic": "Likely Exam Topic", "reason": "Why this topic is likely to be tested.", "priority": "high"},
    ... at least 6 exam predictions with priority values of "high", "medium", or "low"
  ]
}

IMPORTANT: Every array must have real content from the document. Do not leave any field empty or use placeholder text. Return ONLY the JSON object.

Document:
${truncated}`;

  const MAX_RETRIES_LOCAL = MAX_RETRIES;
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES_LOCAL; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = extractJSON(responseText);
      return validateAndFill(parsed);
    } catch (err) {
      console.error(`processDocument attempt ${attempt} failed:`, err.message);
      lastError = err;
      if (attempt < MAX_RETRIES_LOCAL) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }
  }

  throw lastError;
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

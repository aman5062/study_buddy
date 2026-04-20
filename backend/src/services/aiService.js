const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
const MAX_DOCUMENT_LENGTH = Number.parseInt(process.env.AI_MAX_DOCUMENT_CHARS || '50000', 10);
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const EMPTY_RESULT = {
  summary: '',
  qa: [],
  flashcards: [],
  mindmap: { topic: 'Document', description: '', subtopics: [] },
  predictions: [],
  formulas: [],
  realWorldExamples: [],
  commonMistakes: [],
};

function stripCodeFences(text) {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
}

function extractJson(text) {
  const cleaned = stripCodeFences(text);

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Fall through and try to recover the first JSON object in the response.
  }

  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) {
    throw new Error('Could not extract valid JSON from AI response');
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = firstBrace; i < cleaned.length; i += 1) {
    const char = cleaned[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      if (inString) {
        escaped = true;
      }
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        const candidate = cleaned.slice(firstBrace, i + 1);
        return JSON.parse(candidate);
      }
    }
  }

  throw new Error('Could not extract valid JSON from AI response');
}

function asNonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function normalizeMindmapNode(node) {
  if (!node || typeof node !== 'object') {
    return null;
  }

  const topic = asNonEmptyString(node.topic);
  if (!topic) {
    return null;
  }

  const subtopics = Array.isArray(node.subtopics)
    ? node.subtopics.map(normalizeMindmapNode).filter(Boolean)
    : [];

  const normalized = { topic, subtopics };
  const description = asNonEmptyString(node.description);
  if (description) {
    normalized.description = description;
  }

  return normalized;
}

function normalizeResult(data) {
  const result = { ...EMPTY_RESULT };

  const summary = asNonEmptyString(data.summary);
  if (summary) {
    result.summary = summary;
  }

  if (Array.isArray(data.qa)) {
    result.qa = data.qa
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        question: asNonEmptyString(item.question),
        answer: asNonEmptyString(item.answer),
      }))
      .filter((item) => item.question && item.answer);
  }

  if (Array.isArray(data.flashcards)) {
    result.flashcards = data.flashcards
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        term: asNonEmptyString(item.term),
        definition: asNonEmptyString(item.definition),
        category: asNonEmptyString(item.category) || 'Theory',
      }))
      .filter((item) => item.term && item.definition);
  }

  const mindmap = normalizeMindmapNode(data.mindmap);
  if (mindmap) {
    result.mindmap = mindmap;
  }

  if (Array.isArray(data.predictions)) {
    result.predictions = data.predictions
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        topic: asNonEmptyString(item.topic),
        reason: asNonEmptyString(item.reason),
        priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
        chapter: asNonEmptyString(item.chapter),
      }))
      .filter((item) => item.topic && item.reason);
  }

  if (Array.isArray(data.formulas)) {
    result.formulas = data.formulas
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        name: asNonEmptyString(item.name),
        formula: asNonEmptyString(item.formula),
        description: asNonEmptyString(item.description),
        derivation: asNonEmptyString(item.derivation),
      }))
      .filter((item) => item.name && item.formula);
  }

  if (Array.isArray(data.realWorldExamples)) {
    result.realWorldExamples = data.realWorldExamples
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        title: asNonEmptyString(item.title),
        description: asNonEmptyString(item.description),
        relevantConcepts: Array.isArray(item.relevantConcepts)
          ? item.relevantConcepts.map(asNonEmptyString).filter(Boolean)
          : [],
      }))
      .filter((item) => item.title && item.description);
  }

  if (Array.isArray(data.commonMistakes)) {
    result.commonMistakes = data.commonMistakes
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        mistake: asNonEmptyString(item.mistake),
        correct: asNonEmptyString(item.correct),
        explanation: asNonEmptyString(item.explanation),
      }))
      .filter((item) => item.mistake && item.correct);
  }

  return result;
}

function buildDocumentPrompt(text) {
  return `You are an expert educational content analyzer. Analyze the document below and return ONLY a valid JSON object with this exact structure:

{
  "summary": "A detailed 5-7 paragraph summary covering the full document, major ideas, and important supporting details.",
  "qa": [
    { "question": "Specific question about the document?", "answer": "Detailed answer grounded in the document." }
  ],
  "flashcards": [
    { "term": "Key term or concept", "definition": "Clear definition or explanation.", "category": "Theory|Formula|Practical|Example" }
  ],
  "mindmap": {
    "topic": "Central topic of the document",
    "description": "Short overview of the whole document",
    "subtopics": [
      {
        "topic": "Main section",
        "description": "Key idea from this branch",
        "subtopics": [
          { "topic": "Nested concept", "description": "Short detail", "subtopics": [] }
        ]
      }
    ]
  },
  "predictions": [
    { "topic": "Likely exam topic", "reason": "Why it matters for exams", "priority": "high|medium|low", "chapter": "Optional chapter reference" }
  ],
  "formulas": [
    { "name": "Formula name", "formula": "Mathematical expression or symbolic form", "description": "When and why it is used", "derivation": "Brief derivation or intuition" }
  ],
  "realWorldExamples": [
    { "title": "Application name", "description": "How the concept is used in practice", "relevantConcepts": ["concept 1", "concept 2"] }
  ],
  "commonMistakes": [
    { "mistake": "Common student error", "correct": "Correct approach", "explanation": "Why the mistake happens and how to avoid it" }
  ]
}

Rules:
- Use only valid JSON.
- Do not wrap the response in markdown or code fences.
- Fill every array with substantial content.
- Prefer breadth and depth: aim for at least 12 Q&A items, 16 flashcards, 10 formulas, 8 real-world examples, 6 common mistakes, and 8 exam predictions when the source material supports it.
- Stay faithful to the document, but you may add general educational context that helps a student learn the topic better.

Document Content:
${text.slice(0, MAX_DOCUMENT_LENGTH)}`;
}

function buildChatPrompt(query, context, history) {
  const historyText = history
    .slice(-6)
    .map((item) => `${item.role}: ${item.message}`)
    .join('\n');

  return `You are an expert engineering professor and study buddy. Help students understand concepts clearly.

Context from documents:
${context}

${historyText ? `Conversation history:\n${historyText}\n` : ''}
Student question: ${query}

Return your answer in this exact structure and keep it concise:

## Key Points
- 3 to 5 bullet points with the most important ideas.

## Explanation
- 1 short paragraph or 3 to 4 bullets explaining the concept simply.

## Example
- 1 practical example from engineering or daily life.

## Formula or Rule
- Include a formula, rule, or simple relation if relevant. If not relevant, write "Not needed for this topic."

## Common Mistakes
- 2 to 3 bullets with mistakes students usually make.

## One-Line Summary
- 1 sentence that captures the whole answer.

Rules:
- Do not write a long essay.
- Do not use markdown tables.
- Use plain bullet lists and short headings only.
- If the question is specifically "summarize" or "summarize the key points", make the response even shorter and prioritize the Key Points section.
- If the context does not have enough information, say so in one sentence and then continue with general knowledge.`;
}

async function withRetries(taskName, executor) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await executor();
    } catch (err) {
      lastError = err;
      console.error(`${taskName} attempt ${attempt} failed:`, err.message);
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }

  throw lastError;
}

async function processDocument(text) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const prompt = buildDocumentPrompt(text);

  return withRetries('processDocument', async () => {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = extractJson(responseText);
    return normalizeResult(parsed);
  });
}

async function generateEmbedding(text) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values.slice(0, 768);
}

async function generateRAGAnswer(query, context, history) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const prompt = buildChatPrompt(query, context, history);
  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { processDocument, generateEmbedding, generateRAGAnswer };

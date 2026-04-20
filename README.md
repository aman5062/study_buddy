# Study Buddy

Study Buddy is an AI-powered learning platform that turns uploaded PDF documents into study material for teachers and students.

It supports:
- AI-generated summaries
- Question and answer sets
- Flashcards
- Mind maps
- Exam predictions
- Formulas, real-world examples, and common mistakes
- Document-aware chat using RAG

## Tech Stack

- Frontend: React 18, Vite, React Router, Axios, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL, pgvector
- AI: Google Gemini
- File handling: Multer and PDF parsing
- Auth: JWT

## Project Structure

- `backend/` - Express API, authentication, document processing, and chat
- `frontend/` - React app for teacher and student dashboards
- `db/` - PostgreSQL schema and seed data
- `docker-compose.yml` - Local container setup

## Features

### Teacher
- Log in and manage a teacher dashboard
- Add and remove students
- Upload PDF documents
- Let the backend generate study content automatically
- View upload status as `processing`, `ready`, or `failed`

### Student
- Log in and browse ready documents
- Open a document study page
- Read structured AI-generated study material
- Ask document-specific questions in the chatbot

### Document Study View
- Summary
- Q&A
- Flashcards
- Mind map
- Formulas
- Real-world examples
- Common mistakes
- Exam prep suggestions

## Local Setup

### 1. Install dependencies

Install backend and frontend packages separately:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

Create or update these files:

- `/.env`
- `/frontend/.env`

### 3. Start the database

Use Docker Compose for PostgreSQL and the app services:

```bash
docker compose up --build
```

Or run services separately if you already have PostgreSQL running.

### 4. Start the backend

```bash
cd backend
npm run dev
```

The API runs on port `5000` by default.

### 5. Start the frontend

```bash
cd frontend
npm run dev
```

The Vite dev server usually runs on port `3000`.

## Environment Variables

### Root `.env`

- `GEMINI_API_KEY` - required for AI generation
- `GEMINI_MODEL` - optional Gemini generation model, default `gemini-2.5-pro`
- `GEMINI_EMBEDDING_MODEL` - optional embedding model, default `gemini-embedding-001`
- `TRUST_PROXY` - proxy trust setting for Docker or reverse proxy deployments, default `1`
- `JWT_SECRET` - secret used to sign auth tokens

### Frontend `.env`

- `VITE_API_URL` - backend base URL, for example `http://localhost:5000`

## Default Demo Login

The database seed creates a demo teacher account:

- Email: `teacher@demo.com`
- Password: `teacher123`

Teachers can create student accounts from the dashboard.

## Backend API Overview

Auth:
- `POST /api/auth/login`
- `POST /api/auth/register-student`
- `GET /api/auth/me`

Teacher:
- `GET /api/teacher/students`
- `DELETE /api/teacher/students/:id`

Student:
- `GET /api/student/profile`

Documents:
- `POST /api/documents/upload`
- `GET /api/documents`
- `GET /api/documents/:id`
- `DELETE /api/documents/:id`

Chat:
- `POST /api/chat`
- `GET /api/chat/history`

Health:
- `GET /api/health`

## Data Flow

1. A teacher uploads a PDF.
2. The backend stores the file and marks the document as `processing`.
3. The PDF text is extracted and sent to Gemini for structured study content.
4. The backend stores summary, Q&A, flashcards, mind map, predictions, formulas, examples, and mistakes in PostgreSQL.
5. The text is chunked and embedded for retrieval.
6. Students open the document page and can study the generated content or ask the chatbot questions.

## Notes

- The app uses `pgvector` for semantic retrieval in chat.
- `trust proxy` is enabled by default in Docker to avoid rate-limit warnings behind reverse proxies.
- If Gemini returns extra text around a JSON response, the backend now extracts the first valid JSON object.

## Troubleshooting

- If uploads fail, confirm the backend has a valid `GEMINI_API_KEY`.
- If chat fails, make sure the document has been processed and the database contains chunks.
- If frontend requests fail, check that `VITE_API_URL` points to the backend.
- If PostgreSQL does not start, confirm the `pgvector/pgvector:pg16` image is available.

## Testing

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm run build
```

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SDG project management app built for a hackathon. Faculty create projects from a problem statement, a fine-tuned BERT model maps the statement to UN SDGs, and faculty assign student teams who then work in a per-project workspace (task board, team chat, literature Q&A).

- `backend/`: FastAPI + MongoDB (Beanie ODM), PyTorch/Transformers, Groq LLM
- `frontend/`: React 18 + Vite, Tailwind CSS v4, shadcn/ui (JSX, `radix-nova` style)

## Commands

Backend (run from `backend/`, the import root is `backend/` itself, e.g. `from app.core.config import settings`):
```bash
pip install -r requirements.txt
uvicorn main:app --reload          # http://127.0.0.1:8000, OpenAPI docs at /docs
```
Requires MongoDB at `MONGODB_URL` (default `mongodb://localhost:27017/sdg_project_db`). Settings load from `backend/.env` (`MONGODB_URL`, `SECRET_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`).

Frontend (run from `frontend/`):
```bash
npm install
npm run dev       # http://localhost:5173
npm run build
```
`npm run lint` is defined but the repo has no ESLint config, so it fails until one is added.

Docker: `backend/Dockerfile` (CPU-only torch, uvicorn on 8000) and `frontend/Dockerfile` (Vite build served by nginx on 80, SPA fallback in `nginx.conf`). There is no compose file; MongoDB must be provided separately.

There is no test suite in either project.

## Architecture

### Backend
- `main.py` creates the app, runs `init_db()` in the lifespan hook, sets CORS from `settings.CORS_ORIGINS`, and mounts routers: `/auth`, `/projects`, `/ml`, `/rag`. A new frontend origin/port must be added to `CORS_ORIGINS` in `app/core/config.py`.
- Models (`app/models/`) are Beanie `Document`s registered in `app/core/database.py`; a new Document must be added to the `document_models` list there. The DB name is hard-coded as `sdg_project_db` in `init_db`, independent of the URL.
- `Project` is the aggregate root: team (leader + members as `Link[User]`), tasks (with attachments), and chat messages are all **embedded** in the project document. `LiteratureDocument` is a separate collection keyed by `project_id` string, with its text chunks stored inline.
- Auth: JWT bearer tokens (`app/core/security.py`, argon2 hashing). `get_current_user` in `app/routes/auth.py` is the dependency every protected route uses. Roles are `FACULTY` and `STUDENT` (`UserRole`).
- Access control is per-route: `_is_project_participant` (faculty owner, team leader, or member) is duplicated in `routes/projects.py` and `routes/rag.py`, along with `_get_link_id`, which normalizes Beanie `Link` objects vs raw dicts. Keep both copies in sync when changing them.
- `routes/projects.py` returns "view" schemas (`ProjectView`, `ProjectWorkspaceView`, etc., in `app/schemas.py`) that resolve linked users into names; `/my-projects-view` is what the faculty dashboard uses.
- ML (`routes/ml.py`): the model lives at `backend/app/ml_model/` (gitignored; download link in README). It is lazy-loaded on first `/ml/analyze` call; if loading fails, the error is cached and the endpoint returns 503 without retrying until restart. Sigmoid multi-label output: `>= 0.3` is "applied", `>= 0.7` is "most suitable" (falls back to top 2). If `GROQ_API_KEY` is set, Groq is then asked for numbered UN targets per SDG (only those with confidence `>= 0.8` kept). `/ml/analyze` is unauthenticated (the landing page calls it).
- RAG (`routes/rag.py`): uploads (PDF/TXT/MD, 15 MB max) are chunked (600 chars, 120 overlap) and retrieved by simple token-overlap scoring, no embeddings, then answered by Groq. Files are stored under `backend/uploads/` (gitignored), as are task attachments.

### Frontend
- Routing in `src/App.jsx`: `/`, `/login`, `/register` are public and forced to light theme; `/dashboard`, `/project/new`, `/project/:projectId/workspace` sit under `PrivateRoute` + `AppShell` (sidebar layout). `Dashboard.jsx` switches between `FacultyDashboard` and `StudentDashboard` by role.
- Auth state lives in `src/context/AuthContext.jsx`; the JWT is in `localStorage['token']`. `src/api/client.js` `fetchClient` adds the bearer header and redirects to `/login` on 401.
- The API base URL `http://localhost:8000` is hard-coded in several places (`api/client.js`, `api/projects.js`, `AuthContext.jsx`, `Register.jsx`), not read from env. Change all of them together.
- `@/` aliases `src/`. shadcn components are in `src/components/ui/` (add more via the shadcn CLI/MCP, `components.json`). Shared visual primitives (`GoalTile`, `StatusPill`, `PersonDisc`, brand marks) are in `src/components/marks.jsx`; SDG metadata (official colours, names, target counts, label parsing) is in `src/lib/sdg.js`.
- Design tokens are in `src/index.css` (app light/dark tokens and a separate landing palette). Theme is handled by `next-themes` with storage key `theme`.

### Frontend design rules
Follow these when touching UI:
- App screens are achromatic: colour only on data (official SDG colours, one progress blue `#1d5fbf`, pale status pills). Primary action is olive-black.
- One typeface (Geist Variable via `@fontsource-variable/geist`), tabular figures on numbers.
- No gradients, glass/backdrop blur, glows, resting shadows, emoji, eyebrow labels, or violet. Radius 8px on cards, 6px on controls; square on the landing page.
- Every animation needs a reduced-motion fallback (`MotionConfig reducedMotion="user"` is set globally in `App.jsx`).
- Use `sonner` toasts for errors/feedback, not `alert()`.

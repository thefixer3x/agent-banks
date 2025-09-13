# Repository Guidelines

## Project Structure & Module Organization
- Frontend: `src/` (React + TS). Pages in `src/pages`, components in `src/components`, hooks in `src/hooks`, services in `src/services`, assets in `public/`.
- Servers: Memory service (`enhanced-memory-server.js`, `simple-server.js`), API gateway (`api-gateway-server.js`).
- MCP Server: `mcp-server/` (standalone Node service for MCP/Claude).
- Deployment & Ops: `deployment/`, shell scripts `*.sh`, environment files `.env*`.
- Tests: Node scripts `test-*.js`, Python `test_*.py`.

Example:
```
src/
  pages/ SettingsPage.tsx  hooks/ useAIChat.ts  services/ aiModels.ts
mcp-server/ index.js      supabase/            public/
```

## Build, Test, and Development Commands
- Frontend dev: `npm run dev` (serves on `http://localhost:8080`).
- Frontend build/preview: `npm run build` then `npm run preview`.
- Memory server (enhanced): `node enhanced-memory-server.js` (port `3000`).
- API gateway: `node api-gateway-server.js` (port `3001`).
- MCP server: `npm --prefix mcp-server start` (or `npm --prefix mcp-server run hostinger`).
- Tests (Node): `node test-smart-memory-server.js`, `node test-auth.js`, `node test-admin-login.js`.
- Tests (Python): `python3 test_agent_banks.py`.

## Coding Style & Naming Conventions
- TypeScript/React: 2‑space indent, functional components, hooks prefixed `use*` (e.g., `useMemoryRealtime.ts`).
- Filenames: components/pages `PascalCase.tsx` (e.g., `SettingsPage.tsx`), utilities/services `camelCase.ts` (e.g., `vpsApiService.ts`).
- Linting: `eslint` via `eslint.config.js` (`npm run lint`). Keep imports path‑aliased with `@/…`.
- Node services: modern JS (ES modules where configured), 2‑space indent.
- Python: PEP8, snake_case, 4‑space indent.

## Testing Guidelines
- Framework: repository uses script‑based checks (no Jest/mocha harness). Keep tests in top level as `test-*.js` or `test_*.py`.
- Coverage: add focused tests for new endpoints and critical hooks. Prefer small, fast scripts over broad E2E.
- Run examples:
  - Memory E2E: `node test-smart-memory-server.js`
  - Hybrid integration: `node test-hybrid-integration.js`

## Commit & Pull Request Guidelines
- Commits: present‑tense, concise scopes; emoji and Conventional‑Commit style allowed (e.g., `🔧 fix(server): adjust SSH port`).
- PRs: clear description, scope of change, linked issues, manual test notes; include screenshots for UI changes.
- Pre‑PR: run `npm run lint`, build frontend, and execute relevant test scripts.

## Security & Configuration Tips
- Do not commit secrets. Use `.env.production`/`.env.test` and the provided `.env.production.example`.
- Required keys for services: `SUPABASE_URL`, `SUPABASE_*_KEY`, `OPENAI_API_KEY` (vector search), optional `ANTHROPIC_API_KEY`.

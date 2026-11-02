# Agent development guidelines — GSC Ledger

This repository contains **public source code**, not production financial data. Its backend is a Cloudflare Worker and D1; the frontend is stored under `app_assets.name = 'index'` in D1 and served by the Worker.

Do not deploy, import SQL, reset data, manipulate secrets, or change production Cloudflare bindings without explicit authorization.

## Priorities

1. Preserve workspace isolation and roles (owner, controller, editor, viewer).
2. Keep accounting accurate: deposits and opening balances increase funds; withdrawals and linked paid expenses decrease funds; internal transfers must net to zero; never double-post an expense.
3. Maintain secure authentication, CSRF/origin checks, and audit history.
4. Preserve responsive mobile-first UX, both French and English, and accessibility.
5. Use small reviewable commits; test locally and in a **separate staging D1 database** before any deployment.

## Architecture

- `src/worker.mjs`: API and PDF generation.
- `web/index.html`: current inline CSS/JS frontend, stored as a D1 asset.
- `database/schema.sql`: structural schema only.
- `scripts/seed-assets.mjs`: inserts PUBLIC frontend and image assets into an empty D1 install.
- `generated/`: private/generated local files, ignored by Git.

Recommended next refactor: gradually separate the inline frontend code into modular files with a safe build/seed process, add automated role/accounting tests, and verify output matches the existing UI before deploying.

Never commit production database exports, JWTs/tokens, setup keys, passwords, user identifiers, or financial records.

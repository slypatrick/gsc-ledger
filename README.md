# GSC Ledger

GSC Ledger is a bilingual (English/French), mobile-first shared expense and treasury application built on Cloudflare Workers and D1.

## Features

- Private workspaces with owner, controller, editor, and viewer roles
- Expense submission, approval, payment status, and audit trail
- Treasury accounts, deposits, withdrawals, transfers, and linked expense payments
- Requests, scheduled commitments, and reports with PDF export
- Responsive interface, installable PWA icon, and guided onboarding

## Architecture

The original deployment stores the current frontend in D1's `app_assets` table (`name='index'`) and serves it through the Worker. This repository preserves that architecture to reproduce the app without moving private production records into Git.

- `src/worker.mjs` – Worker backend and PDF generator
- `web/index.html` – current public frontend, including styling and client JavaScript
- `assets/` – public application icons and manifest
- `database/schema.sql` – empty database schema, indexes and triggers; **no production records**
- `scripts/seed-assets.mjs` – generates an SQL script to load public frontend and icons into a fresh D1 database
- `wrangler.jsonc` – deploy configuration template

## Set up a fresh installation

1. Install Node.js, then run `npm install`.
2. Authenticate Wrangler with the Cloudflare account where you want to deploy.
3. Create a **new empty** D1 database using `npx wrangler d1 create gsc-ledger-db`.
4. Set `d1_databases[0].database_id` in `wrangler.jsonc` to the **new** database UUID; retain binding name `DB`.
5. Create the tables using `npx wrangler d1 execute gsc-ledger-db --remote --file=database/schema.sql`.
6. Generate public assets SQL with `npm run seed:assets`, then import using `npx wrangler d1 execute gsc-ledger-db --remote --file=generated/seed-assets.sql`.
7. Deploy using `npm run deploy`.
8. Follow the application's first-account setup flow to initialize an empty installation.

**Do not point this configuration at your production D1 database.** For an account-to-account migration of actual users and financial records, use an encrypted, private D1 export/import workflow instead of committing records to GitHub.

## Security & data

**Public source code is not a production backup.** The repository intentionally excludes financial transactions, user accounts, password hashes, sessions, invitations, secrets, and setup credentials. Never commit D1 exports or `.env`/`.dev.vars` files. Treat the production D1 database as the source of truth until a separate, verified migration and cutover.

## Development

This repository is an exported snapshot of an existing Cloudflare deployment and may need a development/staging configuration before changes are deployed. Keep work on a separate branch, review diffs, test role-based permissions and accounting invariants, and avoid modifying production directly.

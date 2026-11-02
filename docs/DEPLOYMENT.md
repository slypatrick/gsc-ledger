# Deploy GSC Ledger to a separate Cloudflare account

This document describes creating a **fresh, empty** GSC Ledger installation. It does **not** migrate private production accounts or financial data.

## Prerequisites

- Node.js and npm
- Access to a destination Cloudflare account
- A local clone of this repository
- Wrangler authentication for the **destination** account

## Deploy a new installation

1. Install tooling:

   ```sh
   npm install
   npm run check
   npx wrangler whoami
   ```

2. Create a new destination database:

   ```sh
   npx wrangler d1 create gsc-ledger-db
   ```

3. Replace `REPLACE_WITH_NEW_D1_DATABASE_UUID` in `wrangler.jsonc` with the new UUID from step 2. Keep the binding name `DB`. For deploying another account, ensure you are authenticated to the **correct account** and never reuse a production database ID.

4. Apply the empty schema, then add public assets:

   ```sh
   npx wrangler d1 execute gsc-ledger-db --remote --file=database/schema.sql
   npm run seed:assets
   npx wrangler d1 execute gsc-ledger-db --remote --file=generated/seed-assets.sql
   ```

5. Generate a **new** initial setup key and insert it into the new D1 database:

   ```sh
   npm run setup:key
   npx wrangler d1 execute gsc-ledger-db --remote --file=generated/setup.sql
   ```

   Keep the printed setup key private. You will need it to register the very first account. The `generated/` directory is deliberately gitignored. Do not put the key into repository files, issues, public logs or screenshots.

6. Deploy:

   ```sh
   npm run deploy
   ```

7. Verify the destination URL, create the first account using the setup key, and test workspaces, role access, treasury, expense approval, reports, French/English, and mobile.

## Migrating the **existing** production data

The public repository **does not include** user accounts, password hashes, sessions, invitations, treasury funds or expense records. They reside in the original private D1 database.

A separate, encrypted export/import of the **entire** source D1 database is needed for a faithful account-to-account migration. During final cutover, pause writes to the source, create a verified backup, import it into a clean destination database, compare all table counts and treasury balances, then move traffic. Do **not** import the empty schema or public asset seed into an already-restored production D1 database. Keep the source read-only until rollback is no longer required.

Note that `workers.dev` URLs depend on the destination Cloudflare account. Existing session cookies may not carry over; users should sign in again on the new hostname. Treat DNS changes, custom domain attachments, and production data synchronization as a separate, explicitly authorized operation.

## Security notes

- Keep the source Worker live until the destination passes validation.
- Do not deploy directly to the original production account using this repository's template.
- The source app stores public frontend assets in D1's `app_assets` table; editing `web/index.html` in Git alone does not update deployed frontend until regenerated assets are imported.
- Audit and test all authorization and financial state transitions before enabling production writes.

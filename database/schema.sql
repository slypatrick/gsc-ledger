-- GSC Ledger: public database schema only. No users, transactions, credentials or other production data.
-- Generated from the live Cloudflare D1 sqlite_master structure.
-- Do not deploy directly against the existing production D1 database.

CREATE TABLE app_assets(name TEXT PRIMARY KEY, content TEXT NOT NULL);

CREATE TABLE app_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);

CREATE TABLE audit (id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id), actor_id TEXT REFERENCES users(id), action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE commitments (id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id), title TEXT NOT NULL, beneficiary TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'Support', amount_cents INTEGER NOT NULL CHECK(amount_cents>0), frequency TEXT NOT NULL CHECK(frequency IN ('weekly','monthly','quarterly','once')), next_due TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, notes TEXT NOT NULL DEFAULT '', created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE expenses (id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id), title TEXT NOT NULL, beneficiary TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'Other', amount_cents INTEGER NOT NULL CHECK(amount_cents>0), currency TEXT NOT NULL DEFAULT 'TND', expense_date TEXT NOT NULL, method TEXT NOT NULL DEFAULT 'Cash', status TEXT NOT NULL CHECK(status IN ('draft','pending','approved','paid','rejected')), reference TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', receipt_url TEXT NOT NULL DEFAULT '', created_by TEXT NOT NULL REFERENCES users(id), approved_by TEXT REFERENCES users(id), approved_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE groups (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', icon TEXT NOT NULL DEFAULT 'heart', color TEXT NOT NULL DEFAULT '#164b3d', visibility TEXT NOT NULL DEFAULT 'private', currency TEXT NOT NULL DEFAULT 'TND', created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE invitations (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, group_id TEXT NOT NULL REFERENCES groups(id), email TEXT NOT NULL COLLATE NOCASE, role TEXT NOT NULL, invited_by TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL, accepted_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE login_attempts (email TEXT PRIMARY KEY, failures INTEGER NOT NULL DEFAULT 0, locked_until TEXT);

CREATE TABLE memberships (group_id TEXT NOT NULL REFERENCES groups(id), user_id TEXT NOT NULL REFERENCES users(id), role TEXT NOT NULL CHECK(role IN ('owner','controller','editor','viewer')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(group_id,user_id));

CREATE TABLE requests (id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id), title TEXT NOT NULL, beneficiary TEXT NOT NULL DEFAULT '', amount_cents INTEGER NOT NULL DEFAULT 0, priority TEXT NOT NULL DEFAULT 'normal', status TEXT NOT NULL DEFAULT 'waiting', notes TEXT NOT NULL DEFAULT '', due_date TEXT, created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE treasury_accounts(
 id TEXT PRIMARY KEY,group_id TEXT NOT NULL REFERENCES groups(id),
 name TEXT NOT NULL,type TEXT NOT NULL CHECK(type IN('cash','bank','wallet','other')),
 active INTEGER NOT NULL DEFAULT 1, created_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(group_id,name)
);

CREATE TABLE treasury_entries(
 id TEXT PRIMARY KEY,group_id TEXT NOT NULL REFERENCES groups(id),
 account_id TEXT NOT NULL REFERENCES treasury_accounts(id),
 kind TEXT NOT NULL CHECK(kind IN('opening','deposit','withdrawal','transfer_in','transfer_out','expense')),
 delta_cents INTEGER NOT NULL CHECK(delta_cents!=0),
 entry_date TEXT NOT NULL,title TEXT NOT NULL,
 counterparty TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',
 linked_expense_id TEXT REFERENCES expenses(id),
 transfer_id TEXT, operation_id TEXT NOT NULL,
 created_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(operation_id,kind),
 UNIQUE(linked_expense_id)
);

CREATE TABLE user_preferences(user_id TEXT PRIMARY KEY REFERENCES users(id),onboarding_version INTEGER NOT NULL DEFAULT 0,completed_at TEXT);

CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE INDEX ix_audit_group ON audit(group_id,created_at DESC);

CREATE INDEX ix_commitments_group ON commitments(group_id,next_due);

CREATE INDEX ix_expense_group_date ON expenses(group_id,expense_date DESC);

CREATE INDEX ix_members_user ON memberships(user_id);

CREATE INDEX ix_requests_group ON requests(group_id,status);

CREATE INDEX ix_treasury_accounts_group ON treasury_accounts(group_id);

CREATE INDEX ix_treasury_entries_account ON treasury_entries(account_id,entry_date DESC);

CREATE INDEX ix_treasury_entries_group ON treasury_entries(group_id,entry_date DESC);

CREATE TRIGGER treasury_account_guard
 BEFORE INSERT ON treasury_entries BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM treasury_accounts a WHERE a.id=NEW.account_id AND a.group_id=NEW.group_id AND a.active=1)
 THEN RAISE(ABORT,'Treasury account unavailable') END;
 END;

CREATE TRIGGER treasury_nonnegative_before_insert
 BEFORE INSERT ON treasury_entries WHEN NEW.delta_cents < 0
 BEGIN SELECT CASE WHEN (SELECT COALESCE(SUM(delta_cents),0) FROM treasury_entries WHERE account_id=NEW.account_id)+NEW.delta_cents<0
 THEN RAISE(ABORT,'Insufficient treasury balance') END; END;

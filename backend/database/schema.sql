CREATE TABLE IF NOT EXISTS accounts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL CHECK(type IN ('bank', 'credit_card')),
    institution TEXT NOT NULL,
    template_id TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    color      TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id       INTEGER NOT NULL REFERENCES accounts(id),
    date             TEXT NOT NULL,
    description      TEXT NOT NULL,
    amount           REAL NOT NULL,
    category_id      INTEGER REFERENCES categories(id),
    statement_period TEXT,
    source_file      TEXT,
    is_pending       INTEGER NOT NULL DEFAULT 0,
    raw_text         TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_pending ON transactions(is_pending);
CREATE INDEX IF NOT EXISTS idx_transactions_period ON transactions(statement_period);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_dedup
    ON transactions(account_id, date, description, amount)
    WHERE is_pending = 0;

CREATE TABLE IF NOT EXISTS category_keywords (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    keyword     TEXT NOT NULL,
    UNIQUE(category_id, keyword)
);

CREATE TABLE IF NOT EXISTS uploaded_statements (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    filename         TEXT NOT NULL,
    account_id       INTEGER REFERENCES accounts(id),
    statement_period TEXT,
    file_hash        TEXT NOT NULL,
    uploaded_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(file_hash)
);

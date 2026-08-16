CREATE TABLE IF NOT EXISTS accounts (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL CHECK(type IN ('bank', 'credit_card')),
    institution TEXT NOT NULL,
    template_id TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS categories (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    color      TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id               SERIAL PRIMARY KEY,
    account_id       INTEGER NOT NULL REFERENCES accounts(id),
    date             DATE NOT NULL,
    description      TEXT NOT NULL,
    amount           NUMERIC(12, 2) NOT NULL,
    category_id      INTEGER REFERENCES categories(id),
    statement_period TEXT,
    source_file      TEXT,
    is_pending       BOOLEAN NOT NULL DEFAULT FALSE,
    raw_text         TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_account  ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date     ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_pending  ON transactions(is_pending);
CREATE INDEX IF NOT EXISTS idx_transactions_period   ON transactions(statement_period);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_dedup
    ON transactions(account_id, date, description, amount)
    WHERE is_pending = FALSE;

CREATE TABLE IF NOT EXISTS category_keywords (
    id          SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    keyword     TEXT NOT NULL,
    UNIQUE(category_id, keyword)
);

CREATE TABLE IF NOT EXISTS uploaded_statements (
    id               SERIAL PRIMARY KEY,
    filename         TEXT NOT NULL,
    account_id       INTEGER REFERENCES accounts(id),
    statement_period TEXT,
    file_hash        TEXT NOT NULL,
    uploaded_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(file_hash)
);

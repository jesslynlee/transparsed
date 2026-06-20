import hashlib

from database.connection import get_db


def insert_pending_batch(transactions, account_id, statement_period, source_file):
    db = get_db()
    inserted = 0
    for txn in transactions:
        category_id = _resolve_category_id(db, txn.category) if txn.category else None
        db.execute(
            """INSERT INTO transactions
               (account_id, date, description, amount, category_id,
                statement_period, source_file, is_pending, raw_text)
               VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)""",
            (
                account_id,
                txn.date,
                txn.description,
                txn.amount,
                category_id,
                statement_period,
                source_file,
                txn.raw_text,
            ),
        )
        inserted += 1
    db.commit()
    return inserted


def get_pending():
    db = get_db()
    rows = db.execute(
        """SELECT t.*, c.name as category_name, a.name as account_name
           FROM transactions t
           LEFT JOIN categories c ON t.category_id = c.id
           LEFT JOIN accounts a ON t.account_id = a.id
           WHERE t.is_pending = 1
           ORDER BY t.date DESC"""
    ).fetchall()
    return [dict(row) for row in rows]


def get_by_id(transaction_id):
    db = get_db()
    row = db.execute(
        """SELECT t.*, c.name as category_name, a.name as account_name
           FROM transactions t
           LEFT JOIN categories c ON t.category_id = c.id
           LEFT JOIN accounts a ON t.account_id = a.id
           WHERE t.id = ?""",
        (transaction_id,),
    ).fetchone()
    return dict(row) if row else None


def record_upload(filename, account_id, statement_period, file_hash):
    db = get_db()
    db.execute(
        """INSERT INTO uploaded_statements
           (filename, account_id, statement_period, file_hash)
           VALUES (?, ?, ?, ?)""",
        (filename, account_id, statement_period, file_hash),
    )
    db.commit()


def check_duplicate_file(file_hash):
    db = get_db()
    row = db.execute(
        "SELECT id FROM uploaded_statements WHERE file_hash = ?",
        (file_hash,),
    ).fetchone()
    return row is not None


def compute_file_hash(file_path):
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def _resolve_category_id(db, category_name):
    row = db.execute(
        "SELECT id FROM categories WHERE name = ?", (category_name,)
    ).fetchone()
    return row["id"] if row else None

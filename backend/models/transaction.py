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


def get_all(is_pending=None, account_id=None, category_id=None,
            start_date=None, end_date=None, search=None):
    db = get_db()
    query = """SELECT t.*, c.name as category_name, a.name as account_name
               FROM transactions t
               LEFT JOIN categories c ON t.category_id = c.id
               LEFT JOIN accounts a ON t.account_id = a.id
               WHERE 1=1"""
    params = []

    if is_pending is not None:
        query += " AND t.is_pending = ?"
        params.append(int(is_pending))
    if account_id:
        query += " AND t.account_id = ?"
        params.append(account_id)
    if category_id:
        query += " AND t.category_id = ?"
        params.append(category_id)
    if start_date:
        query += " AND t.date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND t.date <= ?"
        params.append(end_date)
    if search:
        query += " AND t.description LIKE ?"
        params.append(f"%{search}%")

    query += " ORDER BY t.date DESC"
    rows = db.execute(query, params).fetchall()
    return [dict(row) for row in rows]


def get_pending():
    return get_all(is_pending=1)


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


def create(account_id, date, description, amount, category_id=None,
           statement_period=None, is_pending=0):
    db = get_db()
    db.execute(
        """INSERT INTO transactions
           (account_id, date, description, amount, category_id,
            statement_period, is_pending)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (account_id, date, description, amount, category_id,
         statement_period, is_pending),
    )
    db.commit()
    return get_by_id(db.execute("SELECT last_insert_rowid()").fetchone()[0])


def update(transaction_id, **fields):
    db = get_db()
    allowed = {"date", "description", "amount", "category_id", "account_id"}
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return get_by_id(transaction_id)

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    params = list(updates.values())
    params.append(transaction_id)

    db.execute(
        f"UPDATE transactions SET {set_clause}, updated_at = datetime('now') WHERE id = ?",
        params,
    )
    db.commit()
    return get_by_id(transaction_id)


def delete(transaction_id):
    db = get_db()
    db.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
    db.commit()


def commit(transaction_ids):
    if not transaction_ids:
        return 0
    db = get_db()
    placeholders = ",".join("?" for _ in transaction_ids)
    cursor = db.execute(
        f"UPDATE transactions SET is_pending = 0, updated_at = datetime('now') "
        f"WHERE id IN ({placeholders}) AND is_pending = 1",
        transaction_ids,
    )
    db.commit()
    return cursor.rowcount


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


def get_uploads():
    db = get_db()
    rows = db.execute(
        """SELECT s.id, s.filename, s.statement_period, s.uploaded_at,
                  a.name as account_name
           FROM uploaded_statements s
           LEFT JOIN accounts a ON s.account_id = a.id
           ORDER BY s.uploaded_at DESC""",
    ).fetchall()
    return [dict(row) for row in rows]


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

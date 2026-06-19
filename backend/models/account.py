from database.connection import get_db


def get_all():
    db = get_db()
    rows = db.execute("SELECT * FROM accounts ORDER BY name").fetchall()
    return [dict(row) for row in rows]


def get_by_id(account_id):
    db = get_db()
    row = db.execute("SELECT * FROM accounts WHERE id = ?", (account_id,)).fetchone()
    return dict(row) if row else None


def create(name, account_type, institution, template_id):
    db = get_db()
    db.execute(
        "INSERT INTO accounts (name, type, institution, template_id) VALUES (?, ?, ?, ?)",
        (name, account_type, institution, template_id),
    )
    db.commit()
    return dict(
        db.execute("SELECT * FROM accounts WHERE id = last_insert_rowid()").fetchone()
    )


def update(account_id, name=None, account_type=None, institution=None, template_id=None):
    db = get_db()
    acct = db.execute("SELECT * FROM accounts WHERE id = ?", (account_id,)).fetchone()
    if not acct:
        return None
    db.execute(
        "UPDATE accounts SET name = ?, type = ?, institution = ?, template_id = ? WHERE id = ?",
        (
            name or acct["name"],
            account_type or acct["type"],
            institution or acct["institution"],
            template_id or acct["template_id"],
            account_id,
        ),
    )
    db.commit()
    return dict(db.execute("SELECT * FROM accounts WHERE id = ?", (account_id,)).fetchone())


def delete(account_id):
    db = get_db()
    db.execute("DELETE FROM accounts WHERE id = ?", (account_id,))
    db.commit()

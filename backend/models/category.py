from database.connection import get_db

DEFAULT_CATEGORIES = [
    ("Groceries", "#4CAF50"),
    ("Dining", "#FF5722"),
    ("Transportation", "#2196F3"),
    ("Utilities", "#607D8B"),
    ("Entertainment", "#9C27B0"),
    ("Shopping", "#FF9800"),
    ("Healthcare", "#F44336"),
    ("Insurance", "#795548"),
    ("Subscriptions", "#00BCD4"),
    ("Travel", "#3F51B5"),
    ("Education", "#8BC34A"),
    ("Rent/Mortgage", "#E91E63"),
    ("Gas/Fuel", "#FFC107"),
    ("Personal Care", "#CE93D8"),
    ("Gifts/Donations", "#FF7043"),
    ("Fees/Interest", "#90A4AE"),
    ("Income/Credits", "#66BB6A"),
    ("Other", "#BDBDBD"),
]


def seed_categories():
    db = get_db()
    for name, color in DEFAULT_CATEGORIES:
        db.execute(
            "INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)",
            (name, color),
        )
    db.commit()


def get_all():
    db = get_db()
    rows = db.execute("SELECT * FROM categories ORDER BY name").fetchall()
    return [dict(row) for row in rows]


def create(name, color=None):
    db = get_db()
    db.execute(
        "INSERT INTO categories (name, color) VALUES (?, ?)",
        (name, color),
    )
    db.commit()
    return db.execute(
        "SELECT * FROM categories WHERE id = last_insert_rowid()"
    ).fetchone()


def update(category_id, name=None, color=None):
    db = get_db()
    cat = db.execute("SELECT * FROM categories WHERE id = ?", (category_id,)).fetchone()
    if not cat:
        return None
    db.execute(
        "UPDATE categories SET name = ?, color = ? WHERE id = ?",
        (name or cat["name"], color or cat["color"], category_id),
    )
    db.commit()
    return dict(db.execute("SELECT * FROM categories WHERE id = ?", (category_id,)).fetchone())


def delete(category_id):
    db = get_db()
    db.execute("DELETE FROM categories WHERE id = ?", (category_id,))
    db.commit()

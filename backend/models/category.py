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
    db.execute("UPDATE transactions SET category_id = NULL WHERE category_id = ?", (category_id,))
    db.execute("DELETE FROM categories WHERE id = ?", (category_id,))
    db.commit()


def seed_keywords():
    import json
    from pathlib import Path

    json_path = Path(__file__).parent.parent / "parsers" / "category_keywords.json"
    if not json_path.exists():
        return

    db = get_db()
    existing = db.execute("SELECT COUNT(*) FROM category_keywords").fetchone()[0]
    if existing > 0:
        return

    with open(json_path) as f:
        keywords = json.load(f)

    for cat_name, kw_list in keywords.items():
        row = db.execute("SELECT id FROM categories WHERE name = ?", (cat_name,)).fetchone()
        if not row:
            continue
        cat_id = row[0]
        for kw in kw_list:
            db.execute(
                "INSERT OR IGNORE INTO category_keywords (category_id, keyword) VALUES (?, ?)",
                (cat_id, kw.strip().upper()),
            )
    db.commit()


def get_all_keywords():
    db = get_db()
    rows = db.execute(
        """SELECT c.name as category, ck.keyword
           FROM category_keywords ck
           JOIN categories c ON ck.category_id = c.id
           ORDER BY c.name, ck.keyword"""
    ).fetchall()
    result = {}
    for row in rows:
        result.setdefault(row["category"], []).append(row["keyword"])
    return result


def get_keywords_with_ids():
    db = get_db()
    rows = db.execute(
        """SELECT ck.id, ck.category_id, c.name as category_name, ck.keyword
           FROM category_keywords ck
           JOIN categories c ON ck.category_id = c.id
           ORDER BY c.name, ck.keyword"""
    ).fetchall()
    return [dict(row) for row in rows]


def add_keyword(category_id, keyword):
    db = get_db()
    keyword = keyword.strip().upper()
    db.execute(
        "INSERT OR IGNORE INTO category_keywords (category_id, keyword) VALUES (?, ?)",
        (category_id, keyword),
    )
    db.commit()
    cat = db.execute("SELECT name FROM categories WHERE id = ?", (category_id,)).fetchone()
    cat_name = cat["name"] if cat else ""
    keywords = db.execute(
        "SELECT keyword FROM category_keywords WHERE category_id = ? ORDER BY keyword",
        (category_id,),
    ).fetchall()
    return {"category": cat_name, "keywords": [r["keyword"] for r in keywords]}


def delete_keyword(keyword_id):
    db = get_db()
    db.execute("DELETE FROM category_keywords WHERE id = ?", (keyword_id,))
    db.commit()

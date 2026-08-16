from database.connection import get_db


def _build_where(filters):
    clauses = ["t.is_pending = False"]
    params = []
    if filters.get("account_id"):
        clauses.append("t.account_id = %s")
        params.append(int(filters["account_id"]))
    if filters.get("category_id"):
        clauses.append("t.category_id = %s")
        params.append(int(filters["category_id"]))
    if filters.get("start_date"):
        clauses.append("t.date >= %s")
        params.append(filters["start_date"])
    if filters.get("end_date"):
        clauses.append("t.date <= %s")
        params.append(filters["end_date"])
    if filters.get("search"):
        clauses.append("t.description ILIKE %s")
        params.append(f"%{filters['search']}%")
    return " AND ".join(clauses), params


def get_summary(filters):
    db = get_db()
    where, params = _build_where(filters)

    row = db.execute(
        f"""SELECT COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as total_spending,
                   COUNT(*) as transaction_count
            FROM transactions t WHERE {where}""",
        params,
    ).fetchone()

    top = db.execute(
        f"""SELECT c.name, SUM(t.amount) as total
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE {where} AND t.amount > 0 AND t.category_id IS NOT NULL
            GROUP BY t.category_id, c.name
            ORDER BY total DESC LIMIT 1""",
        params,
    ).fetchone()

    mom = _get_month_over_month(db, filters)

    return {
        "total_spending": row["total_spending"],
        "transaction_count": row["transaction_count"],
        "top_category": {"name": top["name"], "total": top["total"]} if top else None,
        "month_over_month": mom,
    }


def _get_month_over_month(db, filters):
    start = filters.get("start_date")
    end = filters.get("end_date")
    if not start or not end:
        return None

    current_month = start[:7]
    from datetime import datetime, timedelta
    d = datetime.strptime(current_month + "-01", "%Y-%m-%d")
    prev_d = (d - timedelta(days=1))
    prev_month = prev_d.strftime("%Y-%m")
    prev_start = f"{prev_month}-01"
    prev_end = prev_d.strftime("%Y-%m-%d")

    base_clauses = ["t.is_pending = False"]
    base_params = []
    if filters.get("account_id"):
        base_clauses.append("t.account_id = %s")
        base_params.append(int(filters["account_id"]))
    if filters.get("category_id"):
        base_clauses.append("t.category_id = %s")
        base_params.append(int(filters["category_id"]))
    if filters.get("search"):
        base_clauses.append("t.description ILIKE %s")
        base_params.append(f"%{filters['search']}%")

    base_where = " AND ".join(base_clauses)

    prev_row = db.execute(
        f"""SELECT COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as total
            FROM transactions t
            WHERE {base_where} AND t.date >= %s AND t.date <= %s""",
        base_params + [prev_start, prev_end],
    ).fetchone()

    prev_total = prev_row["total"]
    if prev_total == 0:
        return None

    current_row = db.execute(
        f"""SELECT COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as total
            FROM transactions t
            WHERE {base_where} AND t.date >= %s AND t.date <= %s""",
        base_params + [start, end],
    ).fetchone()

    current_total = current_row["total"]
    change_pct = round((current_total - prev_total) / prev_total * 100, 1)

    return {
        "current": current_total,
        "previous": prev_total,
        "change_pct": change_pct,
        "prev_month": prev_month,
    }


def get_by_category(filters):
    db = get_db()
    where, params = _build_where(filters)

    rows = db.execute(
        f"""SELECT COALESCE(c.name, 'Uncategorized') as category,
                   COALESCE(c.color, '#BDBDBD') as color,
                   SUM(t.amount) as total
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE {where} AND t.amount > 0
            GROUP BY t.category_id, c.name, c.color
            ORDER BY total DESC""",
        params,
    ).fetchall()

    return [dict(row) for row in rows]


def get_trends(filters):
    db = get_db()
    where, params = _build_where(filters)

    rows = db.execute(
        f"""SELECT  TO_CHAR(t.date, 'YYYY-MM')  as month,
                   SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as total
            FROM transactions t
            WHERE {where}
            GROUP BY month
            ORDER BY month""",
        params,
    ).fetchall()

    return [dict(row) for row in rows]


def get_top_categories(filters):
    db = get_db()
    where, params = _build_where(filters)

    rows = db.execute(
        f"""SELECT COALESCE(c.name, 'Uncategorized') as category,
                   COALESCE(c.color, '#BDBDBD') as color,
                   SUM(t.amount) as total,
                   COUNT(*) as count
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE {where} AND t.amount > 0
            GROUP BY t.category_id, c.name, c.color
            ORDER BY total DESC
            LIMIT 10""",
        params,
    ).fetchall()

    results = [dict(row) for row in rows]
    grand_total = sum(r["total"] for r in results) or 1
    for r in results:
        r["percentage"] = round(r["total"] / grand_total * 100, 1)
    return results


def get_top_merchants(filters):
    db = get_db()
    where, params = _build_where(filters)

    rows = db.execute(
        f"""SELECT t.description as merchant,
                   SUM(t.amount) as total,
                   COUNT(*) as count
            FROM transactions t
            WHERE {where} AND t.amount > 0
            GROUP BY t.description
            ORDER BY total DESC
            LIMIT 10""",
        params,
    ).fetchall()

    return [dict(row) for row in rows]

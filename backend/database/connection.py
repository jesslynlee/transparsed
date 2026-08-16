import os
import psycopg
from psycopg.rows import dict_row

from flask import current_app, g


def get_db():
    if "db" not in g:
        g.db = psycopg.connect(
            current_app.config["DATABASE_URL"],
            row_factory=dict_row
        )
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path) as f:
        sql = f.read()

    with db.cursor() as cursor:
        cursor.execute(sql)

    db.commit()

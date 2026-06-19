import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask
from flask_cors import CORS

from config import Config
from database.connection import close_db, init_db
from models.category import seed_categories
from routes.accounts import accounts_bp
from routes.categories import categories_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    app.teardown_appcontext(close_db)

    with app.app_context():
        init_db()
        seed_categories()

    app.register_blueprint(accounts_bp, url_prefix="/api")
    app.register_blueprint(categories_bp, url_prefix="/api")

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    return app


def find_available_port(start=5001, end=5099):
    import socket
    for port in range(start, end):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
    raise RuntimeError(f"No available port found in range {start}-{end}")


if __name__ == "__main__":
    app = create_app()
    port = find_available_port()
    print(f"\n  Expense Tracker API running on http://localhost:{port}\n")
    app.run(debug=True, port=port)

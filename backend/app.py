import logging
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

logging.getLogger("pdfminer").setLevel(logging.ERROR)

from flask import Flask
from flask_cors import CORS

from config import Config
from database.connection import close_db, init_db
from models.category import seed_categories
from routes.accounts import accounts_bp
from routes.categories import categories_bp
from routes.dashboard import dashboard_bp
from routes.transactions import transactions_bp
from routes.upload import upload_bp


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
    app.register_blueprint(dashboard_bp, url_prefix="/api")
    app.register_blueprint(transactions_bp, url_prefix="/api")
    app.register_blueprint(upload_bp, url_prefix="/api")

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    return app


if __name__ == "__main__":
    app = create_app()
    print("\n  Expense Tracker API running on http://localhost:5001\n")
    app.run(debug=True, port=5001)

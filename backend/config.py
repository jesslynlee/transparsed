import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    DATABASE_PATH = os.path.join(BASE_DIR, "expense_tracker.db")
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    TEMPLATES_DIR = os.path.join(BASE_DIR, "parsers", "templates")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload

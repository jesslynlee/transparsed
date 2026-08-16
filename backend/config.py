import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    DATABASE_URL = os.environ["DATABASE_URL"]
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    TEMPLATES_DIR = os.path.join(BASE_DIR, "parsers", "templates")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:9b")
    OLLAMA_NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "8192"))
    OLLAMA_NUM_PREDICT = int(os.getenv("OLLAMA_NUM_PREDICT", "4096"))
    OLLAMA_TIMEOUT_SECONDS = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "600"))
    PDF_RENDER_DPI = int(os.getenv("PDF_RENDER_DPI", "220"))

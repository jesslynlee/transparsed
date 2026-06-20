from flask import Blueprint, request, jsonify

from services.parsing_service import (
    process_upload,
    DuplicateFileError,
    UnknownBankForUpload,
)

upload_bp = Blueprint("upload", __name__)


@upload_bp.route("/upload", methods=["POST"])
def upload_statement():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    try:
        result = process_upload(file)
    except DuplicateFileError as e:
        return jsonify({"error": str(e)}), 409
    except UnknownBankForUpload as e:
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        return jsonify({"error": f"Failed to parse statement: {str(e)}"}), 500

    return jsonify({
        "success": True,
        "message": f"{result['transaction_count']} transactions parsed",
        **result,
    })

from flask import Blueprint, jsonify, request

from models import account

accounts_bp = Blueprint("accounts", __name__)


@accounts_bp.route("/accounts", methods=["GET"])
def list_accounts():
    return jsonify(account.get_all())


@accounts_bp.route("/accounts", methods=["POST"])
def create_account():
    data = request.get_json()
    required = ["name", "type", "institution", "template_id"]
    if not data or not all(data.get(f) for f in required):
        return jsonify({"error": f"Required fields: {', '.join(required)}"}), 400
    if data["type"] not in ("bank", "credit_card"):
        return jsonify({"error": "type must be 'bank' or 'credit_card'"}), 400
    result = account.create(data["name"], data["type"], data["institution"], data["template_id"])
    return jsonify(result), 201


@accounts_bp.route("/accounts/<int:account_id>", methods=["PUT"])
def update_account(account_id):
    data = request.get_json()
    result = account.update(
        account_id,
        data.get("name"),
        data.get("type"),
        data.get("institution"),
        data.get("template_id"),
    )
    if not result:
        return jsonify({"error": "Account not found"}), 404
    return jsonify(result)


@accounts_bp.route("/accounts/<int:account_id>", methods=["DELETE"])
def delete_account(account_id):
    account.delete(account_id)
    return "", 204

from flask import Blueprint, jsonify, request

from models import transaction

transactions_bp = Blueprint("transactions", __name__)


@transactions_bp.route("/transactions", methods=["GET"])
def list_transactions():
    filters = {}
    if request.args.get("is_pending") is not None:
        filters["is_pending"] = int(request.args["is_pending"])
    if request.args.get("account_id"):
        filters["account_id"] = int(request.args["account_id"])
    if request.args.get("category_id"):
        filters["category_id"] = int(request.args["category_id"])
    if request.args.get("start_date"):
        filters["start_date"] = request.args["start_date"]
    if request.args.get("end_date"):
        filters["end_date"] = request.args["end_date"]
    if request.args.get("search"):
        filters["search"] = request.args["search"]
    return jsonify(transaction.get_all(**filters))


@transactions_bp.route("/transactions", methods=["POST"])
def create_transaction():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    for field in ("account_id", "date", "description", "amount"):
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400
    result = transaction.create(
        account_id=data["account_id"],
        date=data["date"],
        description=data["description"],
        amount=data["amount"],
        category_id=data.get("category_id"),
        statement_period=data.get("statement_period"),
        is_pending=data.get("is_pending", 0),
    )
    return jsonify(result), 201


@transactions_bp.route("/transactions/<int:transaction_id>", methods=["PUT"])
def update_transaction(transaction_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    result = transaction.update(transaction_id, **data)
    if not result:
        return jsonify({"error": "Transaction not found"}), 404
    return jsonify(result)


@transactions_bp.route("/transactions/<int:transaction_id>", methods=["DELETE"])
def delete_transaction(transaction_id):
    transaction.delete(transaction_id)
    return "", 204


@transactions_bp.route("/transactions/commit", methods=["POST"])
def commit_transactions():
    data = request.get_json()
    if not data or not data.get("transaction_ids"):
        return jsonify({"error": "transaction_ids is required"}), 400
    count = transaction.commit(data["transaction_ids"])
    return jsonify({"committed": count})


@transactions_bp.route("/transactions/bulk-update", methods=["POST"])
def bulk_update_transactions():
    data = request.get_json()
    if not data or not data.get("updates"):
        return jsonify({"error": "updates is required"}), 400
    results = []
    for item in data["updates"]:
        tid = item.pop("id", None)
        if tid:
            result = transaction.update(tid, **item)
            if result:
                results.append(result)
    return jsonify(results)

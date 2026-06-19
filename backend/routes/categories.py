from flask import Blueprint, jsonify, request

from models import category

categories_bp = Blueprint("categories", __name__)


@categories_bp.route("/categories", methods=["GET"])
def list_categories():
    return jsonify(category.get_all())


@categories_bp.route("/categories", methods=["POST"])
def create_category():
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "name is required"}), 400
    result = category.create(data["name"], data.get("color"))
    return jsonify(dict(result)), 201


@categories_bp.route("/categories/<int:category_id>", methods=["PUT"])
def update_category(category_id):
    data = request.get_json()
    result = category.update(category_id, data.get("name"), data.get("color"))
    if not result:
        return jsonify({"error": "Category not found"}), 404
    return jsonify(result)


@categories_bp.route("/categories/<int:category_id>", methods=["DELETE"])
def delete_category(category_id):
    category.delete(category_id)
    return "", 204

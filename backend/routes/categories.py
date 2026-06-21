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


@categories_bp.route("/category-keywords", methods=["GET"])
def list_category_keywords():
    return jsonify(category.get_all_keywords())


@categories_bp.route("/category-keywords/all", methods=["GET"])
def list_keywords_with_ids():
    return jsonify(category.get_keywords_with_ids())


@categories_bp.route("/category-keywords", methods=["POST"])
def add_category_keyword():
    data = request.get_json()
    if not data or not data.get("category") or not data.get("keyword"):
        return jsonify({"error": "category and keyword are required"}), 400

    cat_name = data["category"]
    keyword = data["keyword"].strip().upper()

    cats = category.get_all()
    cat = next((c for c in cats if c["name"] == cat_name), None)
    if not cat:
        return jsonify({"error": f"Category '{cat_name}' not found"}), 404

    result = category.add_keyword(cat["id"], keyword)
    return jsonify(result)


@categories_bp.route("/category-keywords/<int:keyword_id>", methods=["DELETE"])
def remove_category_keyword(keyword_id):
    category.delete_keyword(keyword_id)
    return "", 204

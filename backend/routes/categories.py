import json
from pathlib import Path

from flask import Blueprint, jsonify, request

from models import category

categories_bp = Blueprint("categories", __name__)

CATEGORY_KEYWORDS_PATH = Path(__file__).parent.parent / "parsers" / "category_keywords.json"


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
    if not CATEGORY_KEYWORDS_PATH.exists():
        return jsonify({})
    with open(CATEGORY_KEYWORDS_PATH) as f:
        return jsonify(json.load(f))


@categories_bp.route("/category-keywords", methods=["POST"])
def add_category_keyword():
    data = request.get_json()
    if not data or not data.get("category") or not data.get("keyword"):
        return jsonify({"error": "category and keyword are required"}), 400

    cat_name = data["category"]
    keyword = data["keyword"].strip().upper()

    if CATEGORY_KEYWORDS_PATH.exists():
        with open(CATEGORY_KEYWORDS_PATH) as f:
            keywords = json.load(f)
    else:
        keywords = {}

    if cat_name not in keywords:
        keywords[cat_name] = []

    if keyword.upper() not in [k.upper() for k in keywords[cat_name]]:
        keywords[cat_name].append(keyword)

    with open(CATEGORY_KEYWORDS_PATH, "w") as f:
        json.dump(keywords, f, indent=2)
        f.write("\n")

    return jsonify({"category": cat_name, "keywords": keywords[cat_name]})

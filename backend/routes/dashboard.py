from flask import Blueprint, jsonify, request

from services import dashboard_service

dashboard_bp = Blueprint("dashboard", __name__)


def _get_filters():
    filters = {}
    for key in ("account_id", "category_id", "start_date", "end_date", "search"):
        val = request.args.get(key)
        if val:
            filters[key] = val
    return filters


@dashboard_bp.route("/dashboard/summary", methods=["GET"])
def summary():
    return jsonify(dashboard_service.get_summary(_get_filters()))


@dashboard_bp.route("/dashboard/by-category", methods=["GET"])
def by_category():
    return jsonify(dashboard_service.get_by_category(_get_filters()))


@dashboard_bp.route("/dashboard/trends", methods=["GET"])
def trends():
    return jsonify(dashboard_service.get_trends(_get_filters()))


@dashboard_bp.route("/dashboard/top-categories", methods=["GET"])
def top_categories():
    return jsonify(dashboard_service.get_top_categories(_get_filters()))


@dashboard_bp.route("/dashboard/top-merchants", methods=["GET"])
def top_merchants():
    return jsonify(dashboard_service.get_top_merchants(_get_filters()))

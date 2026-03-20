from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid

portfolio_bp = Blueprint("portfolio", __name__)
_store = {}

@portfolio_bp.route("/", methods=["GET"])
def list_portfolios():
    return jsonify(list(_store.values()))

@portfolio_bp.route("/", methods=["POST"])
def save_portfolio():
    body = request.get_json(silent=True) or {}
    for field in ["name", "tickers", "weights"]:
        if field not in body:
            return jsonify({"error": f"Missing field: {field}"}), 400
    pid = str(uuid.uuid4())
    _store[pid] = {
        "id": pid,
        "name": body["name"],
        "tickers": body["tickers"],
        "weights": body["weights"],
        "metrics": body.get("metrics", {}),
        "created_at": datetime.utcnow().isoformat(),
    }
    return jsonify(_store[pid]), 201

@portfolio_bp.route("/<pid>", methods=["DELETE"])
def delete_portfolio(pid):
    if pid not in _store:
        return jsonify({"error": "Not found"}), 404
    del _store[pid]
    return jsonify({"deleted": pid})
from flask import Blueprint, request, jsonify
from services.optimizer import PortfolioOptimizer
from services.market_data import market_data_service
import numpy as np
import logging

optimization_bp = Blueprint("optimization", __name__)
logger = logging.getLogger(__name__)

@optimization_bp.route("/run", methods=["POST"])
def run_optimization():
    body = request.get_json(silent=True) or {}
    tickers = body.get("tickers")
    period = body.get("period", "2y")
    n_portfolios = int(body.get("n_portfolios", 3000))

    if not tickers or len(tickers) < 2:
        return jsonify({"error": "Provide at least 2 tickers"}), 400

    try:
        returns = market_data_service.get_returns(tickers, period)
        rf = market_data_service.get_risk_free_rate()
        optimizer = PortfolioOptimizer(returns, risk_free_rate=rf)
        result = optimizer.run_full_optimization(n_portfolios)

        return jsonify({
            "tickers":        tickers,
            "risk_free_rate": rf,
            "portfolios":     result.portfolios,
            "max_sharpe":     result.max_sharpe.to_dict(),
            "min_variance":   result.min_variance.to_dict(),
            "frontier_curve": result.frontier_curve,
            "metadata": {
                "period":       period,
                "trading_days": len(returns),
                "n_portfolios": n_portfolios,
            }
        })
    except Exception as e:
        logger.exception("Optimization failed")
        return jsonify({"error": str(e)}), 500

@optimization_bp.route("/evaluate", methods=["POST"])
def evaluate_portfolio():
    body = request.get_json(silent=True) or {}
    tickers = body.get("tickers")
    weights = body.get("weights")
    period = body.get("period", "2y")

    if not tickers or not weights or len(tickers) != len(weights):
        return jsonify({"error": "tickers and weights must be equal-length lists"}), 400

    w = np.array(weights, dtype=float)
    w = w / w.sum()

    try:
        returns = market_data_service.get_returns(tickers, period)
        rf = market_data_service.get_risk_free_rate()
        optimizer = PortfolioOptimizer(returns, risk_free_rate=rf)
        result = optimizer._build_result(w)
        return jsonify(result.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500
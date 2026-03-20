from flask import Blueprint, request, jsonify
from services.market_data import market_data_service

market_data_bp = Blueprint("market_data", __name__)

@market_data_bp.route("/prices", methods=["GET"])
def get_prices():
    tickers = [t.strip().upper() for t in request.args.get("tickers","").split(",") if t.strip()]
    period  = request.args.get("period", "1y")
    if not tickers:
        return jsonify({"error": "Provide tickers as ?tickers=AAPL,MSFT"}), 400
    try:
        prices = market_data_service.get_historical_prices(tickers, period)
        return jsonify({
            "dates":  [d.strftime("%Y-%m-%d") for d in prices.index],
            "prices": {col: prices[col].round(2).tolist() for col in prices.columns},
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@market_data_bp.route("/current", methods=["GET"])
def get_current():
    tickers = [t.strip().upper() for t in request.args.get("tickers","").split(",") if t.strip()]
    if not tickers:
        return jsonify({"error": "Provide tickers"}), 400
    return jsonify(market_data_service.get_current_prices(tickers))

@market_data_bp.route("/info", methods=["GET"])
def get_info():
    ticker = request.args.get("ticker", "").upper()
    if not ticker:
        return jsonify({"error": "Provide ?ticker=AAPL"}), 400
    try:
        return jsonify(market_data_service.get_asset_info(ticker))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@market_data_bp.route("/rfr", methods=["GET"])
def get_rfr():
    return jsonify({"risk_free_rate": market_data_service.get_risk_free_rate()})
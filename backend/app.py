from flask import Flask
from flask_cors import CORS
from routes.portfolio import portfolio_bp
from routes.market_data import market_data_bp
from routes.optimization import optimization_bp
import os

def create_app():
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:3000"])

    # Register blueprints
    app.register_blueprint(portfolio_bp, url_prefix='/api/portfolio')
    app.register_blueprint(market_data_bp, url_prefix='/api/market')
    app.register_blueprint(optimization_bp, url_prefix='/api/optimize')

    @app.route('/api/health')
    def health():
        return {'status': 'ok', "version": "1.0.0"}
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=os.environ.get("FLASK_ENV") == "development"
    )
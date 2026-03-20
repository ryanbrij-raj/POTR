import numpy as np
import pandas as pd
from scipy.optimize import minimize
from scipy.stats import norm
from dataclasses import dataclass, asdict
from typing import Optional
import logging

logger = logging.getLogger(__name__)
Trading_Days = 252

@dataclass
class PortfolioResult:
    weights:         dict
    expected_return: float
    volatility:      float
    sharpe_ratio:    float
    var_95:          float
    cvar_95:         float
    max_drawdown:    float

    def to_dict(self):
        return asdict(self)

@dataclass
class EfficientFrontierResult:
    portfolios:     list
    max_sharpe:     PortfolioResult
    min_variance:   PortfolioResult
    frontier_curve: list

class PortfolioOptimizer:
    def __init__(self, returns, risk_free_rate=0.05):
        self.returns      = returns
        self.tickers      = list(returns.columns)
        self.n            = len(self.tickers)
        self.rf           = risk_free_rate
        self.mean_returns = returns.mean()
        self.cov_matrix   = returns.cov()
        self.ann_returns  = self.mean_returns * Trading_Days
        self.ann_cov      = self.cov_matrix * Trading_Days

    def portfolio_performance(self, weights):
        w = np.array(weights)
        ret = float(w @ self.ann_returns)
        vol = float(np.sqrt(w @ self.ann_cov @ w.T))
        sr = (ret - self.rf) / vol if vol > 0 else 0.0
        return ret, vol, sr
    
    def portfolio_var(self, weights, confidence=0.95):
        w = np.array(weights)
        mu_d  = float(w @ self.mean_returns)
        sig_d = float(np.sqrt(w @ self.cov_matrix @ w))
        z     = norm.ppf(1 - confidence)
        var   = -(mu_d + z * sig_d)
        cvar  = -(mu_d - sig_d * norm.pdf(z) / (1 - confidence))
        return max(var, 0), max(cvar, 0)
    
    def max_drawdown(self, weights):
        port_rets = self.returns @ weights
        cum       = (1 + port_rets).cumprod()
        drawdown  = (cum - cum.cummax()) / cum.cummax()
        return float(drawdown.min())

    def _build_result(self, weights):
        ret, vol, sr = self.portfolio_performance(weights)
        var, cvar    = self.portfolio_var(weights)
        mdd          = self.max_drawdown(weights)
        return PortfolioResult(
            weights          = {t: round(float(w), 6) for t, w in zip(self.tickers, weights)},
            expected_return  = round(ret, 6),
            volatility       = round(vol, 6),
            sharpe_ratio     = round(sr, 6),
            var_95           = round(var, 6),
            cvar_95          = round(cvar, 6),
            max_drawdown     = round(mdd, 6),
        )

    def maximize_sharpe(self):
        bounds      = ((0.0, 1.0),) * self.n
        constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1}]
        w0          = np.ones(self.n) / self.n

        def neg_sharpe(w):
            _, vol, sr = self.portfolio_performance(w)
            return -sr if vol > 0 else 0.0

        result = minimize(neg_sharpe, w0, method="SLSQP",
                          bounds=bounds, constraints=constraints,
                          options={"maxiter": 1000, "ftol": 1e-9})
        return self._build_result(result.x)

    def minimize_variance(self):
        bounds      = ((0.0, 1.0),) * self.n
        constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1}]
        w0          = np.ones(self.n) / self.n

        def port_variance(w):
            return float(w @ self.ann_cov @ w)

        result = minimize(port_variance, w0, method="SLSQP",
                          bounds=bounds, constraints=constraints,
                          options={"maxiter": 1000, "ftol": 1e-12})
        return self._build_result(result.x)

    def target_return_portfolio(self, target_ret):
        bounds      = ((0.0, 1.0),) * self.n
        constraints = [
            {"type": "eq", "fun": lambda w: np.sum(w) - 1},
            {"type": "eq", "fun": lambda w: float(w @ self.ann_returns) - target_ret},
        ]
        result = minimize(lambda w: float(w @ self.ann_cov @ w),
                          np.ones(self.n) / self.n,
                          method="SLSQP", bounds=bounds, constraints=constraints,
                          options={"maxiter": 1000, "ftol": 1e-12})
        return self._build_result(result.x) if result.success else None

    def efficient_frontier_curve(self, n_points=50):
        min_ret = float(self.ann_returns.min())
        max_ret = float(self.ann_returns.max())
        curve   = []
        for t in np.linspace(min_ret * 1.05, max_ret * 0.95, n_points):
            p = self.target_return_portfolio(t)
            if p:
                curve.append({"ret": p.expected_return, "risk": p.volatility})
        return curve

    def monte_carlo(self, n_portfolios=5000):
        portfolios = []
        rng = np.random.default_rng(42)
        for _ in range(n_portfolios):
            w            = rng.dirichlet(np.ones(self.n))
            ret, vol, sr = self.portfolio_performance(w)
            portfolios.append({
                "ret":     round(ret, 5),
                "risk":    round(vol, 5),
                "sharpe":  round(sr, 4),
                "weights": {t: round(float(wi), 4) for t, wi in zip(self.tickers, w)},
            })
        return portfolios

    def run_full_optimization(self, n_portfolios=3000):
        return EfficientFrontierResult(
            portfolios      = self.monte_carlo(n_portfolios),
            max_sharpe      = self.maximize_sharpe(),
            min_variance    = self.minimize_variance(),
            frontier_curve  = self.efficient_frontier_curve(50),
        )
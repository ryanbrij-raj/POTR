import os
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class MarketDataService:
    def __init__(self):
        self.av_key = os.getenv('ALPHA_VANTAGE_API_KEY')
    
    def get_historical_prices(self, tickers, period="2y", interval="1d"):
        raw = yf.download(tickers, period=period, interval=interval,
                          auto_adjust=True, progress=False, threads=True)
        if isinstance(raw.columns, pd.MultiIndex):
            prices = raw['Close']
        else:
            prices = raw[['Close']]
            prices.columns = [tickers]  # colmns should be tickers
        prices.dropna(how='all', inplace=True)  #drop nans rows
        prices = prices.ffill()
        return prices
    
    def get_returns(self, tickers, period="2y"):
        prices = self.get_historical_prices(tickers, period)
        return np.log(prices / prices.shift(1)).dropna()
    
    def get_asset_info(self, ticker):
        try:
            info = yf.Ticker(ticker).info
            return {
                'ticker': ticker,
                'name': info.get('longName', ticker),
                'sector': info.get('sector', 'N/A'),
                'currency': info.get('currency', 'USD'),
                'price': info.get('currentPrice') or info.get('regularMarketPrice'),
                'market_cap': info.get('marketCap'),
                'beta': info.get('beta'),
            }
        except Exception as e:
            logger.warning(f"Could not fetch info for {ticker}: {e}")
            return {'ticker': ticker, 'name': ticker}
        
    def get_current_prices(self, tickers):
        data = {}
        for t in tickers:
            try:
                hist = yf.Ticker(t).history(period="1d")
                data[t] = hist['Close'].iloc[-1] if not hist.empty else None
            except Exception as e:
                data[t] = None
            return data
    
    def get_risk_free_rate(self):
        try:
            hist = yf.Ticker('^IRX').history(period="5d")
            return float(hist['Close'].iloc[-1])/100
        except Exception:
            return .05
    
market_data_service = MarketDataService()
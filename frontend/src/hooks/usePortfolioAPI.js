import { useState, useCallback } from "react";

const BASE = import.meta.env.VITE_API_BASE ?? "";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

export function useOptimization() {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const run = useCallback(async ({ tickers, period = "2y", nPortfolios = 3000 }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/optimize/run", {
        method: "POST",
        body: JSON.stringify({ tickers, period, n_portfolios: nPortfolios }),
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, run };
}

export function useEvaluatePortfolio() {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const evaluate = useCallback(async ({ tickers, weights, period = "2y" }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/optimize/evaluate", {
        method: "POST",
        body: JSON.stringify({ tickers, weights, period }),
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, evaluate };
}

export function usePriceHistory() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetch_ = useCallback(async (tickers, period = "1y") => {
    setLoading(true);
    setError(null);
    try {
      const d = await apiFetch(
        `/api/market/prices?tickers=${tickers.join(",")}&period=${period}`
      );
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetch: fetch_ };
}

export function useSavedPortfolios() {
  const [portfolios, setPortfolios] = useState([]);

  const load = useCallback(async () => {
    const data = await apiFetch("/api/portfolio/");
    setPortfolios(data);
  }, []);

  const save = useCallback(async ({ name, tickers, weights, metrics }) => {
    const p = await apiFetch("/api/portfolio/", {
      method: "POST",
      body: JSON.stringify({ name, tickers, weights, metrics }),
    });
    setPortfolios(prev => [...prev, p]);
    return p;
  }, []);

  const remove = useCallback(async (id) => {
    await apiFetch(`/api/portfolio/${id}`, { method: "DELETE" });
    setPortfolios(prev => prev.filter(p => p.id !== id));
  }, []);

  return { portfolios, load, save, remove };
}
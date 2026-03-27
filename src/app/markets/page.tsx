"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import clsx from "clsx";
import { AppShell } from "@/components/layout";
import { Card, CardHeader, Badge, Sparkline, Button, Input } from "@/components/ui";
import { useAppStore } from "@/store";
import {
  fetchCryptoQuotes,
  getDefaultEconomicIndicators,
} from "@/lib/marketData";
import type { WatchlistItem, CryptoQuote, EconomicIndicator } from "@/types";
import { v4 as uuid } from "uuid";

export default function MarketsPage() {
  const {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    holdings,
  } = useAppStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addSymbol, setAddSymbol] = useState("");
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState<"stock" | "etf" | "crypto">("stock");

  const [cryptoQuotes, setCryptoQuotes] = useState<CryptoQuote[]>([]);
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([]);
  const [isLoadingCrypto, setIsLoadingCrypto] = useState(false);

  // Load economic indicators
  useEffect(() => {
    setIndicators(getDefaultEconomicIndicators());
  }, []);

  // Fetch crypto quotes
  const cryptoHoldings = useMemo(
    () => holdings.filter((h) => h.assetType === "crypto"),
    [holdings],
  );

  const loadCryptoQuotes = async () => {
    if (cryptoHoldings.length === 0) return;
    setIsLoadingCrypto(true);
    try {
      const ids = cryptoHoldings.map((h) => h.symbol.toLowerCase());
      const quotes = await fetchCryptoQuotes([...new Set(ids)]);
      setCryptoQuotes(quotes);
    } finally {
      setIsLoadingCrypto(false);
    }
  };

  useEffect(() => {
    loadCryptoQuotes();
  }, [cryptoHoldings.length]);

  // Crypto portfolio summary
  const cryptoPortfolioValue = useMemo(() => {
    let total = 0;
    for (const holding of cryptoHoldings) {
      const quote = cryptoQuotes.find(
        (q) => q.id === holding.symbol.toLowerCase(),
      );
      if (quote) {
        total += holding.quantity * quote.priceCAD;
      }
    }
    return total;
  }, [cryptoHoldings, cryptoQuotes]);

  const handleAddToWatchlist = () => {
    if (!addSymbol.trim() || !addName.trim()) return;
    addToWatchlist({
      id: uuid(),
      symbol: addSymbol.toUpperCase().trim(),
      name: addName.trim(),
      assetType: addType,
      sortOrder: watchlist.length,
      addedAt: new Date().toISOString(),
    });
    setAddSymbol("");
    setAddName("");
    setShowAddForm(false);
  };

  return (
    <AppShell>
      <div className="mb-4">
        <h2 className="text-xl font-display font-bold text-navy-900">
          Markets
        </h2>
        <p className="text-sm text-warm-500 mt-1">
          Stock watchlist, crypto tracker, and economic indicators
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Stock Watchlist */}
        <div className="lg:col-span-8">
          <Card padding="lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-sans font-semibold text-warm-800">
                  Watchlist
                </h3>
                <p className="text-2xs text-warm-400">
                  Delayed data — no real-time API configured
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowAddForm(true)}
              >
                <Plus size={12} className="mr-1" />
                Add
              </Button>
            </div>

            {/* Add form */}
            {showAddForm && (
              <div className="flex flex-col gap-2 mb-3 p-3 bg-warm-50 rounded">
                <div className="flex gap-2">
                  <Input
                    value={addSymbol}
                    onChange={(e) => setAddSymbol(e.target.value)}
                    placeholder="Symbol (e.g. AAPL)"
                  />
                  <Input
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Name"
                  />
                  <select
                    value={addType}
                    onChange={(e) =>
                      setAddType(e.target.value as "stock" | "etf" | "crypto")
                    }
                    className="h-[36px] px-2 text-xs rounded border border-warm-300 bg-white"
                  >
                    <option value="stock">Stock</option>
                    <option value="etf">ETF</option>
                    <option value="crypto">Crypto</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddToWatchlist}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {watchlist.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-warm-500">
                  No symbols in watchlist
                </p>
                <p className="text-xs text-warm-400 mt-1">
                  Add stocks and ETFs to track prices
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-warm-200">
                      <th className="text-left text-xs font-medium text-warm-600 uppercase tracking-wider pb-2">
                        Symbol
                      </th>
                      <th className="text-left text-xs font-medium text-warm-600 uppercase tracking-wider pb-2">
                        Name
                      </th>
                      <th className="text-left text-xs font-medium text-warm-600 uppercase tracking-wider pb-2">
                        Type
                      </th>
                      <th className="text-right text-xs font-medium text-warm-600 uppercase tracking-wider pb-2">
                        Price
                      </th>
                      <th className="text-right text-xs font-medium text-warm-600 uppercase tracking-wider pb-2 w-[40px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchlist.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-warm-100 last:border-b-0"
                      >
                        <td className="h-[36px] font-mono text-sm font-medium text-warm-800">
                          {item.symbol}
                        </td>
                        <td className="h-[36px] text-warm-600">
                          {item.name}
                        </td>
                        <td className="h-[36px]">
                          <Badge>{item.assetType}</Badge>
                        </td>
                        <td className="h-[36px] text-right font-mono text-sm tabular-nums text-warm-400">
                          —
                        </td>
                        <td className="h-[36px] text-right">
                          <button
                            onClick={() => removeFromWatchlist(item.id)}
                            className="text-warm-400 hover:text-danger p-1"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Crypto Portfolio */}
        <div className="lg:col-span-4">
          <Card padding="lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-sans font-semibold text-warm-800">
                  Crypto Holdings
                </h3>
                <p className="text-2xs text-warm-400">
                  Via CoinGecko (free, no key)
                </p>
              </div>
              <button
                onClick={loadCryptoQuotes}
                disabled={isLoadingCrypto}
                className="text-warm-400 hover:text-warm-700"
              >
                <RefreshCw
                  size={14}
                  className={isLoadingCrypto ? "animate-spin" : ""}
                />
              </button>
            </div>

            {cryptoHoldings.length === 0 ? (
              <p className="text-sm text-warm-500 text-center py-8">
                No crypto holdings recorded
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="border-b border-warm-100 pb-3">
                  <p className="text-2xs text-warm-500 uppercase tracking-wider">
                    Total Value
                  </p>
                  <p className="font-mono text-xl tabular-nums text-warm-900">
                    {cryptoPortfolioValue > 0
                      ? new Intl.NumberFormat("en-CA", {
                          style: "currency",
                          currency: "CAD",
                        }).format(cryptoPortfolioValue)
                      : "—"}
                  </p>
                </div>

                {cryptoHoldings.map((holding) => {
                  const quote = cryptoQuotes.find(
                    (q) => q.id === holding.symbol.toLowerCase(),
                  );
                  return (
                    <div
                      key={holding.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-warm-800">
                          {holding.symbol}
                        </p>
                        <p className="text-2xs text-warm-400">
                          {holding.quantity} units
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm tabular-nums text-warm-800">
                          {quote
                            ? new Intl.NumberFormat("en-CA", {
                                style: "currency",
                                currency: "CAD",
                              }).format(holding.quantity * quote.priceCAD)
                            : "—"}
                        </p>
                        {quote && (
                          <p
                            className={clsx(
                              "text-2xs font-mono tabular-nums",
                              quote.changePercent24h >= 0
                                ? "text-forest"
                                : "text-danger",
                            )}
                          >
                            {quote.changePercent24h >= 0 ? "+" : ""}
                            {quote.changePercent24h.toFixed(2)}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Economic Indicators */}
        <div className="lg:col-span-12">
          <Card padding="lg">
            <CardHeader
              title="Economic Indicators"
              subtitle="Canadian and US macro data"
            />
            <p className="text-2xs text-warm-400 mb-3">
              Data is placeholder-free. Configure API keys in Settings to
              fetch live indicators. All values shown as "—" until live data
              is available.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {indicators.map((indicator) => (
                <div
                  key={indicator.id}
                  className="flex items-center justify-between p-2 bg-warm-50 rounded"
                >
                  <div className="flex flex-col gap-[2px] min-w-0">
                    <span className="text-xs text-warm-600 truncate">
                      {indicator.name}
                    </span>
                    <span className="text-2xs text-warm-400">
                      {indicator.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <Sparkline
                      data={indicator.trend90d}
                      width={64}
                      height={20}
                    />
                    <span className="font-mono text-sm tabular-nums text-warm-400">
                      —
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import PortfolioChart from "@/components/PortfolioChart";
import StockStats from "@/components/StockStats";
import { 
  fetchStockData, 
  getQuote, 
  PortfolioDataPoint, 
  AlpacaQuote
} from "@/services/alpacaApi";
import Link from "next/link";

// Available time ranges
type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'MAX';

export default function Market() {
  const { logout } = useAuth();
  const [stockData, setStockData] = useState<PortfolioDataPoint[]>([]);
  const [tickerSymbol, setTickerSymbol] = useState<string | null>(null);
  const [tickerInput, setTickerInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [quoteData, setQuoteData] = useState<AlpacaQuote | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // Determine if view is intraday (1D)
  const isIntraday = timeRange === '1D';

  useEffect(() => {
    // Check API connection on component mount
    async function checkApiConnection() {
      try {
        // Try to fetch a known ticker like AAPL to verify connection
        await getQuote("AAPL");
        setApiConnected(true);
      } catch (err) {
        console.error("API connection check failed:", err);
        setApiConnected(false);
        setError("Failed to verify API connection");
      }
    }

    checkApiConnection();
  }, []);

  const handleTickerSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tickerInput.trim()) return;

    // Don't proceed if API connection is known to be failing
    if (apiConnected === false) {
      setError("Cannot search stocks: API connection is not available");
      return;
    }

    const ticker = tickerInput.toUpperCase();
    setError(null);
    setIsLoading(true);
    setStockData([]); // Clear previous data

    try {
      // First get the current quote
      const quote = await getQuote(ticker);
      
      // Then get historical data
      const data = await fetchStockData(ticker, timeRange);

      // Validate we have actual data
      if (!data || data.length === 0) {
        throw new Error("No data available for this ticker");
      }

      // Update state with the results
      setTickerSymbol(ticker);
      setStockData(data);
      setQuoteData(quote);

      // API is working if we got here
      setApiConnected(true);
    } catch (err: any) {
      console.error("Error fetching stock data:", err);
      
      const errorMessage = err.message || 'Unknown error occurred';
      setError(`Could not load data for "${ticker}". ${errorMessage}`);
      
      setStockData([]);
      setTickerSymbol(null);
      setQuoteData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeRangeChange = async (range: TimeRange) => {
    if (!tickerSymbol) return;

    setTimeRange(range);
    setIsLoading(true);

    try {
      const data = await fetchStockData(tickerSymbol, range);

      // Validate we have actual data
      if (!data || data.length === 0) {
        throw new Error("No data available for this time range");
      }

      setStockData(data);
    } catch (err: any) {
      console.error("Error fetching stock data:", err);
      const errorMessage = err.message || 'Unknown error occurred';
      setError(`Could not load ${range} data for "${tickerSymbol}". ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrade = () => {
    if (!tickerSymbol || !quoteData) return;

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    const tradeValue = quoteData.price * parsedQuantity;

    // Using alert for mock trades
    alert(`${orderType.toUpperCase()} order placed successfully:
      Ticker: ${tickerSymbol}
      Quantity: ${parsedQuantity}
      Price: $${quoteData.price.toFixed(2)}
      Total: $${tradeValue.toFixed(2)}`);
  };

  return (
    <ProtectedRoute>
      <div className="w-full max-w-6xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Market</h1>
          <div className="flex gap-3">
            <Link 
              href="/portfolio" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Portfolio
            </Link>
            <button
              onClick={logout}
              className="px-4 py-2 text-black bg-white rounded hover:bg-gray-200"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-medium text-white mb-4">
            Stock Lookup
          </h2>

          {apiConnected === false && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
              <p className="font-semibold">API Connection Error</p>
              <p>The application cannot connect to the Alpaca API.</p>
            </div>
          )}

          <div className="mb-4">
            <form onSubmit={handleTickerSearch} className="flex gap-2">
              <input
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                placeholder="Enter ticker symbol (e.g., AAPL)"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Search'}
              </button>
            </form>

            {error && (
              <div className="mt-2 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {tickerSymbol && (
            <>
              {/* Time Range Selection */}
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="text-gray-400 text-sm flex items-center mr-2">Time Range:</div>
                {(['1D', '1W', '1M', '3M', '1Y', 'MAX'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => handleTimeRangeChange(range)}
                    className={`px-3 py-1 text-xs rounded ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    disabled={isLoading}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="bg-gray-800 rounded-lg p-8 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  <PortfolioChart 
                    ticker={tickerSymbol} 
                    timeRange={timeRange}
                    title={`${tickerSymbol} (${timeRange})`}
                  />

                  {stockData.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                      <div className="lg:col-span-2">
                        {/* Use the StockStats component with isIntraday prop */}
                        <StockStats 
                          ticker={tickerSymbol}
                          isIntraday={isIntraday}
                        />
                      </div>

                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-4">Trade {tickerSymbol}</h3>

                        <div className="mb-4">
                          <label htmlFor="order-type" className="block text-sm font-medium text-gray-300 mb-1">
                            Order Type
                          </label>
                          <div className="flex rounded-md overflow-hidden">
                            <button
                              type="button"
                              className={`flex-1 py-2 text-center ${
                                orderType === 'buy' 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                              onClick={() => setOrderType('buy')}
                            >
                              Buy
                            </button>
                            <button
                              type="button"
                              className={`flex-1 py-2 text-center ${
                                orderType === 'sell' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                              onClick={() => setOrderType('sell')}
                            >
                              Sell
                            </button>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            id="quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Market Price:</span>
                            <span className="text-white">
                              ${quoteData?.price.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span className="text-gray-300">Estimated Total:</span>
                            <span className="text-white">
                              ${((quoteData?.price || 0) * parseInt(quantity || "0")).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleTrade}
                          className={`w-full py-2 rounded font-medium ${
                            orderType === 'buy'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {orderType === 'buy' ? 'Buy' : 'Sell'} {tickerSymbol}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

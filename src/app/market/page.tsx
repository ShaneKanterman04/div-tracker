"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import PortfolioChart from "@/components/PortfolioChart";
import StockStats from "@/components/StockStats";
import { fetchStockData, StockDataPoint } from "@/services/stockApi";
import Link from "next/link";

// Available time ranges
type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'MAX';

export default function Market() {
  const { apiKey, logout } = useAuth();
  const [stockData, setStockData] = useState<StockDataPoint[]>([]);
  const [tickerSymbol, setTickerSymbol] = useState<string | null>(null);
  const [tickerInput, setTickerInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [quantity, setQuantity] = useState<string>("1");
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");

  useEffect(() => {
    // Initialize with a default stock (optional)
    if (process.env.NODE_ENV === 'development') {
      console.log("Market component mounted");
    }
  }, []);
  
  const handleTickerSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tickerInput.trim()) return;
    
    const ticker = tickerInput.toUpperCase();
    setError(null);
    setIsLoading(true);
    
    try {
      const data = await fetchStockData(ticker, timeRange);
      setTickerSymbol(ticker);
      setStockData(data);
      
      if (data.length > 0) {
        setCurrentPrice(data[data.length - 1].close);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error fetching stock data:", err);
      setError(`Could not load data for "${ticker}". Please check the ticker symbol and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    if (!tickerSymbol) return;
    
    setTimeRange(range);
    setIsLoading(true);
    
    fetchStockData(tickerSymbol, range)
      .then(data => {
        setStockData(data);
        
        if (data.length > 0) {
          setCurrentPrice(data[data.length - 1].close);
          setLastUpdated(new Date());
        }
        
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching stock data:", err);
        setError(`Could not load ${range} data for "${tickerSymbol}".`);
        setIsLoading(false);
      });
  };
  
  // Get previous close for price comparison (last value from previous day)
  const getPreviousClose = (): number => {
    if (stockData.length === 0) return 0;
    
    // For intraday, use the open price as reference
    if (timeRange === '1D') {
      return stockData[0].open;
    }
    
    // For other time ranges, use the second-to-last day's close
    return stockData.length > 1 ? stockData[stockData.length - 2].close : 0;
  };
  
  // Get daily high and low
  const getDayRange = () => {
    if (stockData.length === 0) return { high: 0, low: 0 };
    
    // For intraday, get from the dataset
    if (timeRange === '1D') {
      let high = -Infinity;
      let low = Infinity;
      
      stockData.forEach(point => {
        high = Math.max(high, point.high);
        low = Math.min(low, point.low);
      });
      
      return { high, low };
    }
    
    // For other time ranges, use the last data point
    const lastPoint = stockData[stockData.length - 1];
    return { high: lastPoint.high, low: lastPoint.low };
  };

  const handleTrade = () => {
    if (!tickerSymbol || !currentPrice) return;
    
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError("Please enter a valid quantity");
      return;
    }
    
    const tradeValue = currentPrice * parsedQuantity;
    
    // TODO: Implement actual trade logic with API
    alert(`${orderType.toUpperCase()} order placed successfully:
      Ticker: ${tickerSymbol}
      Quantity: ${parsedQuantity}
      Price: $${currentPrice.toFixed(2)}
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
                    data={stockData} 
                    title={`${tickerSymbol} (${timeRange})`}
                  />
                  
                  {stockData.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                      <div className="lg:col-span-2">
                        <StockStats 
                          ticker={tickerSymbol}
                          currentPrice={currentPrice}
                          previousClose={getPreviousClose()}
                          open={stockData[0]?.open || 0}
                          high={getDayRange().high}
                          low={getDayRange().low}
                          volume={stockData[stockData.length - 1]?.volume || 0}
                          lastUpdated={lastUpdated}
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
                            <span className="text-white">${currentPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span className="text-gray-300">Estimated Total:</span>
                            <span className="text-white">${(currentPrice * parseInt(quantity || "0")).toFixed(2)}</span>
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

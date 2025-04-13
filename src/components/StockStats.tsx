import React, { useState, useEffect } from 'react';
import { getQuote, AlpacaQuote } from '../services/alpacaApi';

interface StockStatsProps {
  ticker: string;
  isIntraday?: boolean; // New prop to indicate intraday view
}

const StockStats: React.FC<StockStatsProps> = ({ 
  ticker,
  isIntraday = false // Default to false
}) => {
  const [quoteData, setQuoteData] = useState<AlpacaQuote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuoteData = async () => {
      if (!ticker) {
        setLoading(false);
        setError("No ticker provided");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getQuote(ticker);
        setQuoteData(data);
        // Only show loading on initial fetch
        setLoading(false);
      } catch (err) {
        console.error("Error loading quote data:", err);
        setError(`Failed to load data: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchQuoteData();
    
    // Set up a periodic refresh at different rates based on view type
    const refreshInterval = setInterval(
      fetchQuoteData, 
      isIntraday ? 2000 : 60000 // 2 seconds for intraday, 60 seconds otherwise
    );
    
    // Clean up interval on unmount
    return () => clearInterval(refreshInterval);
  }, [ticker, isIntraday]); // Re-run effect if isIntraday changes
  
  // Format values
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  const formatTime = (date: Date) => {
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  };
  
  // Add a small indicator when in intraday mode showing real-time updates
  const renderUpdateIndicator = () => {
    if (!isIntraday || !quoteData) return null;
    
    return (
      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
        <span className="animate-pulse mr-1 h-2 w-2 rounded-full bg-blue-500"></span>
        Live
      </span>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mt-4">
      {loading && !quoteData && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="text-red-400 py-4 text-center">
          {error}
        </div>
      )}
      
      {!loading && !error && quoteData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current price */}
          <div className="col-span-1">
            <div className="flex flex-col">
              <div className="text-2xl font-bold text-white flex items-center">
                {formatCurrency(quoteData.price)}
                {renderUpdateIndicator()}
              </div>
              <div className={`flex items-center ${quoteData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <span className="text-lg font-medium">
                  {quoteData.change >= 0 ? '+' : ''}{formatCurrency(quoteData.change)} ({quoteData.changePercent.toFixed(2)}%)
                </span>
                <svg 
                  className="h-4 w-4 ml-1" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d={quoteData.change >= 0 
                      ? "M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" 
                      : "M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                    } 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              <div className="text-gray-400 text-xs mt-1">
                Last updated: {formatTime(quoteData.timestamp)}
              </div>
            </div>
          </div>
          
          {/* Key stats */}
          <div className="col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs">Open</span>
                <span className="text-white">{quoteData.open ? formatCurrency(quoteData.open) : 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs">Previous Close</span>
                <span className="text-white">{formatCurrency(quoteData.previousClose)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs">Day High</span>
                <span className="text-white">{quoteData.high ? formatCurrency(quoteData.high) : 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs">Day Low</span>
                <span className="text-white">{quoteData.low ? formatCurrency(quoteData.low) : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!loading && !error && !quoteData && (
        <div className="text-gray-400 py-4 text-center">
          No data available
        </div>
      )}
    </div>
  );
};

export default StockStats;

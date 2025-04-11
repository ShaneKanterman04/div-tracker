import React from 'react';

interface StockStatsProps {
  ticker: string;
  currentPrice: number;
  previousClose?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  lastUpdated: Date;
}

const StockStats: React.FC<StockStatsProps> = ({
  ticker,
  currentPrice,
  previousClose = 0,
  open = 0,
  high = 0,
  low = 0,
  volume = 0,
  lastUpdated
}) => {
  // Calculate change and percentage
  const priceChange = previousClose > 0 ? currentPrice - previousClose : 0;
  const changePercent = previousClose > 0 ? (priceChange / previousClose) * 100 : 0;
  
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
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current price */}
        <div className="col-span-1">
          <div className="flex flex-col">
            <div className="text-2xl font-bold text-white">{formatCurrency(currentPrice)}</div>
            <div className={`flex items-center ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <span className="text-lg font-medium">
                {priceChange >= 0 ? '+' : ''}{formatCurrency(priceChange)} ({changePercent.toFixed(2)}%)
              </span>
              <svg 
                className="h-4 w-4 ml-1" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d={priceChange >= 0 
                    ? "M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" 
                    : "M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                  } 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="text-gray-400 text-xs mt-1">
              Last updated: {formatTime(lastUpdated)}
            </div>
          </div>
        </div>
        
        {/* Key stats */}
        <div className="col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <span className="text-gray-400 text-xs">Open</span>
              <span className="text-white">{formatCurrency(open)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-xs">Previous Close</span>
              <span className="text-white">{formatCurrency(previousClose)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-xs">Day High</span>
              <span className="text-white">{formatCurrency(high)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-xs">Day Low</span>
              <span className="text-white">{formatCurrency(low)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockStats;

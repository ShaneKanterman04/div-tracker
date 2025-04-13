import React, { useState } from 'react';
import PortfolioChart from './PortfolioChart';

const ExampleUsage: React.FC = () => {
  const [selectedTicker, setSelectedTicker] = useState<string>('AAPL');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('1M');
  
  const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
  const timeRanges = ['1D', '1W', '1M', '3M', '1Y', 'MAX'];
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Stock Chart Example</h1>
      
      <div className="mb-4 flex flex-wrap gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Ticker:</label>
          <select 
            value={selectedTicker} 
            onChange={(e) => setSelectedTicker(e.target.value)}
            className="bg-gray-700 text-white rounded p-2"
          >
            {tickers.map(ticker => (
              <option key={ticker} value={ticker}>{ticker}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Time Range:</label>
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="bg-gray-700 text-white rounded p-2"
          >
            {timeRanges.map(range => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>
      </div>
      
      <PortfolioChart 
        ticker={selectedTicker} 
        timeRange={selectedTimeRange} 
      />
    </div>
  );
};

export default ExampleUsage;

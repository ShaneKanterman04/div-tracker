import React, { useState } from 'react';
import PortfolioChart from './PortfolioChart';
import StockStats from './StockStats';

const StockDetail: React.FC = () => {
  const [ticker, setTicker] = useState('AAPL');
  const [timeRange, setTimeRange] = useState('1D');
  
  // Determine if view is intraday (1D)
  const isIntraday = timeRange === '1D';
  
  return (
    <div className="container mx-auto p-4">
      {/* Time range selector */}
      <div className="mb-4">
        {/* ...time range buttons... */}
      </div>
      
      <PortfolioChart ticker={ticker} timeRange={timeRange} />
      
      {/* Pass isIntraday prop to StockStats */}
      <StockStats ticker={ticker} isIntraday={isIntraday} />
    </div>
  );
};

export default StockDetail;

import React, { useState, useEffect } from 'react';
import { setupRealTimeUpdates } from '@/services/alpacaApi';

interface RealTimeStockPriceProps {
  symbol: string;
  initialPrice?: number;
}

const RealTimeStockPrice: React.FC<RealTimeStockPriceProps> = ({ symbol, initialPrice = 0 }) => {
  const [price, setPrice] = useState<number>(initialPrice);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!symbol) return;

    setPrice(initialPrice);
    setConnected(false);
    
    // Set up WebSocket connection for real-time price updates
    const cleanup = setupRealTimeUpdates(symbol, (newPrice) => {
      setPrice(newPrice);
      setLastUpdated(new Date());
      setConnected(true);
    });

    return cleanup;
  }, [symbol, initialPrice]);

  // Format the time since last update
  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    
    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    } else {
      return `${Math.floor(seconds / 3600)}h ago`;
    }
  };

  return (
    <div className="flex flex-col">
      <div className="text-2xl font-bold">
        ${price.toFixed(2)}
        <span className={`ml-2 text-xs ${connected ? 'text-green-400' : 'text-yellow-400'}`}>
          {connected ? '● LIVE' : '○ Connecting...'}
        </span>
      </div>
      <div className="text-xs text-gray-400">
        Last updated {getTimeSinceUpdate()}
      </div>
    </div>
  );
};

export default RealTimeStockPrice;

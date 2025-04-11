"use client";

import React, { useState, useEffect, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import PortfolioChart from "@/components/PortfolioChart";
import StockStats from "@/components/StockStats";
import Link from "next/link";

// Generate realistic sample data for the past 30 days
function generateSampleData(timeRange: TimeRange = '1M') {
  const data = [];
  const now = new Date();
  
  // Starting portfolio value
  let lastClose = 10000; // $10,000 starting portfolio value
  
  // Market trend factors
  const overallTrend = 0.0005; // Slight positive trend (~0.5% overall growth)
  const weeklyPattern = [0.001, 0.0005, 0.0002, -0.0003, -0.0008]; // Weekly pattern
  
  // Adjust the number of data points based on the time range
  let days = 30; // Default for 1M
  
  if (timeRange === '1D') {
    // For 1D, generate hourly data points
    return generateSampleIntradayData();
  } else if (timeRange === '1W') {
    days = 7;
  } else if (timeRange === '3M') {
    days = 90;
  } else if (timeRange === '1Y') {
    days = 365;
  } else if (timeRange === 'MAX') {
    days = 1095; // ~3 years of data
  }
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    // Apply trend factors
    const dayOfWeek = date.getDay();
    const dailyTrend = weeklyPattern[dayOfWeek % 5];
    const trendFactor = overallTrend + dailyTrend;
    
    // Create small daily volatility (0.5-1.5%)
    const dailyVolatility = lastClose * (0.005 + Math.random() * 0.01);
    
    // Calculate open (based on previous close with small gap possibility)
    const gapChance = Math.random();
    const open = gapChance > 0.7 
      ? lastClose * (1 + (Math.random() - 0.5) * 0.005) // Occasional small gap
      : lastClose;
    
    // Calculate high, low and close
    const trendInfluence = lastClose * trendFactor;
    const randomWalk = (Math.random() - 0.5) * dailyVolatility;
    const close = open + trendInfluence + randomWalk;
    
    // Ensure high is the highest value and low is the lowest value
    const intraRange = dailyVolatility * (0.6 + Math.random() * 0.8);
    const high = Math.max(open, close) + Math.random() * intraRange;
    const low = Math.min(open, close) - Math.random() * intraRange;
    
    data.push({
      x: date,
      open,
      close,
      high,
      low
    });
    
    // Set for next iteration
    lastClose = close;
  }
  
  return data;
}

// Generate sample intraday data for the portfolio (7am-7pm)
function generateSampleIntradayData() {
  const data = [];
  const now = new Date();
  const today = new Date(now);
  today.setHours(7, 0, 0, 0); // Start at 7:00 AM
  
  let lastClose = 10000; // Starting portfolio value
  
  // Generate hourly data points from 7am to 7pm (13 hours)
  for (let i = 0; i < 13; i++) {
    const hourTime = new Date(today);
    hourTime.setHours(hourTime.getHours() + i);
    
    // Don't generate future data points
    if (hourTime > now) break;
    
    // More volatility during market hours
    const isMarketHours = hourTime.getHours() >= 9 && hourTime.getHours() <= 16;
    const volatilityFactor = isMarketHours ? 0.003 : 0.001;
    
    const volatility = lastClose * volatilityFactor;
    const change = (Math.random() - 0.45) * volatility; // Slight upward bias
    const open = lastClose;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    data.push({
      x: hourTime,
      open,
      high,
      low,
      close
    });
    
    lastClose = close;
  }
  
  return data;
}

// Available time ranges
type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'MAX';

export default function Portfolio() {
  const { logout } = useAuth();
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Reference to store interval ID for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize data on component mount
  useEffect(() => {
    const initialData = generateSampleData();
    setPortfolioData(initialData);
    
    if (initialData.length > 0) {
      setCurrentPrice(initialData[initialData.length - 1].close);
    }
  }, []);
  
  // Set up real-time updates for intraday view
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Only set up interval for intraday view
    if (timeRange === '1D') {
      intervalRef.current = setInterval(() => {
        setPortfolioData(prevData => {
          if (!prevData.length) return prevData;
          
          // Clone the data
          const updatedData = [...prevData];
          
          // Get the latest data point
          const lastPoint = updatedData[updatedData.length - 1];
          
          // Create a small random price movement
          const volatility = lastPoint.close * 0.0005; // 0.05% movement
          const priceChange = (Math.random() - 0.5) * volatility;
          const newPrice = lastPoint.close + priceChange;
          
          // Update the latest data point
          updatedData[updatedData.length - 1] = {
            ...lastPoint,
            close: newPrice,
            high: Math.max(lastPoint.high, newPrice),
            low: Math.min(lastPoint.low, newPrice)
          };
          
          // Update current price state
          setCurrentPrice(newPrice);
          setLastUpdated(new Date());
          
          return updatedData;
        });
      }, 1000); // Update every second
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timeRange]);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setIsLoading(true);
    
    // Use a short delay to simulate loading
    setTimeout(() => {
      const newData = generateSampleData(range);
      setPortfolioData(newData);
      
      if (newData.length > 0) {
        setCurrentPrice(newData[newData.length - 1].close);
        setLastUpdated(new Date());
      }
      
      setIsLoading(false);
    }, 500);
  };
  
  // Get previous close for price comparison (last value from previous day)
  const getPreviousClose = (): number => {
    if (portfolioData.length === 0) return 0;
    
    // For intraday, use the open price as reference
    if (timeRange === '1D') {
      return portfolioData[0].open;
    }
    
    // For other time ranges, use the second-to-last day's close
    return portfolioData.length > 1 ? portfolioData[portfolioData.length - 2].close : 0;
  };
  
  // Get daily high and low
  const getDayRange = () => {
    if (portfolioData.length === 0) return { high: 0, low: 0 };
    
    // For intraday, get from the dataset
    if (timeRange === '1D') {
      let high = -Infinity;
      let low = Infinity;
      
      portfolioData.forEach(point => {
        high = Math.max(high, point.high);
        low = Math.min(low, point.low);
      });
      
      return { high, low };
    }
    
    // For other time ranges, use the last data point
    const lastPoint = portfolioData[portfolioData.length - 1];
    return { high: lastPoint.high, low: lastPoint.low };
  };

  return (
    <ProtectedRoute>
      <div className="w-full max-w-6xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Your Portfolio</h1>
          <div className="flex gap-3">
            <Link 
              href="/market" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Market
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
            Portfolio Overview
          </h2>
          
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
                data={portfolioData} 
                title={`Portfolio Value (${timeRange})`}
              />
              
              {/* Portfolio Statistics */}
              {portfolioData.length > 0 && (
                <StockStats 
                  ticker="Portfolio"
                  currentPrice={currentPrice}
                  previousClose={getPreviousClose()}
                  open={portfolioData[0]?.open || 0}
                  high={getDayRange().high}
                  low={getDayRange().low}
                  volume={0}
                  lastUpdated={lastUpdated}
                />
              )}
            </>
          )}
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-medium text-white mb-4">
            Upcoming Dividends
          </h2>
          <p className="text-gray-300">Dividend data will appear here.</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}

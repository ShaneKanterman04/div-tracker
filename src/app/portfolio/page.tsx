"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

import { VictoryChart, VictoryCandlestick, VictoryAxis, VictoryTheme } from "victory";

// Generate realistic sample data for the past 30 days
const generateSampleData = () => {
  const data = [];
  const now = new Date();
  
  // Starting portfolio value
  let lastClose = 10000; // $10,000 starting portfolio value
  
  // Market trend factors
  const overallTrend = 0.0005; // Slight positive trend (~0.5% overall growth)
  const weeklyPattern = [0.001, 0.0005, 0.0002, -0.0003, -0.0008]; // Weekly pattern
  
  for (let i = 30; i >= 0; i--) {
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
};

export default function Portfolio() {
  const { apiKey, logout } = useAuth();
  const [portfolioData, setPortfolioData] = useState([]);
  
  useEffect(() => {
    // In a real app, you would fetch real data here
    setPortfolioData(generateSampleData());
  }, []);

  return (
    <ProtectedRoute>
      <div className="w-full max-w-6xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Your Portfolio</h1>
          <button
            onClick={logout}
            className="px-4 py-2 text-black bg-white rounded hover:bg-gray-200"
          >
            Logout
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-medium text-white mb-4">
            Portfolio Overview
          </h2>
          <p className="text-gray-300 mb-4">
            API Key:{" "}
            {apiKey
              ? `${apiKey.substring(0, 5)}...${apiKey.substring(
                  apiKey.length - 5
                )}`
              : "Not authenticated"}
          </p>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-2">Portfolio Value (Last 30 Days)</h3>
            <VictoryChart 
              theme={VictoryTheme.material}
              domainPadding={{ x: 25 }}
              scale={{ x: "time" }}
              height={300}
              padding={{ top: 20, bottom: 40, left: 70, right: 20 }}
            >
              <VictoryAxis 
                tickCount={7}  // Show fewer tick labels (weekly intervals)
                tickFormat={(t) => {
                  const date = new Date(t);
                  return `${date.getMonth()+1}/${date.getDate()}`;
                }}
                style={{
                  tickLabels: { 
                    fill: "white", 
                    fontSize: 8
                  },
                  axis: { stroke: "white" }
                }}
              />
              <VictoryAxis 
                dependentAxis
                tickFormat={(t) => `$${Math.round(t).toLocaleString()}`}
                style={{
                  tickLabels: { fill: "white", fontSize: 8 },
                  axis: { stroke: "white" }
                }}
              />
              <VictoryCandlestick
                data={portfolioData}  // All data points will still be rendered
                candleColors={{ positive: "#2cb67d", negative: "#ef4444" }}
                candleWidth={8}  // Width optimized for displaying all candles
              />
            </VictoryChart>
          </div>
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

import { StockDataPoint } from "@/services/stockApi";

// Define the quote interface similar to AlpacaQuote
export interface MockQuote {
  price: number;
  askPrice: number;
  askSize: number;
  bidPrice: number;
  bidSize: number;
  timestamp: Date;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  symbol: string;
}

// Dictionary of mock base prices for common stocks
const mockBaseStockPrices: Record<string, number> = {
  'AAPL': 180.5,
  'MSFT': 340.2,
  'AMZN': 135.7,
  'GOOGL': 140.8,
  'META': 300.5,
  'TSLA': 220.3,
  'NVDA': 450.9,
  'AMD': 120.4,
  'INTC': 35.8,
  'IBM': 145.6,
  // Add more stocks as needed
};

// Default base price for stocks not in the list
const DEFAULT_PRICE = 100.0;

// Generate a random variation within a certain percentage
const randomVariation = (value: number, percentMax: number = 0.5) => {
  const variance = (Math.random() - 0.5) * 2 * (percentMax / 100) * value;
  return value + variance;
};

// Get a base price for a ticker
const getBasePrice = (ticker: string): number => {
  return mockBaseStockPrices[ticker] || DEFAULT_PRICE;
};

// Generate historical price data with realistic patterns
export const generateHistoricalData = (
  ticker: string, 
  timeRange: '1D' | '1W' | '1M' | '3M' | '1Y' | 'MAX'
): StockDataPoint[] => {
  const basePrice = getBasePrice(ticker);
  let dataPoints: StockDataPoint[] = [];
  const now = new Date();
  let dataPointCount: number;
  let timeIncrement: number;
  
  // Configure data points based on time range
  switch(timeRange) {
    case '1D':
      dataPointCount = 78; // 6.5 hours of trading in 5-min increments
      timeIncrement = 5 * 60 * 1000; // 5 minutes in ms
      break;
    case '1W':
      dataPointCount = 5 * 7; // 5 data points per day * 7 days
      timeIncrement = 24 * 60 * 60 * 1000 / 5; // ~5 per day
      break;
    case '1M':
      dataPointCount = 23; // ~23 trading days in a month
      timeIncrement = 24 * 60 * 60 * 1000; // 1 day
      break;
    case '3M':
      dataPointCount = 65; // ~65 trading days in 3 months
      timeIncrement = 24 * 60 * 60 * 1000; // 1 day
      break;
    case '1Y':
      dataPointCount = 260; // ~260 trading days in a year
      timeIncrement = 24 * 60 * 60 * 1000; // 1 day
      break;
    case 'MAX':
      dataPointCount = 1000; // Some arbitrary "max" amount
      timeIncrement = 5 * 24 * 60 * 60 * 1000; // 5 days
      break;
  }

  // Set initial price with some variance
  let currentPrice = randomVariation(basePrice, 20);
  
  // Create a trend bias for this period (-0.1 to +0.1)
  const trendBias = (Math.random() - 0.5) * 0.2;
  
  // Generate data points
  for (let i = 0; i < dataPointCount; i++) {
    // More volatility for shorter timeframes
    const volatility = timeRange === '1D' ? 2 : 
                       timeRange === '1W' ? 3 :
                       timeRange === '1M' ? 5 : 10;
                       
    // Calculate price movement with trend bias
    const movement = (Math.random() - 0.5 + trendBias) * (currentPrice * (volatility / 1000));
    currentPrice += movement;
    
    // Ensure price doesn't go negative
    if (currentPrice <= 0) currentPrice = 0.01;
    
    // Calculate timestamp for this data point
    const timestamp = new Date(now.getTime() - (dataPointCount - i) * timeIncrement);
    
    // Generate high/low with realistic variations
    const highVariation = Math.abs(Math.random() * movement * 2);
    const lowVariation = -Math.abs(Math.random() * movement * 2);
    
    // Create data point
    const dataPoint: StockDataPoint = {
      timestamp,
      open: currentPrice - movement/2,
      close: currentPrice,
      high: currentPrice + highVariation,
      low: currentPrice + lowVariation,
      volume: Math.floor(Math.random() * 10000000) + 100000,
    };
    
    dataPoints.push(dataPoint);
  }
  
  return dataPoints;
};

// Get current quote for a ticker
export const getMockQuote = async (ticker: string): Promise<MockQuote> => {
  const basePrice = getBasePrice(ticker);
  const currentPrice = randomVariation(basePrice, 2);
  const previousClose = randomVariation(basePrice, 3);
  
  // Small random spread
  const spread = currentPrice * (Math.random() * 0.001 + 0.0001);
  const askPrice = currentPrice + spread;
  const bidPrice = currentPrice - spread;
  
  return {
    price: currentPrice,
    askPrice: askPrice,
    askSize: Math.floor(Math.random() * 1000) + 100,
    bidPrice: bidPrice,
    bidSize: Math.floor(Math.random() * 1000) + 100,
    timestamp: new Date(),
    high: currentPrice * (1 + Math.random() * 0.02),
    low: currentPrice * (1 - Math.random() * 0.02),
    open: randomVariation(basePrice, 1),
    previousClose: previousClose,
    volume: Math.floor(Math.random() * 10000000) + 100000,
    symbol: ticker
  };
};

// Simulate real-time updates
export const setupMockRealTimeUpdates = (
  ticker: string, 
  onUpdate: (price: number) => void
) => {
  const basePrice = getBasePrice(ticker);
  let currentPrice = basePrice;
  
  const interval = setInterval(() => {
    // Small random change (up to 0.5%)
    const change = (Math.random() - 0.5) * 0.01 * currentPrice;
    currentPrice += change;
    
    // Ensure price doesn't go negative
    if (currentPrice <= 0) currentPrice = 0.01;
    
    onUpdate(currentPrice);
  }, 3000); // Update every 3 seconds
  
  // Return cleanup function
  return () => clearInterval(interval);
};

// Mock API verification
export const verifyMockApiConnection = async (): Promise<boolean> => {
  // Always return true for mock API
  return Promise.resolve(true);
};

// Mock function to fetch stock data
export const fetchMockStockData = async (
  ticker: string,
  timeRange: '1D' | '1W' | '1M' | '3M' | '1Y' | 'MAX'
): Promise<StockDataPoint[]> => {
  // Add slight delay to simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate and return mock data
  return generateHistoricalData(ticker, timeRange);
};

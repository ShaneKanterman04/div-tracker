export interface StockDataPoint {
  x: Date;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'MAX';

// Mock function that simulates fetching stock data from an API
export async function fetchStockData(ticker: string, timeRange: TimeRange = '1M'): Promise<StockDataPoint[]> {
  // In a real app, this would call an actual API
  // For now, we'll just simulate a network request with random data
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
  
  return generateMockStockData(ticker, timeRange);
}

// Generate realistic sample stock data
function generateMockStockData(ticker: string, timeRange: TimeRange): StockDataPoint[] {
  const data: StockDataPoint[] = [];
  const now = new Date();
  
  // Different tickers should have different price ranges
  const basePrice = getBasePrice(ticker);
  
  // Determine data points based on time range
  let days = 30; // Default for 1M
  
  if (timeRange === '1D') {
    // For 1D, generate hourly data
    return generateIntradayData(basePrice);
  } else if (timeRange === '1W') {
    days = 7;
  } else if (timeRange === '3M') {
    days = 90;
  } else if (timeRange === '1Y') {
    days = 365;
  } else if (timeRange === 'MAX') {
    days = 1095; // ~3 years of data
  }
  
  // Starting price
  let lastClose = basePrice;
  
  // Generate daily data
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    // No trading on weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    
    // Daily volatility (0.5-2.5%)
    const dailyVolatility = lastClose * (0.005 + Math.random() * 0.02);
    
    const open = lastClose * (1 + (Math.random() - 0.5) * 0.005);
    const randomChange = (Math.random() - 0.48) * dailyVolatility; // Slight upward bias
    const close = open + randomChange;
    
    // Random high and low within day's range
    const high = Math.max(open, close) + Math.random() * dailyVolatility * 0.5;
    const low = Math.min(open, close) - Math.random() * dailyVolatility * 0.5;
    
    // Random volume in thousands
    const volume = Math.round(1000 + Math.random() * 9000) * 1000;
    
    data.push({
      x: date,
      open,
      close,
      high,
      low,
      volume
    });
    
    lastClose = close;
  }
  
  return data;
}

// Generate intraday data (hourly for a single day)
function generateIntradayData(basePrice: number): StockDataPoint[] {
  const data: StockDataPoint[] = [];
  const now = new Date();
  const today = new Date(now);
  today.setHours(9, 30, 0, 0); // Market open at 9:30 AM
  
  let lastClose = basePrice;
  
  // Generate hourly data points from 9:30am to 4pm (6.5 hours)
  for (let i = 0; i <= 13; i++) {
    const timePoint = new Date(today);
    timePoint.setMinutes(timePoint.getMinutes() + i * 30); // Every 30 minutes
    
    if (timePoint > now || timePoint.getHours() >= 16) {
      // Don't generate future data or after market close
      break;
    }
    
    const volatility = lastClose * 0.002; // 0.2% volatility per half-hour
    const change = (Math.random() - 0.5) * volatility;
    const open = lastClose;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    // Random volume per half-hour
    const volume = Math.round(100 + Math.random() * 900) * 1000;
    
    data.push({
      x: timePoint,
      open,
      high,
      low,
      close,
      volume
    });
    
    lastClose = close;
  }
  
  return data;
}

// Assign realistic base prices to popular tickers
function getBasePrice(ticker: string): number {
  const tickerPrices: Record<string, number> = {
    'AAPL': 180 + Math.random() * 20,
    'MSFT': 380 + Math.random() * 30,
    'GOOGL': 140 + Math.random() * 15,
    'AMZN': 160 + Math.random() * 20,
    'META': 340 + Math.random() * 25,
    'TSLA': 220 + Math.random() * 30,
    'NVDA': 840 + Math.random() * 50,
    'JPM': 170 + Math.random() * 15,
    'DIS': 110 + Math.random() * 10
  };
  
  return tickerPrices[ticker] || 50 + Math.random() * 50; // Default price range
}

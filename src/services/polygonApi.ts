import { restClient } from '@polygon.io/client-js';
import { StockDataPoint } from './stockApi';

const POLYGON_API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY;
const polygon = restClient(POLYGON_API_KEY || "");

// Define types for our API responses
export interface PolygonQuote {
  ticker: string;
  price: number;
  timestamp: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

/**
 * Verify API connection and key validity
 */
export async function verifyApiConnection(): Promise<boolean> {
  try {
    // Simple API call to check if our key works
    const response = await polygon.reference.tickers({
      market: "stocks",
      limit: 1,
    });
    
    return response.status === "OK";
  } catch (error) {
    console.error("Failed to connect to Polygon API:", error);
    return false;
  }
}

/**
 * Get the latest quote for a stock symbol
 */
export async function getQuote(symbol: string): Promise<PolygonQuote> {
  try {
    // Get previous close
    const prevClose = await polygon.stocks.previousClose(symbol);
    
    // Get latest quote
    const quote = await polygon.stocks.lastQuote(symbol);
    
    // Get latest trade
    const trade = await polygon.stocks.lastTrade(symbol);
    
    if (prevClose.status !== "OK" || quote.status !== "OK" || trade.status !== "OK") {
      throw new Error(`Failed to fetch data for ${symbol}`);
    }
    
    // Extract daily data if available
    const dailyData = prevClose.results?.[0] || {};
    
    // Calculate change and percent change
    const previousClose = dailyData.c || 0;
    const currentPrice = trade.results?.p || 0;
    const change = currentPrice - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;
    
    return {
      ticker: symbol,
      price: currentPrice,
      timestamp: trade.results?.t || Date.now(),
      change,
      changePercent,
      previousClose,
      open: dailyData.o,
      high: dailyData.h,
      low: dailyData.l,
      volume: dailyData.v
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    throw new Error(`Failed to fetch quote for ${symbol}: ${error}`);
  }
}

/**
 * Get stock data for a specific time range
 */
export async function fetchStockData(symbol: string, timeRange: string): Promise<StockDataPoint[]> {
  try {
    // Define multiplier, timespan and range based on the selected time range
    let multiplier = 1;
    let timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day';
    let from: Date = new Date();
    const to = new Date();
    
    switch (timeRange) {
      case '1D':
        // 1-minute candles for the day
        timespan = 'minute';
        multiplier = 5;
        from = new Date(to);
        from.setDate(to.getDate() - 1);
        break;
      case '1W':
        // 1-hour candles for the week
        timespan = 'hour';
        multiplier = 1;
        from = new Date(to);
        from.setDate(to.getDate() - 7);
        break;
      case '1M':
        // Daily candles for a month
        timespan = 'day';
        multiplier = 1;
        from = new Date(to);
        from.setMonth(to.getMonth() - 1);
        break;
      case '3M':
        // Daily candles for 3 months
        timespan = 'day';
        multiplier = 1;
        from = new Date(to);
        from.setMonth(to.getMonth() - 3);
        break;
      case '1Y':
        // Weekly candles for a year
        timespan = 'week';
        multiplier = 1;
        from = new Date(to);
        from.setFullYear(to.getFullYear() - 1);
        break;
      case 'MAX':
        // Monthly candles for maximum time
        timespan = 'month';
        multiplier = 1;
        from = new Date(to);
        from.setFullYear(to.getFullYear() - 5); // 5 years back
        break;
      default:
        // Default to daily candles for a month
        timespan = 'day';
        multiplier = 1;
        from = new Date(to);
        from.setMonth(to.getMonth() - 1);
    }
    
    // Format dates in YYYY-MM-DD format
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];
    
    console.log(`Fetching ${timeRange} data for ${symbol}: ${timespan} from ${fromStr} to ${toStr}`);
    
    // Call Polygon API to get aggregates (candles)
    const response = await polygon.stocks.aggregates(
      symbol, 
      multiplier, 
      timespan, 
      fromStr, 
      toStr
    );
    
    if (response.status !== "OK" || !response.results || response.results.length === 0) {
      console.error(`No data returned for ${symbol}:`, response);
      throw new Error(`No data available for ${symbol}`);
    }
    
    // Transform the data to our app's format
    return response.results.map(candle => ({
      x: new Date(candle.t),
      open: candle.o,
      high: candle.h,
      low: candle.l,
      close: candle.c,
      volume: candle.v
    }));
  } catch (error) {
    console.error(`Error fetching ${timeRange} data for ${symbol}:`, error);
    throw new Error(`Failed to fetch ${timeRange} data for ${symbol}`);
  }
}

/**
 * Get real-time stock price using WebSocket
 * 
 * Note: This is a placeholder. For real-time data with Polygon,
 * you should use their WebSocket API which requires a paid subscription.
 */
export function setupRealTimeUpdates(symbol: string, callback: (price: number) => void): () => void {
  // This is a simplified implementation that polls for updates
  // In a production app, you would use Polygon's WebSocket API
  const intervalId = setInterval(async () => {
    try {
      const quote = await getQuote(symbol);
      callback(quote.price);
    } catch (error) {
      console.error(`Error polling for ${symbol} updates:`, error);
    }
  }, 10000); // Poll every 10 seconds
  
  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Search for stocks by ticker or company name
 */
export async function searchStocks(query: string): Promise<any[]> {
  try {
    const response = await polygon.reference.tickerSearch({
      search: query,
      market: "stocks",
      limit: 10
    });
    
    if (response.status !== "OK") {
      throw new Error(`Search failed: ${response.status}`);
    }
    
    return response.results || [];
  } catch (error) {
    console.error(`Error searching for ${query}:`, error);
    throw new Error(`Search failed: ${error}`);
  }
}

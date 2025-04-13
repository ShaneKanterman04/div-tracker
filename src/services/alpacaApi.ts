import { StockDataPoint } from './stockApi';

// API Configuration
const ALPACA_API_KEY = process.env.NEXT_PUBLIC_ALPACA_API_KEY;
const ALPACA_API_SECRET = process.env.NEXT_PUBLIC_ALPACA_API_SECRET;
const ALPACA_API_BASE_URL = process.env.NEXT_PUBLIC_ALPACA_API_BASE_URL || 'https://api.alpaca.markets';
const ALPACA_DATA_BASE_URL = process.env.NEXT_PUBLIC_ALPACA_DATA_BASE_URL || 'https://data.alpaca.markets';

// Common headers for API requests - updated to match example exactly
const headers = {
  'accept': 'application/json',
  'APCA-API-KEY-ID': ALPACA_API_KEY || '',
  'APCA-API-SECRET-KEY': ALPACA_API_SECRET || ''
};

// Define interfaces for API responses
export interface AlpacaBar {
  t: string; // Timestamp (RFC-3339 format)
  o: number; // Open price
  h: number; // High price
  l: number; // Low price
  c: number; // Close price
  v: number; // Volume
}

export interface AlpacaQuote {
  ticker: string;
  price: number;
  timestamp: Date;
  change: number;
  changePercent: number;
  previousClose: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

/**
 * Verify the API connection to Alpaca
 */
export async function verifyApiConnection(): Promise<boolean> {
  try {
    // Test the API with a simple account request
    const response = await fetch(`${ALPACA_API_BASE_URL}/v2/account`, {
      headers
    });

    if (!response.ok) {
      console.error(`API connection error: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    console.log("Alpaca API connection successful");
    return true;
  } catch (error) {
    console.error("Failed to connect to Alpaca API:", error);
    return false;
  }
}

/**
 * Get stock bars (OHLC) for a specific timeframe
 * Updated with improved parameters matching the example
 */
export async function getBars(
  symbol: string,
  timeFrame: string,
  startDate: string,
  endDate: string,
  limit: number = 1000
): Promise<AlpacaBar[]> {
  try {
    // Build URL with all required parameters
    const url = new URL(`${ALPACA_DATA_BASE_URL}/v2/stocks/${symbol.toLowerCase()}/bars`);
    url.searchParams.append('timeframe', timeFrame);
    url.searchParams.append('start', startDate);
    url.searchParams.append('end', endDate);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('adjustment', 'raw');
    url.searchParams.append('feed', 'sip'); // Adding feed parameter
    url.searchParams.append('sort', 'asc'); // Adding sort parameter (ascending)

    console.log(`Fetching bars from ${url}`);

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'APCA-API-KEY-ID': 'AKHD6IJ0NSXGR0HXNPS2',
        'APCA-API-SECRET-KEY': 'HCYmQ8PFn7s4yuwsjhXtNPer3dmkpLbdCEsNMbtG'
      }
    };
    
    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      console.error(`Bars API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      throw new Error(`Failed to fetch bars for ${symbol}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.bars || [];
  } catch (error) {
    console.error(`Error fetching bars for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get the latest bar (OHLC) for a specific symbol
 * Updated to match provided example
 */
export async function getLatestBar(symbol: string, timeframe?: string): Promise<AlpacaBar | null> {
  try {
    // Create URL based on whether timeframe is provided
    let url = `${ALPACA_DATA_BASE_URL}/v2/stocks/${symbol.toLowerCase()}/bars/latest`;
    if (timeframe) {
      url += `?timeframe=${timeframe}`;
    }
    
    console.log(`Fetching latest bar from ${url}`);
    
    const options = {
      method: 'GET',
      headers
    };
    
    const response = await fetch(url, options);

    if (!response.ok) {
      console.error(`Latest bar API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      throw new Error(`Failed to fetch latest bar for ${symbol}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Latest bar data for ${symbol}:`, data);
    
    // Check if we got valid data
    if (!data.bar) {
      console.warn(`No latest bar data available for ${symbol}`);
      return null;
    }
    
    return data.bar;
  } catch (error) {
    console.error(`Error fetching latest bar for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get quote data for a symbol
 */
export async function getQuote(symbol: string): Promise<AlpacaQuote> {
  try {
    // First try to get the latest bar
    const latestBar = await getLatestBar(symbol);
    
    // Get latest trade
    const tradeUrl = `${ALPACA_DATA_BASE_URL}/v2/stocks/${symbol}/trades/latest`;
    const tradeResponse = await fetch(tradeUrl, { headers });

    if (!tradeResponse.ok) {
      throw new Error(`Failed to fetch latest trade for ${symbol}`);
    }

    const tradeData = await tradeResponse.json();
    const trade = tradeData.trade;

    // Get previous day's bar for comparison
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const startDate = yesterday.toISOString();
    const endDate = now.toISOString();

    const previousDayUrl = `${ALPACA_DATA_BASE_URL}/v2/stocks/${symbol}/bars?timeframe=1Day&start=${startDate}&end=${endDate}&limit=1`;
    const previousDayResponse = await fetch(previousDayUrl, { headers });
    const previousDayData = await previousDayResponse.json();
    const previousBar = previousDayData.bars && previousDayData.bars.length > 0 ? previousDayData.bars[0] : null;
    
    // Calculate change and percent change
    const currentPrice = trade ? trade.p : (latestBar ? latestBar.c : 0);
    const previousClose = previousBar ? previousBar.c : (latestBar ? latestBar.o : 0);
    const change = currentPrice - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

    return {
      ticker: symbol,
      price: currentPrice,
      timestamp: new Date(trade ? trade.t : (latestBar ? latestBar.t : Date.now())),
      change,
      changePercent,
      previousClose,
      open: latestBar?.o || previousBar?.o,
      high: latestBar?.h || previousBar?.h,
      low: latestBar?.l || previousBar?.l,
      volume: latestBar?.v || previousBar?.v
    };
  } catch (error) {
    console.error(`Error fetching quote data for ${symbol}:`, error);
    throw new Error(`Failed to fetch quote data for ${symbol}: ${error}`);
  }
}

/**
 * Fetch stock data for a specific time range with improved date handling
 */
export async function fetchStockData(symbol: string, timeRange: string): Promise<StockDataPoint[]> {
  try {
    // Define parameters based on time range
    let timeframe: string;
    let startDate: Date;
    const endDate = new Date();
    const now = new Date();
    
    // Set the end time to now
    endDate.setMilliseconds(0); // Zero out milliseconds for cleaner timestamps
    
    // Determine timeframe and start date based on the selected time range
    switch (timeRange) {
      case '1D':
        // For 1-day view: use 5-minute candles, start from market open (9:30 AM)
        timeframe = '5Min';
        
        // Start from 9:30 AM today (or yesterday if it's after market hours)
        startDate = new Date(now);
        if (now.getHours() < 9 || (now.getHours() === 9 && now.getMinutes() < 30)) {
          // Before market open, show yesterday
          startDate.setDate(startDate.getDate() - 1);
        }
        
        // Set to market open time (9:30 AM)
        startDate.setHours(9, 30, 0, 0);
        
        // If it's weekend, go back to Friday
        const day = startDate.getDay();
        if (day === 0) startDate.setDate(startDate.getDate() - 2); // Sunday to Friday
        if (day === 6) startDate.setDate(startDate.getDate() - 1); // Saturday to Friday
        break;
        
      case '1W':
        // For 1-week view: use 1-hour candles
        timeframe = '1Hour';
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
        
      case '1M':
        // For 1-month view: use daily candles
        timeframe = '1Day';
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
        
      case '3M':
        // For 3-month view: use daily candles
        timeframe = '1Day';
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
        
      case '1Y':
        // For 1-year view: use daily candles (changed from weekly for more detail)
        timeframe = '1Day';
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
        
      case 'MAX':
        // For max view: use weekly candles, going back 5 years
        timeframe = '1Week';
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 5);
        break;
        
      default:
        // Default to daily candles for a month
        timeframe = '1Day';
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    // Format dates in ISO format with 'Z' timezone indicator
    // The format should be: YYYY-MM-DDTHH:mm:ssZ
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    console.log(`Fetching ${timeRange} data for ${symbol}: ${timeframe} from ${startDateStr} to ${endDateStr}`);
    
    // Fetch the bars
    const bars = await getBars(
      symbol,
      timeframe,
      startDateStr,
      endDateStr,
      1000
    );

    if (!bars || bars.length === 0) {
      console.warn(`No data available for ${symbol} in the ${timeRange} time range`);
      throw new Error(`No data available for ${symbol} in the selected time range`);
    }

    console.log(`Received ${bars.length} bars for ${symbol}`);

    // Transform to app's data format
    return bars.map(bar => ({
      x: new Date(bar.t),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v
    }));
  } catch (error) {
    console.error(`Error fetching ${timeRange} data for ${symbol}:`, error);
    throw new Error(`Failed to fetch ${timeRange} data for ${symbol}: ${error}`);
  }
}

/**
 * Set up polling for real-time updates - updated to match example
 */
export function setupRealTimeUpdates(symbol: string, callback: (price: number) => void): () => void {
  const intervalId = setInterval(async () => {
    try {
      const url = `${ALPACA_DATA_BASE_URL}/v2/stocks/${symbol.toLowerCase()}/trades/latest`;
      
      const options = {
        method: 'GET',
        headers
      };
      
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`Failed to fetch latest trade`);
      }

      const data = await response.json();
      const price = data.trade?.p;

      if (price) {
        callback(price);
      }
    } catch (error) {
      console.error(`Error polling for ${symbol} updates:`, error);
    }
  }, 10000); // Poll every 10 seconds

  return () => clearInterval(intervalId);
}

/**
 * Search for stocks by ticker or name
 */
export async function searchStocks(query: string): Promise<any[]> {
  try {
    const url = new URL(`${ALPACA_API_BASE_URL}/v2/assets`);
    url.searchParams.append('status', 'active');
    
    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error('Failed to fetch assets');
    }

    const assets = await response.json();
    
    // Filter assets based on the query
    return assets.filter((asset: any) => 
      asset.symbol.toLowerCase().includes(query.toLowerCase()) || 
      (asset.name && asset.name.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error(`Error searching for ${query}:`, error);
    throw new Error(`Search failed: ${error}`);
  }
}

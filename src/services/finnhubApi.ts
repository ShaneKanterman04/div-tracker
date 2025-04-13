import { StockDataPoint } from './stockApi';

// Define interfaces for Finnhub API responses
interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

interface FinnhubCandle {
  c: number[]; // List of close prices
  h: number[]; // List of high prices
  l: number[]; // List of low prices
  o: number[]; // List of open prices
  s: string;   // Status
  t: number[]; // List of timestamps
  v: number[]; // List of volumes
}

interface FinnhubWebSocketMessage {
  type: string;
  data: {
    s: string;    // Symbol
    p: number;    // Last price
    t: number;    // UNIX milliseconds timestamp
    v: number;    // Volume
    c: string[];  // Trade conditions
  }[];
}

// WebSocket connection state management
type WebSocketHandler = (data: FinnhubWebSocketMessage) => void;

let websocket: WebSocket | null = null;
const handlers: Map<string, Set<WebSocketHandler>> = new Map();
const subscribedSymbols: Set<string> = new Set();

// Base URL and API key
const BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

/**
 * Verify API key and connectivity
 */
export async function verifyApiConnection(): Promise<boolean> {
  try {
    // Test the API with a simple request
    const response = await fetch(`${BASE_URL}/stock/symbol?exchange=US&token=${API_KEY}`);
    
    if (response.status === 403) {
      console.error("API authentication failed: Check your API key");
      return false;
    }
    
    return response.ok;
  } catch (error) {
    console.error("API connection test failed:", error);
    return false;
  }
}

/**
 * Get the latest quote for a stock symbol
 */
export async function getQuote(symbol: string): Promise<FinnhubQuote> {
  const url = `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    
    if (response.status === 403) {
      throw new Error("API authentication failed. Please check your API key or subscription plan.");
    }
    
    if (!response.ok) {
      console.error(`Quote API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch quote for ${symbol}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Quote data for ${symbol}:`, data);
    return data;
  } catch (error) {
    console.error("Quote fetch error:", error);
    throw error;
  }
}

/**
 * Get candle data for a symbol
 * @param symbol Stock symbol
 * @param resolution Candle resolution: 1, 5, 15, 30, 60, D, W, M
 * @param from UNIX timestamp (seconds)
 * @param to UNIX timestamp (seconds)
 */
export async function getCandles(
  symbol: string, 
  resolution: string, 
  from: number, 
  to: number
): Promise<StockDataPoint[]> {
  // Ensure the API key is properly formatted and included
  if (!API_KEY) {
    throw new Error("API key is missing. Please check your environment variables.");
  }

  // Use the correct endpoint for stock candles
  const url = `${BASE_URL}/stock/candle?symbol=${symbol.toUpperCase()}&resolution=${resolution}&from=${Math.floor(from)}&to=${Math.floor(to)}&token=${API_KEY}`;
  
  console.log(`Fetching candles from: ${url.replace(API_KEY, "[API_KEY]")}`);
  
  const response = await fetch(url);
  
  if (response.status === 403) {
    console.error("API access forbidden (403). Possible causes:");
    console.error("- Invalid API key");
    console.error("- Exceeded API rate limits");
    console.error("- Subscription plan doesn't include this endpoint");
    throw new Error("API access forbidden. Please check your API key and subscription plan.");
  }
  
  if (!response.ok) {
    console.error(`Candle API error: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to fetch candles for ${symbol}: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`Candle data status for ${symbol}:`, data.s);
  
  // Handle API error responses that still return 200 OK
  if (data.s !== 'ok') {
    console.error(`API returned error status for ${symbol}:`, data);
    throw new Error(`Invalid candle data for ${symbol}: ${data.s || 'Unknown error'}`);
  }
  
  // If data is empty or missing required fields
  if (!data.t || !data.c || data.t.length === 0) {
    console.error(`Empty or invalid data returned for ${symbol}:`, data);
    throw new Error(`No candle data available for ${symbol}`);
  }
  
  // Transform to our app's data format
  return data.t.map((timestamp: number, index: number) => ({
    x: new Date(timestamp * 1000), // Convert to milliseconds
    open: data.o[index],
    high: data.h[index],
    low: data.l[index],
    close: data.c[index],
    volume: data.v[index]
  }));
}

/**
 * Get stock data for a specific time range
 */
export async function fetchStockData(symbol: string, timeRange: string): Promise<StockDataPoint[]> {
  const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
  let from: number;
  let resolution: string;
  
  switch (timeRange) {
    case '1D':
      // One day with 5-minute candles
      from = now - 24 * 60 * 60;
      resolution = '5';
      break;
    case '1W':
      // One week with 15-minute candles
      from = now - 7 * 24 * 60 * 60;
      resolution = '60';
      break;
    case '1M':
      // One month with daily candles
      from = now - 30 * 24 * 60 * 60;
      resolution = 'D';
      break;
    case '3M':
      // Three months with daily candles
      from = now - 90 * 24 * 60 * 60;
      resolution = 'D';
      break;
    case '1Y':
      // One year with weekly candles
      from = now - 365 * 24 * 60 * 60;
      resolution = 'W';
      break;
    case 'MAX':
      // Max (5 years) with monthly candles
      from = now - 5 * 365 * 24 * 60 * 60;
      resolution = 'M';
      break;
    default:
      // Default to 1 month
      from = now - 30 * 24 * 60 * 60;
      resolution = 'D';
  }
  
  return await getCandles(symbol, resolution, from, now);
}

/**
 * Connect to Finnhub WebSocket for real-time trade data
 */
export function connectWebSocket(): void {
  if (websocket) return;
  
  websocket = new WebSocket(`wss://ws.finnhub.io?token=${API_KEY}`);
  
  websocket.onopen = () => {
    console.log('Connected to Finnhub WebSocket');
    
    // Re-subscribe to previously subscribed symbols
    subscribedSymbols.forEach(symbol => {
      if (websocket) {
        websocket.send(JSON.stringify({ type: 'subscribe', symbol }));
      }
    });
  };
  
  websocket.onmessage = (event) => {
    const message: FinnhubWebSocketMessage = JSON.parse(event.data);
    
    if (message.type === 'trade') {
      // Process trade data
      message.data.forEach(trade => {
        const symbol = trade.s;
        const symbolHandlers = handlers.get(symbol);
        
        if (symbolHandlers) {
          symbolHandlers.forEach(handler => handler(message));
        }
      });
    }
  };
  
  websocket.onclose = () => {
    console.log('Disconnected from Finnhub WebSocket');
    websocket = null;
    
    // Reconnect after a delay
    setTimeout(() => {
      connectWebSocket();
    }, 5000);
  };
  
  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
    websocket?.close();
  };
}

/**
 * Subscribe to real-time trade data for a symbol
 */
export function subscribeToSymbol(symbol: string, handler: WebSocketHandler): void {
  // Initialize handlers set for this symbol if it doesn't exist
  if (!handlers.has(symbol)) {
    handlers.set(symbol, new Set());
  }
  
  // Add handler for this symbol
  handlers.get(symbol)?.add(handler);
  
  // Track subscribed symbols
  subscribedSymbols.add(symbol);
  
  // Send subscription message if WebSocket is connected
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({ type: 'subscribe', symbol }));
  } else {
    // Connect if not already connected
    connectWebSocket();
  }
}

/**
 * Unsubscribe from real-time trade data for a symbol
 */
export function unsubscribeFromSymbol(symbol: string, handler?: WebSocketHandler): void {
  if (handler) {
    // Remove specific handler
    handlers.get(symbol)?.delete(handler);
    
    // If no more handlers for this symbol, unsubscribe
    if (handlers.get(symbol)?.size === 0) {
      handlers.delete(symbol);
      subscribedSymbols.delete(symbol);
      
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type: 'unsubscribe', symbol }));
      }
    }
  } else {
    // Remove all handlers for this symbol
    handlers.delete(symbol);
    subscribedSymbols.delete(symbol);
    
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({ type: 'unsubscribe', symbol }));
    }
  }
}

/**
 * Close WebSocket connection
 */
export function disconnectWebSocket(): void {
  if (websocket) {
    websocket.close();
    websocket = null;
  }
}

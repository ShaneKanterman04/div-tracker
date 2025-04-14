import React, { useEffect, useState } from "react";
import { 
  VictoryChart, 
  VictoryLine,
  VictoryAxis, 
  VictoryTheme,
  VictoryTooltip,
  VictoryVoronoiContainer
} from "victory";
import { fetchStockData, PortfolioDataPoint } from "../services/alpacaApi";

interface PortfolioChartProps {
  ticker: string;
  timeRange?: string;
  title?: string;
  height?: number;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ 
  ticker,
  timeRange = '1M',
  title,
  height = 300
}) => {
  const [data, setData] = useState<PortfolioDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Generate title if not provided
  const chartTitle = title || `${ticker?.toUpperCase() || 'No Ticker'} (${timeRange})`;
  const isIntraday = timeRange === '1D';
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Validate ticker is provided before attempting to fetch data
        if (!ticker) {
          setError("No ticker symbol provided");
          setLoading(false);
          return;
        }
        
        setLoading(true);
        setError(null);
        const stockData = await fetchStockData(ticker, timeRange);
        setData(stockData);
      } catch (err) {
        console.error("Error loading stock data:", err);
        setError(`Failed to load data for ${ticker}: ${err instanceof Error ? err.message : String(err)}`);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [ticker, timeRange]);
  
  // Transform data for line chart (explicitly using close prices)
  const lineData = data.map(point => {
    // Ensure x is a proper Date object
    const xDate = point.x instanceof Date ? point.x : new Date(point.x);
    
    // Log any invalid dates
    if (isNaN(xDate.getTime())) {
      console.error("Invalid date in chart data:", point.x);
    }
    
    // Use closing price for the y-value
    const closePrice = point.close;
    
    return {
      x: xDate,
      y: closePrice // Explicitly using close price for data points
    };
  });

  // Log sample of closing prices being used
  if (lineData.length > 0) {
    console.log("Sample closing prices:", {
      first: `${lineData[0].x.toLocaleDateString()}: $${lineData[0].y}`,
      last: `${lineData[lineData.length-1].x.toLocaleDateString()}: $${lineData[lineData.length-1].y}`,
      count: lineData.length
    });
  }

  // Ensure data is sorted chronologically
  lineData.sort((a, b) => a.x.getTime() - b.x.getTime());

  // Log the data range for debugging
  if (lineData.length > 0) {
    console.log("Chart data range:", {
      start: lineData[0].x.toLocaleString(),
      end: lineData[lineData.length-1].x.toLocaleString(),
      points: lineData.length
    });
  }
  
  // Determine tick formatting and count based on the time range
  let tickCount = 7; // default
  let tickFormat: (t: any) => string;
  
  if (timeRange === '1D') {
    // For 1D view, format as hours
    tickCount = 7;
    tickFormat = (t) => {
      const date = new Date(t);
      let hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12
      return `${hours}${ampm}`;
    };
  } else if (timeRange === '1W') {
    // For 1W view, show day names
    tickCount = 5;
    tickFormat = (t) => {
      const date = new Date(t);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[date.getDay()];
    };
  } else if (timeRange === '1M') {
    // For 1M view, show day and month
    tickCount = 6;
    tickFormat = (t) => {
      const date = new Date(t);
      return `${date.getMonth()+1}/${date.getDate()}`;
    };
  } else if (timeRange === '3M') {
    // For 3M view, show month/day but fewer ticks
    tickCount = 6;
    tickFormat = (t) => {
      const date = new Date(t);
      return `${date.getMonth()+1}/${date.getDate()}`;
    };
  } else if (timeRange === '1Y') {
    // For 1Y view, show abbreviated months
    tickCount = 6;
    tickFormat = (t) => {
      const date = new Date(t);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[date.getMonth()];
    };
  } else if (timeRange === 'MAX') {
    // For MAX view, show month and year
    tickCount = 6;
    tickFormat = (t) => {
      const date = new Date(t);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };
  } else {
    // Default format
    tickCount = 5;
    tickFormat = (t) => {
      const date = new Date(t);
      return `${date.getMonth()+1}/${date.getDate()}`;
    };
  }

  // Calculate y-axis min and max for better scaling
  const calculateDomain = () => {
    if (data.length === 0) return { y: [0, 10] };
    
    const values = data.map(point => point.close);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1; // 10% padding above and below
    
    // If we have data, return explicit x domain to ensure full width rendering
    if (lineData.length > 0) {
      return {
        y: [Math.max(0, min - padding), max + padding],
        x: [lineData[0].x, lineData[lineData.length-1].x]
      };
    }
    
    return {
      y: [Math.max(0, min - padding), max + padding]
    };
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-medium text-white mb-2">{chartTitle}</h3>
      
      {!ticker && (
        <div className="flex justify-center items-center h-40 text-yellow-400">
          Please provide a ticker symbol
        </div>
      )}

      {loading && ticker && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="flex justify-center items-center h-40 text-red-400">
          {error}
        </div>
      )}
      
      {!loading && !error && data.length === 0 && (
        <div className="flex justify-center items-center h-40 text-gray-500">
          No data available for this ticker
        </div>
      )}
      
      {!loading && !error && data.length > 0 && (
        <VictoryChart 
          theme={VictoryTheme.material}
          height={height}
          padding={{ top: 30, bottom: 50, left: 50, right: 10 }}
          scale={{ x: "time" }}
          domainPadding={{ x: 0, y: 20 }}
          domain={calculateDomain()}
          containerComponent={
            <VictoryVoronoiContainer
              voronoiDimension="x"
              labels={({ datum }) => {
                const date = new Date(datum.x);
                const dateStr = `${date.getMonth()+1}/${date.getDate()}`;
                
                const formattedValue = datum.y.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
                
                return `${dateStr}: ${formattedValue}`;
              }}
              labelComponent={
                <VictoryTooltip
                  flyoutStyle={{
                    fill: "rgba(33, 33, 33, 0.92)",
                    stroke: "#aaa",
                    strokeWidth: 1,
                    zIndex: 999
                  }}
                  style={{ 
                    fontSize: 10, 
                    fill: "white",
                    fontWeight: 500
                  }}
                  flyoutPadding={{ top: 4, bottom: 4, left: 8, right: 8 }}
                  cornerRadius={3}
                  pointerLength={5}
                  constrainToVisibleArea={true}
                  dy={-10} // Move tooltip upward
                />
              }
            />
          }
        >
          <VictoryAxis 
            tickCount={tickCount}
            tickFormat={tickFormat}
            style={{
              tickLabels: { 
                fill: "white", 
                fontSize: isIntraday ? 7 : 8,
                angle: timeRange === '1Y' || timeRange === 'MAX' ? -45 : 0,
                textAnchor: timeRange === '1Y' || timeRange === 'MAX' ? "end" : "middle"
              },
              axis: { stroke: "white" },
              grid: { stroke: "transparent" }
            }}
          />
          <VictoryAxis 
            dependentAxis
            tickFormat={(t) => `$${Math.round(t).toLocaleString()}`}
            tickCount={5}
            style={{
              tickLabels: { fill: "white", fontSize: 8 },
              axis: { stroke: "white" },
              grid: { stroke: "transparent" }
            }}
          />
          <VictoryLine
            data={lineData}
            style={{
              data: { 
                stroke: "#3b82f6",
                strokeWidth: 2
              }
            }}
            animate={{
              duration: 300,
              onLoad: { duration: 300 }
            }}
          />
        </VictoryChart>
      )}
    </div>
  );
};

export default PortfolioChart;

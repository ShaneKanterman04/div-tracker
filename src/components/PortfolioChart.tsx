import React from "react";
import { 
  VictoryChart, 
  VictoryLine,
  VictoryAxis, 
  VictoryTheme,
  VictoryTooltip,
  VictoryVoronoiContainer
} from "victory";

interface PortfolioDataPoint {
  x: Date;
  open: number;
  close: number;
  high: number;
  low: number;
}

interface PortfolioChartProps {
  data: PortfolioDataPoint[];
  title?: string;
  height?: number;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ 
  data, 
  title = "Portfolio Value (Last 30 Days)",
  height = 300
}) => {
  // Extract ticker symbol and time range from title for display
  const parts = title.split(' ');
  const tickerSymbol = parts[0];
  const isIntraday = title.includes('1D');
  
  // Transform data for line chart (using close prices)
  const lineData = data.map(point => ({
    x: point.x,
    y: point.close
  }));
  
  // Determine tick formatting and count based on the time range
  let tickCount = 7; // default
  let tickFormat: (t: any) => string;
  
  if (isIntraday) {
    // For 1D view, format as hours and show more ticks to cover 7am-7pm
    tickCount = 13; // One tick per hour from 7am to 7pm
    tickFormat = (t) => {
      const date = new Date(t);
      let hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12
      return `${hours}${ampm}`;
    };
  } else if (title.includes('1W')) {
    tickCount = 7;
    tickFormat = (t) => {
      const date = new Date(t);
      return `${date.getMonth()+1}/${date.getDate()}`;
    };
  } else if (title.includes('MAX') || title.includes('1Y')) {
    tickCount = 12;
    tickFormat = (t) => {
      const date = new Date(t);
      return `${date.getMonth()+1}/${date.getDate()}`;
    };
  } else {
    tickCount = 7;
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
    
    return {
      y: [Math.max(0, min - padding), max + padding]
    };
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <VictoryChart 
        theme={VictoryTheme.material}
        height={height}
        padding={{ top: 30, bottom: 50, left: 70, right: 30 }} // Increased padding
        scale={{ x: "time" }}
        domainPadding={{ x: isIntraday ? 20 : 40, y: 20 }} // Increased padding for "zoomed out" effect
        domain={calculateDomain()}
        containerComponent={
          <VictoryVoronoiContainer
            voronoiDimension="x"
            labels={({ datum }) => {
              const date = new Date(datum.x);
              let dateStr;
              
              if (isIntraday) {
                // Format as hours:minutes AM/PM
                let hours = date.getHours();
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // Convert 0 to 12
                dateStr = `${hours}:${minutes} ${ampm}`;
              } else {
                // Format as month/day
                dateStr = `${date.getMonth()+1}/${date.getDate()}`;
              }
              
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
                  strokeWidth: 1
                }}
                style={{ 
                  fontSize: 9, 
                  fill: "white",
                  fontWeight: 300
                }}
                flyoutPadding={{ top: 4, bottom: 4, left: 8, right: 8 }}
                cornerRadius={3}
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
              angle: isIntraday ? -45 : 0, // Rotate intraday labels to avoid overlap
              textAnchor: isIntraday ? "end" : "middle"
            },
            axis: { stroke: "white" },
            grid: { stroke: "transparent" } // Remove dashed grid lines
          }}
        />
        <VictoryAxis 
          dependentAxis
          tickFormat={(t) => `$${Math.round(t).toLocaleString()}`}
          tickCount={5} // Ensure reasonable number of ticks
          style={{
            tickLabels: { fill: "white", fontSize: 8 },
            axis: { stroke: "white" },
            grid: { stroke: "transparent" } // Remove dashed grid lines
          }}
        />
        <VictoryLine
          data={lineData}
          style={{
            data: { 
              stroke: "#3b82f6", // Blue line
              strokeWidth: 2
            }
          }}
          animate={{
            duration: 300, // Reduced for faster rendering
            onLoad: { duration: 300 }
          }}
        />
      </VictoryChart>
      
      {data.length === 0 && (
        <div className="flex justify-center items-center h-40 text-gray-500">
          No data available for this ticker
        </div>
      )}
    </div>
  );
};

export default PortfolioChart;

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { InflationResult } from '@/utils/inflation';

interface InflationChartProps {
  data: InflationResult[];
  isDemo: boolean;
}

const InflationChart = ({ data, isDemo }: InflationChartProps) => {
  // Filter data to only show YoY values (skip first 12 months)
  const chartData = data
    .filter(d => d.personalYoY !== null && d.swedishYoY !== null)
    .map(d => ({
      date: (() => {
        const [year, month] = d.date.split('-');
        const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(month)]} ${year}`;
      })(),
      personal: d.personalYoY,
      swedish: d.swedishYoY,
      rawDate: d.date
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-4 rounded-lg shadow-lg border border-border">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value?.toFixed(1)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="bg-card p-6 rounded-xl shadow-soft border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">12-Month Inflation Comparison</h3>
          {isDemo && (
            <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm border border-yellow-200">
              Demo Data
            </div>
          )}
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="personal" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Your Inflation"
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="swedish" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Sweden CPI"
                dot={{ fill: "hsl(var(--muted-foreground))", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: "hsl(var(--muted-foreground))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          Data source: SCB (COICOP 2020=100) • Last 24 months
        </div>
      </div>
    </div>
  );
};

export default InflationChart;
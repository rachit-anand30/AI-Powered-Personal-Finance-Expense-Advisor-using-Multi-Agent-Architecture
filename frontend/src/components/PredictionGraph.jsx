import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const PredictionGraph = ({ data, income }) => {
  if (!data || !data.historical) return <div className="text-gray-400">No prediction data available</div>;

  // Prepare data for the chart
  const chartData = [...data.historical.map(item => ({
    name: item.month,
    Actual: item.amount,
    Predicted: null
  }))];

  // Add the prediction for the next month
  // Assuming the next month is just 'Next' for demo purposes
  const lastHistoricalAmount = data.historical[data.historical.length - 1]?.amount || 0;
  
  chartData.push({
    name: 'Next Month',
    Actual: null,
    Predicted: data.next_month_prediction
  });

  // To draw a continuous line, we need a bridging point
  // We'll update the last historical point to also have a Predicted value equal to its Actual value
  if (chartData.length > 1) {
    chartData[chartData.length - 2].Predicted = chartData[chartData.length - 2].Actual;
  }

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return <TrendingUp className="text-red-500 mr-2" size={20} />;
    if (trend === 'decreasing') return <TrendingDown className="text-green-500 mr-2" size={20} />;
    return <Minus className="text-gray-400 mr-2" size={20} />;
  };

  const getTrendText = (trend) => {
    if (trend === 'increasing') return 'Expenses are trending UP';
    if (trend === 'decreasing') return 'Expenses are trending DOWN';
    return 'Expenses are STABLE';
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Expense Prediction</h2>
          <div className="flex items-center text-sm">
            {getTrendIcon(data.trend)}
            <span className="text-gray-300">{getTrendText(data.trend)}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400 mb-1">Next Month Forecast</p>
          <p className="text-2xl font-bold text-purple-400">₹{data.next_month_prediction?.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex-grow h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickMargin={10} />
            <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `₹${value/1000}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
              formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
            
            {income && (
              <ReferenceLine y={income} label={{ position: 'top', value: 'Income', fill: '#10b981', fontSize: 12 }} stroke="#10b981" strokeDasharray="3 3" />
            )}
            
            <Line 
              type="monotone" 
              dataKey="Actual" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#111827' }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Predicted" 
              stroke="#a855f7" 
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: '#a855f7', strokeWidth: 2, stroke: '#111827' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PredictionGraph;

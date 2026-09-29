import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
  Food: '#f97316', // orange-500
  Transport: '#3b82f6', // blue-500
  Utilities: '#eab308', // yellow-500
  Entertainment: '#ec4899', // pink-500
  Healthcare: '#10b981', // green-500
  Housing: '#8b5cf6', // purple-500
  Shopping: '#ef4444', // red-500
  Savings: '#06b6d4', // cyan-500
  Other: '#6b7280' // gray-500
};

const ExpenseChart = ({ categories }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  if (!categories || Object.keys(categories).length === 0) {
    return <div className="text-gray-400 flex justify-center items-center h-64">No expense data available</div>;
  }

  const data = Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl">
          <p className="font-semibold text-white mb-1">{data.name}</p>
          <p className="text-gray-300">Amount: <span className="font-medium text-white">₹{data.value.toLocaleString()}</span></p>
          <p className="text-gray-400 text-sm">Percentage: {percent}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-white mb-6">Expense Breakdown</h2>
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name] || COLORS.Other} 
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                  className="transition-opacity duration-300 outline-none"
                />
              ))}
            </Pie>
            <Tooltip content={renderCustomTooltip} />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value, entry) => (
                <span className="text-gray-300 text-sm font-medium mr-2">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenseChart;

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const BudgetAllocation = ({ plan }) => {
  if (!plan || !plan.limits) return <div className="text-gray-400">No budget data available</div>;

  // Transform data for the bar chart
  const data = Object.keys(plan.limits).map(category => {
    // We need actual spending to compare, but plan only has limits and rule breakdown.
    // Assuming we have to mock the actual for the chart or it comes in 'actual_by_category'
    // Let's create a realistic mock based on limits if actuals per category aren't in plan
    
    // In our DEMO data, we don't have actuals per category in budget_plan, 
    // so we'll just display limits for now, or you could pass actuals as a prop.
    // For a complete visualization, let's assume we want to show just the limits if actuals aren't available
    return {
      name: category,
      Limit: plan.limits[category],
    };
  });

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-white mb-6">Budget Allocations</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 text-center">
          <p className="text-xs text-gray-400 mb-1">Needs (50%)</p>
          <p className="text-lg font-bold text-blue-400">₹{plan.rule_50_30_20?.needs?.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 text-center">
          <p className="text-xs text-gray-400 mb-1">Wants (30%)</p>
          <p className="text-lg font-bold text-purple-400">₹{plan.rule_50_30_20?.wants?.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 text-center">
          <p className="text-xs text-gray-400 mb-1">Savings (20%)</p>
          <p className="text-lg font-bold text-green-400">₹{plan.rule_50_30_20?.savings?.toLocaleString()}</p>
        </div>
      </div>

      <div className="h-[250px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af" 
              fontSize={12} 
              tickMargin={10}
              angle={-45}
              textAnchor="end"
            />
            <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `₹${value/1000}k`} />
            <Tooltip 
              cursor={{fill: '#374151', opacity: 0.4}}
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value) => [`₹${value.toLocaleString()}`, 'Budget Limit']}
            />
            <Bar dataKey="Limit" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BudgetAllocation;

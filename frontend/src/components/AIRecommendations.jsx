import React from 'react';
import { Lightbulb, AlertCircle, CheckCircle, Info, Sparkles } from 'lucide-react';

const AIRecommendations = ({ advice }) => {
  if (!advice || !advice.recommendations) {
    return <div className="text-gray-400">No AI recommendations available</div>;
  }

  const getUrgencyStyles = (urgency) => {
    switch (urgency) {
      case 'red':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          iconColor: 'text-red-500',
          Icon: AlertCircle
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          iconColor: 'text-yellow-500',
          Icon: Info
        };
      case 'green':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          iconColor: 'text-green-500',
          Icon: CheckCircle
        };
      default:
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          iconColor: 'text-blue-500',
          Icon: Lightbulb
        };
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
          <Sparkles className="text-white" size={24} />
        </div>
        <h2 className="text-xl font-bold text-white">AI Financial Advisor</h2>
      </div>

      {advice.summary && (
        <div className="bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-600">
          <p className="text-gray-200 text-sm italic leading-relaxed">"{advice.summary}"</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {advice.recommendations.map((rec, index) => {
          const styles = getUrgencyStyles(rec.urgency);
          const Icon = styles.Icon;

          return (
            <div 
              key={index} 
              className={`p-4 rounded-xl border ${styles.bg} ${styles.border} flex items-start gap-4 transition-transform hover:scale-[1.02]`}
            >
              <div className="mt-1 flex-shrink-0">
                <Icon className={styles.iconColor} size={24} />
              </div>
              
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white text-base pr-2">{index + 1}. {rec.title}</h4>
                  {rec.impact_amount > 0 && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${styles.iconColor} bg-gray-800 border border-gray-700`}>
                      Impact: ₹{rec.impact_amount.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {rec.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIRecommendations;

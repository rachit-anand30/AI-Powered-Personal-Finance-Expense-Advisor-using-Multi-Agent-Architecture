import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

const AnomalyAlerts = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="w-full h-full flex flex-col">
        <h2 className="text-xl font-bold text-white mb-6">Fraud & Anomaly Alerts</h2>
        <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-green-900/20 border border-green-500/30 rounded-lg">
          <div className="bg-green-500/20 p-4 rounded-full mb-4">
            <CheckCircle className="text-green-500" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-green-400 mb-2">All Clear!</h3>
          <p className="text-gray-400 text-sm">No unusual spending patterns or fraudulent transactions detected in your recent history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Fraud & Anomaly Alerts</h2>
        <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-full border border-red-500/30">
          {alerts.length} Detected
        </span>
      </div>
      
      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {alerts.map((alert, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border ${
              alert.alert_type === 'High Risk' 
                ? 'bg-red-900/20 border-red-500/50' 
                : 'bg-yellow-900/20 border-yellow-500/50'
            } relative overflow-hidden`}
          >
            {/* Pulsing indicator for high risk */}
            {alert.alert_type === 'High Risk' && (
              <div className="absolute top-0 right-0 w-2 h-full bg-red-500 animate-pulse"></div>
            )}
            
            <div className="flex items-start">
              <div className={`p-2 rounded-full mr-3 shrink-0 ${
                alert.alert_type === 'High Risk' ? 'bg-red-500/20' : 'bg-yellow-500/20'
              }`}>
                {alert.alert_type === 'High Risk' ? (
                  <AlertTriangle className="text-red-500" size={20} />
                ) : (
                  <Info className="text-yellow-500" size={20} />
                )}
              </div>
              
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`font-semibold ${
                    alert.alert_type === 'High Risk' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {alert.description}
                  </h4>
                  <span className="font-bold text-white">₹{alert.amount.toLocaleString()}</span>
                </div>
                
                <p className="text-sm text-gray-300 mb-2">
                  Unusual transaction detected. Amount is significantly higher than your typical spending in this category.
                </p>
                
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    alert.alert_type === 'High Risk' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {alert.alert_type}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                    Z-Score: {alert.z_score.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnomalyAlerts;

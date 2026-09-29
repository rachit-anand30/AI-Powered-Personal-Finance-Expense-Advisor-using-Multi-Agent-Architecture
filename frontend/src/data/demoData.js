export const DEMO_INCOME = 50000;

export const DEMO_TRANSACTIONS = [
  { date: '2023-10-01', description: 'Grocery', amount: 2500, category: 'Food' },
  { date: '2023-10-03', description: 'Uber', amount: 500, category: 'Transport' },
  { date: '2023-10-05', description: 'Electricity Bill', amount: 1200, category: 'Utilities' },
  { date: '2023-10-10', description: 'Movie', amount: 800, category: 'Entertainment' },
  { date: '2023-10-15', description: 'Medicines', amount: 600, category: 'Healthcare' },
  { date: '2023-10-20', description: 'EMI', amount: 15000, category: 'Housing' },
  { date: '2023-10-25', description: 'Shopping', amount: 3000, category: 'Shopping' },
  { date: '2023-10-28', description: 'Mutual Fund', amount: 5000, category: 'Savings' },
  { date: '2023-11-02', description: 'Grocery', amount: 2800, category: 'Food' },
  { date: '2023-11-05', description: 'Uber', amount: 600, category: 'Transport' },
  { date: '2023-11-08', description: 'Water Bill', amount: 400, category: 'Utilities' },
  { date: '2023-11-12', description: 'Netflix', amount: 650, category: 'Entertainment' },
  { date: '2023-11-18', description: 'Doctor Visit', amount: 1000, category: 'Healthcare' },
  { date: '2023-11-22', description: 'Rent', amount: 12000, category: 'Housing' },
  { date: '2023-11-26', description: 'Luxury Watch', amount: 75000, category: 'Shopping' }, // Anomaly
  { date: '2023-11-29', description: 'Stock Market', amount: 4000, category: 'Savings' },
];

export const DEMO_ANALYSIS_RESULT = {
  expense_analysis: {
    total_expenses: 125050,
    categories: {
      Food: 5300,
      Transport: 1100,
      Utilities: 1600,
      Entertainment: 1450,
      Healthcare: 1600,
      Housing: 27000,
      Shopping: 78000,
      Savings: 9000
    },
    budget_health_score: 45
  },
  anomaly_detection: {
    anomalies: [
      {
        description: 'Luxury Watch',
        amount: 75000,
        z_score: 4.5,
        alert_type: 'High Risk'
      }
    ]
  },
  budget_plan: {
    rule_50_30_20: {
      needs: 25000,
      wants: 15000,
      savings: 10000
    },
    actual: {
      needs: 35300,
      wants: 80550,
      savings: 9000
    },
    limits: {
      Food: 5000,
      Transport: 2000,
      Utilities: 2000,
      Entertainment: 3000,
      Healthcare: 2000,
      Housing: 15000,
      Shopping: 5000
    },
    saving_tips: [
      "Cut down on high shopping expenses.",
      "Consider carpooling to save on transport."
    ]
  },
  prediction: {
    historical: [
      { month: 'Oct', amount: 28600 },
      { month: 'Nov', amount: 96450 }
    ],
    next_month_prediction: 45000,
    trend: 'increasing'
  },
  advice: {
    recommendations: [
      {
        title: 'High Shopping Expense Detected',
        description: 'You spent ₹75,000 on shopping, which is unusually high. Consider returning items if possible or drastically reducing shopping for the next few months.',
        impact_amount: 75000,
        urgency: 'red'
      },
      {
        title: 'Needs Exceeding Budget',
        description: 'Your expenses on Needs (Food, Housing, etc.) are exceeding the 50% rule limit. Review your fixed costs.',
        impact_amount: 10300,
        urgency: 'yellow'
      },
      {
        title: 'Savings Deficit',
        description: 'You are slightly behind on your 20% savings goal. Try to save ₹1,000 more next month.',
        impact_amount: 1000,
        urgency: 'yellow'
      },
      {
        title: 'Entertainment is well managed',
        description: 'Great job keeping entertainment costs within budget!',
        impact_amount: 0,
        urgency: 'green'
      }
    ],
    summary: 'Your financial health needs immediate attention due to a recent large expenditure. Realigning with the 50-30-20 rule is crucial for next month.'
  }
};

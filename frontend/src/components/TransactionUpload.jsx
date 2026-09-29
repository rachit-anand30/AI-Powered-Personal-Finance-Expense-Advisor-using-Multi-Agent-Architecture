import React, { useState } from 'react';
import { Upload, Plus, Trash2, Database } from 'lucide-react';

const TransactionUpload = ({ onAnalyze, initialTransactions = [], initialIncome = 0 }) => {
  const [mode, setMode] = useState('manual'); // 'manual' or 'json'
  const [transactions, setTransactions] = useState(initialTransactions);
  const [income, setIncome] = useState(initialIncome);
  const [jsonInput, setJsonInput] = useState(JSON.stringify(initialTransactions, null, 2));
  
  // Manual entry state
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');

  const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Housing', 'Shopping', 'Savings', 'Other'];

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!date || !description || !amount) return;

    const newTxn = {
      date,
      description,
      amount: Number(amount),
      category
    };

    const updatedTxns = [...transactions, newTxn];
    setTransactions(updatedTxns);
    setJsonInput(JSON.stringify(updatedTxns, null, 2));
    
    // Reset form
    setDescription('');
    setAmount('');
  };

  const handleRemoveTransaction = (index) => {
    const updatedTxns = transactions.filter((_, i) => i !== index);
    setTransactions(updatedTxns);
    setJsonInput(JSON.stringify(updatedTxns, null, 2));
  };

  const handleJsonUpdate = (e) => {
    const val = e.target.value;
    setJsonInput(val);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        setTransactions(parsed);
      }
    } catch (err) {
      // Invalid JSON, just ignore until valid
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Financial Data Setup</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">Monthly Income (₹)</label>
          <input 
            type="number" 
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="w-full md:w-1/3 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm transition-colors ${mode === 'manual' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setMode('manual')}
          >
            Manual Entry
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm transition-colors ${mode === 'json' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setMode('json')}
          >
            JSON Upload
          </button>
        </div>

        {mode === 'manual' ? (
          <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 bg-gray-900 p-4 rounded-lg border border-gray-700">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <input type="text" required placeholder="e.g. Uber" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Amount (₹)</label>
              <input type="number" required placeholder="e.g. 500" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Plus size={16} /> Add
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6">
            <label className="block text-xs text-gray-400 mb-2">Paste JSON Array of Transactions</label>
            <textarea
              value={jsonInput}
              onChange={handleJsonUpdate}
              className="w-full h-48 bg-gray-900 border border-gray-600 rounded-lg p-4 text-sm text-green-400 font-mono focus:outline-none focus:border-purple-500"
              placeholder="[{...}]"
            />
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-white">Transactions ({transactions.length})</h3>
            <span className="text-sm text-gray-400">Total: ₹{transactions.reduce((s, t) => s + t.amount, 0).toLocaleString()}</span>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-h-60 overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No transactions added yet</div>
            ) : (
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="px-4 py-2">{txn.date}</td>
                      <td className="px-4 py-2">{txn.description}</td>
                      <td className="px-4 py-2"><span className="bg-gray-700 px-2 py-1 rounded text-xs">{txn.category}</span></td>
                      <td className="px-4 py-2 text-right text-white font-medium">₹{txn.amount.toLocaleString()}</td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => handleRemoveTransaction(idx)} className="text-red-400 hover:text-red-300 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => onAnalyze(transactions, income)}
            disabled={transactions.length === 0 || income <= 0}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Database size={20} />
            Analyze Data with AI
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionUpload;

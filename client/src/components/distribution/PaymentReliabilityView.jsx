import React, { useState, useEffect } from 'react';
import {
  Award, TrendingUp, AlertTriangle, CheckCircle, RefreshCw,
  Search, Shield, Info, ArrowUpRight
} from 'lucide-react';
import api from '../../services/api';

export default function PaymentReliabilityView() {
  const [scores, setScores] = useState([]);
  const [selectedScore, setSelectedScore] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('');

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    setLoading(true);
    try {
      const res = await api.distribution.getReliabilityScores();
      if (res.success) setScores(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (scoreObj) => {
    setSelectedScore(scoreObj);
    try {
      const res = await api.distribution.getUserReliability(scoreObj.userId);
      if (res.success) {
        setScoreHistory(res.data.history || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = scores.filter((s) => {
    const term = search.toLowerCase();
    const matchSearch =
      (s.fullName && s.fullName.toLowerCase().includes(term)) ||
      (s.businessName && s.businessName.toLowerCase().includes(term)) ||
      (s.userId && s.userId.toLowerCase().includes(term));
    const matchTier = !selectedTier || s.ratingTier === selectedTier;
    return matchSearch && matchTier;
  });

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Excellent':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Fair':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Poor':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-xl p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Automated Credit & Settlement Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold">Distributor Payment Reliability Engine</h1>
            <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
              Real-time automated evaluation algorithm: 70% weight on on-time payment ratio, 20% on payment frequency consistency, and 10% penalty deduction for overdue invoices. New accounts start as 'Not Yet Rated'.
            </p>
          </div>
          <button
            onClick={fetchScores}
            className="p-2 text-indigo-200 hover:text-white rounded-lg bg-indigo-700/50 hover:bg-indigo-700 transition"
            title="Refresh Scores"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search distributor name, company, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="text-xs font-medium text-gray-500">Tier:</span>
          {['ALL', 'Excellent', 'Good', 'Fair', 'Poor', 'Not Yet Rated'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t === 'ALL' ? '' : t)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                (t === 'ALL' && !selectedTier) || selectedTier === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Score List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Distributor</th>
                  <th className="py-3 px-4">Territory</th>
                  <th className="py-3 px-4 text-center">Score (0-100)</th>
                  <th className="py-3 px-4 text-center">Rating Tier</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-400">
                      No reliability score records match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => handleSelectUser(s)}
                      className={`cursor-pointer hover:bg-indigo-50/40 transition ${
                        selectedScore?.id === s.id ? 'bg-indigo-50/70' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{s.fullName}</div>
                        <div className="text-xs text-gray-500">{s.businessName || s.userId}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        {s.stateName && <div>{s.stateName}</div>}
                        {s.districtName && <div className="text-gray-400">{s.districtName}</div>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="text-base font-bold text-gray-900">{s.overallScore}</div>
                        <div className="w-16 bg-gray-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full ${
                              s.overallScore >= 85
                                ? 'bg-emerald-500'
                                : s.overallScore >= 70
                                ? 'bg-blue-500'
                                : s.overallScore >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${s.overallScore}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getTierColor(
                            s.ratingTier
                          )}`}
                        >
                          {s.ratingTier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectUser(s);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Score Inspector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">
            Score Breakdown & History
          </h3>

          {!selectedScore ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              Select any distributor from the table on the left to view detailed score mathematics and audit history.
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-900">{selectedScore.fullName}</div>
                  <div className="text-xs text-gray-500">{selectedScore.businessName || selectedScore.userId}</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-indigo-700">{selectedScore.overallScore}</div>
                  <span
                    className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full border ${getTierColor(
                      selectedScore.ratingTier
                    )}`}
                  >
                    {selectedScore.ratingTier}
                  </span>
                </div>
              </div>

              {/* Mathematical Weight Breakdown */}
              <div className="p-3 bg-gray-50 rounded-xl space-y-2 text-xs border border-gray-200">
                <div className="font-semibold text-gray-700 mb-1">Component Analysis:</div>
                <div className="flex justify-between">
                  <span className="text-gray-600">On-Time Ratio (70%):</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {selectedScore.onTimeRatio !== undefined ? `${selectedScore.onTimeRatio}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frequency Consistency (20%):</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {selectedScore.frequencyConsistency !== undefined
                      ? `${selectedScore.frequencyConsistency}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overdue Invoices:</span>
                  <span className="font-mono font-semibold text-rose-600">
                    {selectedScore.overdueCount || 0} overdue
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200 text-gray-500 text-[11px]">
                  <span>Last Recalculated:</span>
                  <span>
                    {selectedScore.lastCalculatedDate
                      ? new Date(selectedScore.lastCalculatedDate).toLocaleDateString()
                      : 'Just now'}
                  </span>
                </div>
              </div>

              {/* Historical Log */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Recent Score Audit Logs
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {scoreHistory.length === 0 ? (
                    <div className="text-xs text-gray-400 py-2">No historical adjustments logged yet.</div>
                  ) : (
                    scoreHistory.map((h) => (
                      <div
                        key={h.id}
                        className="text-xs p-2 bg-gray-50 rounded border border-gray-100 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-gray-800">Score: {h.score} ({h.tier})</div>
                          <div className="text-[10px] text-gray-500">{h.reason || 'Payment verification'}</div>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(h.recordedDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import {
  Award, TrendingUp, AlertTriangle, CheckCircle, RefreshCw,
  Search, Shield, Info, ArrowUpRight, Check, Star, ShieldAlert,
  Percent, Clock, BarChart3, ChevronRight, UserCheck
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
      if (res.success) {
        const data = res.data || [];
        setScores(data);
        if (data.length > 0 && !selectedScore) {
          handleSelectUser(data[0]);
        }
      }
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

  const getTierBadge = (tier) => {
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
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTierDotColor = (tier) => {
    switch (tier) {
      case 'Excellent': return 'bg-emerald-500';
      case 'Good': return 'bg-blue-500';
      case 'Fair': return 'bg-amber-500';
      case 'Poor': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  // Tier counts
  const excellentCount = scores.filter(s => s.ratingTier === 'Excellent').length;
  const goodCount = scores.filter(s => s.ratingTier === 'Good').length;
  const fairCount = scores.filter(s => s.ratingTier === 'Fair').length;
  const poorCount = scores.filter(s => s.ratingTier === 'Poor').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Analytics Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold uppercase tracking-wider mb-2 border border-indigo-400/20">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Automated Credit Intelligence & Settlement Trust Engine</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Distributor Payment Reliability Engine
            </h1>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Real-time scoring algorithm evaluating wholesale partners across three mathematical factors: 
              <span className="text-emerald-300 font-semibold"> 70% on-time ratio</span>, 
              <span className="text-blue-300 font-semibold"> 20% consistency</span>, and 
              <span className="text-rose-300 font-semibold"> 10% penalty</span> on overdue accounts.
            </p>

            {/* Quick Metrics */}
            <div className="flex items-center flex-wrap gap-4 mt-4 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{excellentCount} Excellent (90-100)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-blue-300">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>{goodCount} Good (75-89)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{fairCount} Fair (60-74)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>{poorCount} Poor (&lt;60)</span>
              </span>
            </div>
          </div>

          <button
            onClick={fetchScores}
            className="self-start md:self-auto inline-flex items-center space-x-2 px-4 py-2.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/15 backdrop-blur-xs"
            title="Recalculate Reliability Scores"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search distributor name, company, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-slate-100/80 p-1 rounded-xl flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase px-2">Tier:</span>
          {['ALL', 'Excellent', 'Good', 'Fair', 'Poor', 'Not Yet Rated'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t === 'ALL' ? '' : t)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                (t === 'ALL' && !selectedTier) || selectedTier === t
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Distributor Account</th>
                  <th className="py-3.5 px-4">Territory Assignment</th>
                  <th className="py-3.5 px-3 text-center">Score (0-100)</th>
                  <th className="py-3.5 px-3 text-center">Reliability Tier</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-400">
                      <p className="font-semibold text-slate-600">No reliability records matching search criteria.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Scores auto-generate whenever wholesale orders or invoices are cleared.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const isSelected = selectedScore?.id === s.id;
                    return (
                      <tr
                        key={s.id}
                        onClick={() => handleSelectUser(s)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-indigo-50/60 font-semibold' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{s.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {s.businessName || s.userId}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {s.stateName && <div className="font-bold text-slate-800">{s.stateName}</div>}
                          {s.districtName && <div className="text-[11px] text-slate-500">{s.districtName}</div>}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="text-base font-black text-slate-900">{s.overallScore}</div>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden border border-slate-200">
                            <div
                              className={`h-full ${
                                s.overallScore >= 90
                                  ? 'bg-emerald-500'
                                  : s.overallScore >= 75
                                  ? 'bg-blue-500'
                                  : s.overallScore >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, s.overallScore))}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getTierBadge(
                              s.ratingTier
                            )}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getTierDotColor(s.ratingTier)}`} />
                            {s.ratingTier}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectUser(s);
                            }}
                            className={`inline-flex items-center space-x-1 px-3 py-1.5 text-[11px] font-bold rounded-lg transition ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                            }`}
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Score Inspector */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Reliability Audit Inspector</span>
            </h3>
            {selectedScore && (
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                Live Rating
              </span>
            )}
          </div>

          {!selectedScore ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Info className="w-6 h-6 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600">No Account Selected</p>
              <p className="text-[11px] text-slate-400 mt-1">Select any distributor from the table to inspect score mathematics.</p>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              {/* Account summary header */}
              <div className="flex items-start justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <div className="text-base font-bold text-slate-900">{selectedScore.fullName}</div>
                  <div className="text-xs text-slate-500 font-medium">{selectedScore.businessName || selectedScore.userId}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {selectedScore.stateName} {selectedScore.districtName ? `• ${selectedScore.districtName}` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-indigo-700">{selectedScore.overallScore}</div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border mt-1 ${getTierBadge(
                      selectedScore.ratingTier
                    )}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getTierDotColor(selectedScore.ratingTier)}`} />
                    {selectedScore.ratingTier}
                  </span>
                </div>
              </div>

              {/* Mathematical Weight Breakdown */}
              <div className="p-4 bg-white rounded-xl space-y-3 text-xs border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Algorithmic Factor Breakdown:
                </div>

                {/* 1. On Time Ratio */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">On-Time Payment Ratio (70% Weight)</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {selectedScore.onTimeRatio !== undefined ? `${selectedScore.onTimeRatio}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${selectedScore.onTimeRatio || 0}%` }}
                    />
                  </div>
                </div>

                {/* 2. Frequency Consistency */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">Settlement Consistency (20% Weight)</span>
                    <span className="font-mono font-bold text-blue-700">
                      {selectedScore.frequencyConsistency !== undefined
                        ? `${selectedScore.frequencyConsistency}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${selectedScore.frequencyConsistency || 0}%` }}
                    />
                  </div>
                </div>

                {/* 3. Overdue Penalty */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-slate-600 font-medium">Overdue Invoice Penalty (10% Weight):</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                    {selectedScore.overdueCount || 0} Invoices Past Due
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-slate-400 text-[11px]">
                  <span>Last Evaluated:</span>
                  <span className="font-medium text-slate-600">
                    {selectedScore.lastCalculatedDate
                      ? new Date(selectedScore.lastCalculatedDate).toLocaleDateString()
                      : 'Real-time'}
                  </span>
                </div>
              </div>

              {/* Historical Log */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Recent Score Audit Logs
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {scoreHistory.length === 0 ? (
                    <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">
                      No historical score adjustments logged yet.
                    </div>
                  ) : (
                    scoreHistory.map((h) => (
                      <div
                        key={h.id}
                        className="text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            Score: {h.score} • <span className="text-indigo-600">{h.tier}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {h.reason || 'Wholesale payment verification'}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
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

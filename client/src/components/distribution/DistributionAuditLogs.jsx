import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Filter, RefreshCw, Calendar, Clock, User, Globe,
  ShieldAlert, Eye, X, Terminal, ArrowRight, CheckCircle2, History
} from 'lucide-react';
import api from '../../services/api';

export default function DistributionAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedAction) params.actionType = selectedAction;
      const res = await api.distribution.getAuditLogs(params);
      if (res.success) setLogs(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase();
    const actionMatch = log.actionType?.toLowerCase().includes(term);
    const userMatch = log.performedByName?.toLowerCase().includes(term);
    const detailMatch = typeof log.details === 'string' && log.details.toLowerCase().includes(term);
    return actionMatch || userMatch || detailMatch;
  });

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE_ACCOUNT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'UPDATE_STATUS':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'RESET_PASSWORD':
      case 'CHANGE_PASSWORD':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'TRANSFER_TERRITORY':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RECORD_PAYMENT':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'CREATE_INVOICE':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Filter Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Immutable Governance & Activity Log</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>System Distribution Audit Trail</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Cryptographically timestamped activity trail tracking account provisions, territory reassignments, credential resets, status adjustments, and wholesale payment verifications.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={fetchLogs}
              className="p-2.5 text-slate-600 hover:text-blue-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              title="Refresh Audit Trail"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by admin, action, or metadata..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setTimeout(fetchLogs, 50);
              }}
              className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Action Types ({logs.length})</option>
              <option value="CREATE_ACCOUNT">CREATE_ACCOUNT</option>
              <option value="UPDATE_STATUS">UPDATE_STATUS</option>
              <option value="RESET_PASSWORD">RESET_PASSWORD</option>
              <option value="TRANSFER_TERRITORY">TRANSFER_TERRITORY</option>
              <option value="RECORD_PAYMENT">RECORD_PAYMENT</option>
              <option value="CREATE_INVOICE">CREATE_INVOICE</option>
              <option value="CHANGE_PASSWORD">CHANGE_PASSWORD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">Executed By</th>
                <th className="py-3.5 px-4">Audit Payload / Summary</th>
                <th className="py-3.5 px-3 text-center">Remote IP</th>
                <th className="py-3.5 px-4 text-right">Timestamp (IST)</th>
                <th className="py-3.5 px-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">No audit records found.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Actions performed across the distribution network are recorded automatically.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let formattedDetails = '';
                  try {
                    formattedDetails =
                      typeof log.details === 'object'
                        ? JSON.stringify(log.details)
                        : log.details || '-';
                  } catch (e) {
                    formattedDetails = String(log.details);
                  }

                  return (
                    <tr key={log.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getActionBadge(
                          log.actionType
                        )}`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-700">
                        {log.entityType} #{log.entityId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {log.performedByName || `User #${log.performedByUserId}`}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">Administrator</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs md:max-w-md truncate font-mono text-[11px]" title={formattedDetails}>
                        {formattedDetails}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100">
                          {log.ipAddress || '127.0.0.1'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                        {new Date(log.createdDate).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Inspect raw audit log"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Audit Trail Record #{selectedLog.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Action Type</span>
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border mt-0.5 ${getActionBadge(selectedLog.actionType)}`}>
                    {selectedLog.actionType}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Target Entity</span>
                  <span className="font-mono font-bold text-slate-800">{selectedLog.entityType} #{selectedLog.entityId}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Performed By</span>
                  <span className="font-bold text-slate-900">{selectedLog.performedByName || `ID: ${selectedLog.performedByUserId}`}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Remote Client IP</span>
                  <span className="font-mono font-bold text-slate-700">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-600 font-bold block mb-1">Raw Audit Payload JSON:</span>
                <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800">
                  {typeof selectedLog.details === 'object' 
                    ? JSON.stringify(selectedLog.details, null, 2)
                    : (function() {
                        try {
                          return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                        } catch (e) {
                          return selectedLog.details || 'No additional details logged';
                        }
                      })()
                  }
                </pre>
              </div>

              <div className="flex justify-between items-center text-slate-400 text-[11px] pt-2 border-t border-slate-100">
                <span>Recorded: {new Date(selectedLog.createdDate).toLocaleString()}</span>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, RefreshCw, Calendar, Clock, User, Globe } from 'lucide-react';
import api from '../../services/api';

export default function DistributionAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>System Distribution Audit Trail</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Immutable logging of all administrative actions, account provisions, status modifications, credential resets, and verified wholesale settlements.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setTimeout(fetchLogs, 50);
              }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
            >
              <option value="">All Action Types</option>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Details / Metadata</th>
                <th className="py-3 px-4 text-center">IP Address</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400 font-sans">
                    No audit records found.
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
                    <tr key={log.id} className="hover:bg-indigo-50/20 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {log.entityType} #{log.entityId}
                      </td>
                      <td className="py-3 px-4 font-sans text-gray-900 font-medium">
                        {log.performedByName || `User #${log.performedByUserId}`}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-md truncate" title={formattedDetails}>
                        {formattedDetails}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-400">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 font-sans">
                        {new Date(log.createdDate).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


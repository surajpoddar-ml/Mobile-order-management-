import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, RefreshCw, Calendar, IndianRupee } from 'lucide-react';
import api from '../../services/api';

export default function DistributionReports() {
  const [reports, setReports] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await api.distribution.getReportsSummary(params);
      if (res.success) setReports(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reports || reports.length === 0) return;

    const headers = [
      'State / Territory',
      'Type',
      'Districts',
      'District Distributors',
      'Area Distributors',
      'Retailers',
      'Total Billed (INR)',
      'Total Collected (INR)',
      'Outstanding (INR)'
    ];

    const rows = reports.map((r) => [
      `"${r.stateName}"`,
      r.isUnionTerritory ? 'Union Territory' : 'State',
      r.totalDistricts || 0,
      r.districtDistributors || 0,
      r.areaDistributors || 0,
      r.retailers || 0,
      parseFloat(r.totalBilled || 0),
      parseFloat(r.totalCollected || 0),
      parseFloat(r.totalOutstanding || 0)
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MWS_Eagle_Distribution_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totals = reports.reduce(
    (acc, r) => {
      acc.billed += parseFloat(r.totalBilled || 0);
      acc.collected += parseFloat(r.totalCollected || 0);
      acc.outstanding += parseFloat(r.totalOutstanding || 0);
      acc.districts += parseInt(r.totalDistricts || 0);
      acc.retailers += parseInt(r.retailers || 0);
      return acc;
    },
    { billed: 0, collected: 0, outstanding: 0, districts: 0, retailers: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Hierarchical State & Territory Reports</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Geographical distribution performance, network depth, and wholesale settlement metrics across India.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchReports}
              className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center space-x-2 text-xs text-gray-600 font-semibold">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Invoice Date Range:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg"
          />
          <button
            onClick={fetchReports}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
          >
            Apply Range
          </button>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setTimeout(fetchReports, 50);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase">Total Billed Gross</span>
          <div className="text-xl font-bold text-gray-900 mt-1">₹{totals.billed.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase">Total Collections</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">₹{totals.collected.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 uppercase">Total Outstanding</span>
          <div className="text-xl font-bold text-amber-700 mt-1">₹{totals.outstanding.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-indigo-600 uppercase">National Retail Outlets</span>
          <div className="text-xl font-bold text-indigo-700 mt-1">{totals.retailers.toLocaleString()} Retailers</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">State / Union Territory</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4 text-center">Districts</th>
                <th className="py-3 px-4 text-center">District Dists</th>
                <th className="py-3 px-4 text-center">Area Dists</th>
                <th className="py-3 px-4 text-center">Retailers</th>
                <th className="py-3 px-4 text-right">Total Billed (₹)</th>
                <th className="py-3 px-4 text-right">Collected (₹)</th>
                <th className="py-3 px-4 text-right">Outstanding (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((r) => (
                <tr key={r.stateId} className="hover:bg-indigo-50/30 transition">
                  <td className="py-3 px-4 font-semibold text-gray-900">{r.stateName}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                      r.isUnionTerritory ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {r.isUnionTerritory ? 'UT' : 'State'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-gray-800">{r.totalDistricts || 0}</td>
                  <td className="py-3 px-4 text-center font-medium text-blue-700">{r.districtDistributors || 0}</td>
                  <td className="py-3 px-4 text-center font-medium text-cyan-700">{r.areaDistributors || 0}</td>
                  <td className="py-3 px-4 text-center font-medium text-emerald-700">{r.retailers || 0}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    ₹{parseFloat(r.totalBilled || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-emerald-700">
                    ₹{parseFloat(r.totalCollected || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-amber-700">
                    ₹{parseFloat(r.totalOutstanding || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


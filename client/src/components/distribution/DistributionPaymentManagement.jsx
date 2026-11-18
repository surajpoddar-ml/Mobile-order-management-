import React, { useState, useEffect } from 'react';
import {
  FileText, IndianRupee, CheckCircle, Clock, AlertTriangle,
  Plus, Search, Filter, RefreshCw, Calendar, ArrowUpRight, Check,
  CreditCard, TrendingUp, AlertCircle, ShieldCheck, X, Receipt, Wallet
} from 'lucide-react';
import api from '../../services/api';

export default function DistributionPaymentManagement() {
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'payments'
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settlementSummary, setSettlementSummary] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);

  // Forms
  const [invRecipientId, setInvRecipientId] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDueDate, setInvDueDate] = useState('');
  const [invTerms, setInvTerms] = useState('Net 15');
  const [invDesc, setInvDesc] = useState('Wholesale Hardware & Accessories Batch');

  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payPayerId, setPayPayerId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchInvoices(),
        fetchPayments(),
        fetchSettlements(),
        fetchAccounts()
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await api.distribution.getInvoices();
      if (res.success) setInvoices(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await api.distribution.getPayments();
      if (res.success) setPayments(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettlements = async () => {
    try {
      const res = await api.distribution.getSettlements();
      if (res.success) setSettlementSummary(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.distribution.getAccounts();
      if (res.success) setAccounts(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.distribution.createInvoice({
        recipientUserId: parseInt(invRecipientId),
        totalAmount: parseFloat(invAmount),
        dueDate: invDueDate,
        paymentTerms: invTerms,
        description: invDesc
      });
      if (res.success) {
        setActionSuccess('Wholesale Invoice generated and dispatched successfully!');
        setShowCreateInvoiceModal(false);
        setInvAmount('');
        setInvRecipientId('');
        loadAll();
      } else {
        setActionError(res.message || 'Failed to create invoice');
      }
    } catch (err) {
      setActionError(err.message || 'Server error creating invoice');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.distribution.recordPayment({
        invoiceId: payInvoiceId ? parseInt(payInvoiceId) : null,
        payerUserId: parseInt(payPayerId),
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        transactionReference: payRef.trim(),
        paymentDate: payDate,
        paymentStatus: 'Verified',
        notes: payNotes.trim()
      });
      if (res.success) {
        setActionSuccess('Payment recorded and verified! Reliability score updated.');
        setShowRecordPaymentModal(false);
        setPayAmount('');
        setPayRef('');
        setPayNotes('');
        loadAll();
      } else {
        setActionError(res.message || 'Failed to record payment');
      }
    } catch (err) {
      setActionError(err.message || 'Server error recording payment');
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const term = search.toLowerCase();
    const matchSearch =
      inv.invoiceNumber?.toLowerCase().includes(term) ||
      inv.recipientName?.toLowerCase().includes(term) ||
      inv.businessName?.toLowerCase().includes(term);
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredPayments = payments.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.transactionReference?.toLowerCase().includes(term) ||
      p.payerName?.toLowerCase().includes(term) ||
      p.businessName?.toLowerCase().includes(term) ||
      p.invoiceNumber?.toLowerCase().includes(term)
    );
  });

  // Calculation for progress bar
  const collectionRate = settlementSummary && settlementSummary.totalBilled > 0
    ? Math.round((settlementSummary.totalPaid / settlementSummary.totalBilled) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Financial Executive Summary Cards */}
      {settlementSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border-t-4 border-t-blue-500 border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Billed</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              ₹{settlementSummary.totalBilled?.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>{settlementSummary.totalInvoices} Invoices Issued</span>
              <span className="font-semibold text-blue-600">Active Pipeline</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border-t-4 border-t-emerald-500 border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Payments Verified</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-2">
              ₹{settlementSummary.totalPaid?.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="text-emerald-700 font-bold">{settlementSummary.paidCount} Fully Settled</span>
              <span className="font-bold text-emerald-600">{collectionRate}% Rate</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border-t-4 border-t-amber-500 border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Outstanding Balance</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-700 mt-2">
              ₹{settlementSummary.totalOutstanding?.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="text-amber-700 font-semibold">{settlementSummary.partialCount} Partial Invoices</span>
              <span className="text-amber-600 font-bold">In Term</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border-t-4 border-t-rose-500 border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Overdue Accounts</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-700 mt-2">
              {settlementSummary.overdueCount} Invoices
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="text-rose-600 font-semibold">Immediate Action</span>
              <span className="text-rose-700 font-bold">Past Due</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Controls & Pill Switcher */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl self-start">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'invoices'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Wholesale Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'payments'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Verified Payments ({payments.length})
            </button>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap justify-end">
            <button
              onClick={() => setShowCreateInvoiceModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Invoice</span>
            </button>
            <button
              onClick={() => setShowRecordPaymentModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition hover:shadow"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
            <button
              onClick={loadAll}
              className="p-2.5 text-slate-600 hover:text-blue-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              title="Refresh Finance Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'invoices' ? 'Search by invoice #, name, or distributor...' : 'Search by transaction ref, payer, or invoice #...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          {activeTab === 'invoices' && (
            <div className="flex items-center space-x-1.5 self-start sm:self-auto">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status:</span>
              {['ALL', 'Paid', 'PartiallyPaid', 'Unpaid', 'Overdue'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                    statusFilter === st
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'PartiallyPaid' ? 'Partial' : st}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 animate-slideDown">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. INVOICES TABLE */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Recipient Account</th>
                  <th className="py-3.5 px-3 text-center">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Total (₹)</th>
                  <th className="py-3.5 px-4 text-right">Settled (₹)</th>
                  <th className="py-3.5 px-4 text-right">Balance Due (₹)</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-10 text-center text-slate-400">
                      <p className="font-semibold text-slate-600">No invoices found matching criteria.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Click "Issue Invoice" above to create wholesale billing records.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-blue-700">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{inv.recipientName}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{inv.businessName || inv.recipientCustomId}</div>
                      </td>
                      <td className="py-3 px-3 text-center text-xs font-medium text-slate-600">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{parseFloat(inv.totalAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        ₹{parseFloat(inv.paidAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-amber-600">
                        ₹{parseFloat(inv.balanceAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                          inv.status === 'Paid' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : inv.status === 'PartiallyPaid' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            inv.status === 'Paid' ? 'bg-emerald-500' :
                            inv.status === 'PartiallyPaid' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {inv.balanceAmount > 0 ? (
                          <button
                            onClick={() => {
                              setPayInvoiceId(inv.id);
                              setPayPayerId(inv.recipientUserId);
                              setPayAmount(inv.balanceAmount);
                              setShowRecordPaymentModal(true);
                            }}
                            className="px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-lg transition shadow-xs"
                          >
                            Collect ₹{parseFloat(inv.balanceAmount).toLocaleString()}
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Settled</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. PAYMENTS TABLE */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Transaction Ref / UTR</th>
                  <th className="py-3.5 px-4">Distributor / Remitter</th>
                  <th className="py-3.5 px-3 text-center">Linked Invoice</th>
                  <th className="py-3.5 px-3 text-center">Payment Method</th>
                  <th className="py-3.5 px-3 text-center">Payment Date</th>
                  <th className="py-3.5 px-4 text-right">Settled Amount (₹)</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-400">
                      <p className="font-semibold text-slate-600">No verified payment transactions recorded yet.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Record bank collections or UPI transactions using the button above.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {p.transactionReference || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.payerName}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{p.businessName || p.payerCustomId}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs font-bold text-blue-700">
                        {p.invoiceNumber || <span className="text-slate-400 font-normal">General Credit</span>}
                      </td>
                      <td className="py-3 px-3 text-center text-xs font-bold text-slate-700">
                        {p.paymentMethod}
                      </td>
                      <td className="py-3 px-3 text-center text-xs font-medium text-slate-600">
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600">
                        ₹{parseFloat(p.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                          {p.paymentStatus || 'Verified'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Issue Wholesale Distribution Invoice</h3>
              </div>
              <button 
                onClick={() => setShowCreateInvoiceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Recipient Account *</label>
                <select
                  required
                  value={invRecipientId}
                  onChange={(e) => setInvRecipientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="">-- Select Recipient Distributor --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} ({a.businessName || a.userId}) • {a.distributorLevel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Invoice Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Terms</label>
                  <select
                    value={invTerms}
                    onChange={(e) => setInvTerms(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="Net 7">Net 7 Days</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Immediate">Immediate / Advance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Description / Memo</label>
                  <input
                    type="text"
                    value={invDesc}
                    onChange={(e) => setInvDesc(e.target.value)}
                    placeholder="e.g. Hardware batch ref #104"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Record Verified Wholesale Settlement</h3>
              </div>
              <button 
                onClick={() => setShowRecordPaymentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Payer Account *</label>
                <select
                  required
                  value={payPayerId}
                  onChange={(e) => setPayPayerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="">-- Select Payer Distributor --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} ({a.businessName || a.userId}) • {a.distributorLevel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Link to Invoice (Optional)</label>
                <select
                  value={payInvoiceId}
                  onChange={(e) => setPayInvoiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="">-- Apply as general settlement or select invoice --</option>
                  {invoices
                    .filter((inv) => !payPayerId || inv.recipientUserId === parseInt(payPayerId))
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - Bal: ₹{inv.balanceAmount} (Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Method *</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash Deposit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Transaction Ref / UTR *</label>
                  <input
                    type="text"
                    required
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="e.g. UTR12345678"
                    className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition"
                >
                  Verify & Settle Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

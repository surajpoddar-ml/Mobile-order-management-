import React, { useState, useEffect } from 'react';
import {
  FileText, IndianRupee, CheckCircle, Clock, AlertTriangle,
  Plus, Search, Filter, RefreshCw, Calendar, ArrowUpRight, Check
} from 'lucide-react';
import api from '../../services/api';

export default function DistributionPaymentManagement() {
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'payments' | 'settlements'
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settlementSummary, setSettlementSummary] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

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
        setActionSuccess('Wholesale Invoice generated successfully!');
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
        setActionSuccess('Payment recorded and verified! Reliability score has been updated.');
        setShowRecordPaymentModal(false);
        setPayAmount('');
        setPayRef('');
        loadAll();
      } else {
        setActionError(res.message || 'Failed to record payment');
      }
    } catch (err) {
      setActionError(err.message || 'Server error recording payment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      {settlementSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Wholesale Billed</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">₹{settlementSummary.totalBilled.toLocaleString()}</div>
            <span className="text-xs text-gray-400">{settlementSummary.totalInvoices} Invoices Issued</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-xs font-semibold text-emerald-600 uppercase">Payments Verified</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">₹{settlementSummary.totalPaid.toLocaleString()}</div>
            <span className="text-xs text-emerald-600 font-medium">{settlementSummary.paidCount} Fully Paid</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-xs font-semibold text-amber-600 uppercase">Outstanding Balance</span>
            <div className="text-2xl font-bold text-amber-700 mt-1">₹{settlementSummary.totalOutstanding.toLocaleString()}</div>
            <span className="text-xs text-amber-600 font-medium">{settlementSummary.partialCount} Partially Paid</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-xs font-semibold text-red-600 uppercase">Overdue Receivables</span>
            <div className="text-2xl font-bold text-red-700 mt-1">{settlementSummary.overdueCount} Invoices</div>
            <span className="text-xs text-red-500">Requires Follow-up</span>
          </div>
        </div>
      )}

      {/* Tabs & Action Buttons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                activeTab === 'invoices' ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Wholesale Invoices
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                activeTab === 'payments' ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Verified Payment Records
            </button>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowCreateInvoiceModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
            <button
              onClick={() => setShowRecordPaymentModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
            <button
              onClick={loadAll}
              className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 1. INVOICES TABLE */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Recipient Distributor</th>
                  <th className="py-3.5 px-4 text-center">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Total Amount (₹)</th>
                  <th className="py-3.5 px-4 text-right">Paid (₹)</th>
                  <th className="py-3.5 px-4 text-right">Balance (₹)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-gray-400">
                      No invoices recorded yet. Click "Create Invoice" above to issue one.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-indigo-50/30 transition">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-indigo-700">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{inv.recipientName}</div>
                        <div className="text-xs text-gray-500">{inv.businessName || inv.recipientCustomId}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-gray-600">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">₹{parseFloat(inv.totalAmount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-700">₹{parseFloat(inv.paidAmount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700">₹{parseFloat(inv.balanceAmount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          inv.status === 'Paid' ? 'bg-green-100 text-green-700' :
                          inv.status === 'PartiallyPaid' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {inv.balanceAmount > 0 && (
                          <button
                            onClick={() => {
                              setPayInvoiceId(inv.id);
                              setPayPayerId(inv.recipientUserId);
                              setPayAmount(inv.balanceAmount);
                              setShowRecordPaymentModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition"
                          >
                            Pay Balance
                          </button>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Transaction Ref</th>
                  <th className="py-3.5 px-4">Distributor / Payer</th>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4 text-center">Payment Method</th>
                  <th className="py-3.5 px-4 text-center">Payment Date</th>
                  <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-3.5 px-4 text-center">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-400">
                      No verified payments recorded yet. Click "Record Payment" to verify a transaction.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-indigo-50/30 transition">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-gray-700">{p.transactionReference || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{p.payerName}</div>
                        <div className="text-xs text-gray-500">{p.businessName || p.payerCustomId}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-indigo-700">{p.invoiceNumber || 'General Credit'}</td>
                      <td className="py-3 px-4 text-center text-xs font-medium text-gray-700">{p.paymentMethod}</td>
                      <td className="py-3 px-4 text-center text-xs text-gray-600">
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{parseFloat(p.amount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                          {p.paymentStatus}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Issue Wholesale Distribution Invoice</h3>
            <p className="text-xs text-gray-500 mb-4">Creates an official billing record for stock supply</p>

            {actionError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded mb-3">{actionError}</div>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Recipient Account *</label>
                <select
                  required
                  value={invRecipientId}
                  onChange={(e) => setInvRecipientId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="">-- Select Recipient Distributor --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} ({a.businessName || a.userId}) - {a.distributorLevel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={invDesc}
                  onChange={(e) => setInvDesc(e.target.value)}
                  placeholder="Order reference, stock details..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Record Verified Payment</h3>
            <p className="text-xs text-gray-500 mb-4">
              Records bank/cash collection, settles outstanding invoices, and recalculates reliability score.
            </p>

            {actionError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded mb-3">{actionError}</div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payer Account *</label>
                <select
                  required
                  value={payPayerId}
                  onChange={(e) => setPayPayerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="">-- Select Payer Distributor --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} ({a.businessName || a.userId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Link to Invoice (Optional)</label>
                <select
                  value={payInvoiceId}
                  onChange={(e) => setPayInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method *</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Transaction Ref / UTR *</label>
                  <input
                    type="text"
                    required
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="e.g. UTR12345678"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow"
                >
                  Record & Verify Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


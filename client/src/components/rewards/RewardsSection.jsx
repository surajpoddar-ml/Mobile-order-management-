import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  QrCode,
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  Gift,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import { QRScannerModal } from './QRScannerModal';
import { RedemptionModal } from './RedemptionModal';

export const RewardsSection = ({ userType = 'Customer' }) => {
  const [summary, setSummary] = useState({
    pointsBalance: 0,
    totalPointsEarned: 0,
    cashValue: 0,
    conversionRate: 1.0,
    minRedemptionPoints: 50
  });

  const [activeTab, setActiveTab] = useState('claimed'); // 'claimed' | 'redemptions' | 'ledger'
  const [history, setHistory] = useState({
    transactions: [],
    claimedTokens: [],
    redemptions: []
  });

  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);

  // Load summary and history
  const loadRewardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [sumRes, histRes] = await Promise.all([
        api.rewards.getMySummary(),
        api.rewards.getMyHistory()
      ]);

      if (sumRes && sumRes.success && sumRes.summary) {
        setSummary(sumRes.summary);
      }
      if (histRes && histRes.success) {
        setHistory({
          transactions: histRes.transactions || [],
          claimedTokens: histRes.claimedTokens || [],
          redemptions: histRes.redemptions || []
        });
      }
    } catch (err) {
      console.warn('Failed to load reward data:', err.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadRewardData();

    const handleUpdate = () => loadRewardData(true);
    window.addEventListener('mws_rewards_updated', handleUpdate);

    return () => {
      window.removeEventListener('mws_rewards_updated', handleUpdate);
    };
  }, []);

  // Format date helper
  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          color: '#059669',
          label: 'Paid to Bank'
        };
      case 'Approved':
        return {
          bg: '#eff6ff',
          border: '#bfdbfe',
          color: '#2563eb',
          label: 'Approved'
        };
      case 'Processing':
        return {
          bg: '#fef3c7',
          border: '#fde68a',
          color: '#d97706',
          label: 'Processing'
        };
      case 'Rejected':
        return {
          bg: '#fef2f2',
          border: '#fecaca',
          color: '#dc2626',
          label: 'Rejected & Refunded'
        };
      default:
        return {
          bg: '#f1f5f9',
          border: '#cbd5e1',
          color: '#64748b',
          label: 'Pending Verification'
        };
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* 1. HERO REWARD CARD */}
      <div
        style={{
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          color: '#ffffff',
          padding: 'clamp(20px, 4vw, 36px)',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '28px'
        }}
      >
        {/* Subtle decorative glow circles */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-40px',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '20%',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top header row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(245, 158, 11, 0.35)'
                }}
              >
                <Gift size={24} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                  My Rewards & Points
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Scan official QR codes on products to earn instant points & cash out anytime
                </div>
              </div>
            </div>

            {/* Conversion Rate Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '0.78rem',
                color: '#e2e8f0'
              }}
            >
              <Sparkles size={14} color="#f59e0b" />
              <span>Conversion Rate: <strong>1 Point = ₹{summary.conversionRate}</strong></span>
            </div>
          </div>

          {/* Balance & Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '26px'
            }}
          >
            {/* Current Balance */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '18px',
                padding: '18px 20px'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '4px' }}>
                Redeemable Balance
              </div>
              <div style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, color: '#f59e0b', lineHeight: 1.1 }}>
                {summary.pointsBalance.toLocaleString()}{' '}
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24' }}>pts</span>
              </div>
            </div>

            {/* Cash Valuation */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '18px',
                padding: '18px 20px'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '4px' }}>
                Equivalent Cash Value
              </div>
              <div style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, color: '#10b981', lineHeight: 1.1 }}>
                ₹{summary.cashValue.toLocaleString()}
              </div>
            </div>

            {/* Lifetime Earned */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '18px',
                padding: '18px 20px'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '4px' }}>
                Total Lifetime Earned
              </div>
              <div style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
                {summary.totalPointsEarned.toLocaleString()}{' '}
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8' }}>pts</span>
              </div>
            </div>
          </div>

          {/* Action CTAs: Scan QR & Redeem Cash */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              style={{
                padding: '14px 28px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <QrCode size={20} />
              <span>Scan & Earn Points</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRedeemOpen(true)}
              disabled={summary.pointsBalance < summary.minRedemptionPoints}
              style={{
                padding: '14px 28px',
                borderRadius: '14px',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: summary.pointsBalance < summary.minRedemptionPoints ? 'not-allowed' : 'pointer',
                opacity: summary.pointsBalance < summary.minRedemptionPoints ? 0.5 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.15s ease'
              }}
              title={
                summary.pointsBalance < summary.minRedemptionPoints
                  ? `Minimum ${summary.minRedemptionPoints} points required to redeem cash`
                  : 'Redeem points for cash transfer'
              }
            >
              <Wallet size={20} color="#10b981" />
              <span>Redeem Points for Cash</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. REWARD SECTIONS & TABS */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Navigation Tab Bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            overflowX: 'auto'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('claimed')}
            style={{
              padding: '16px 24px',
              border: 'none',
              borderBottom: activeTab === 'claimed' ? '3px solid #2563eb' : '3px solid transparent',
              background: activeTab === 'claimed' ? '#ffffff' : 'transparent',
              color: activeTab === 'claimed' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'claimed' ? 800 : 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <QrCode size={17} color={activeTab === 'claimed' ? '#2563eb' : '#94a3b8'} />
            <span>Claimed QR Offers ({history.claimedTokens.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('redemptions')}
            style={{
              padding: '16px 24px',
              border: 'none',
              borderBottom: activeTab === 'redemptions' ? '3px solid #2563eb' : '3px solid transparent',
              background: activeTab === 'redemptions' ? '#ffffff' : 'transparent',
              color: activeTab === 'redemptions' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'redemptions' ? 800 : 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <Wallet size={17} color={activeTab === 'redemptions' ? '#2563eb' : '#94a3b8'} />
            <span>Cash Redemptions ({history.redemptions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            style={{
              padding: '16px 24px',
              border: 'none',
              borderBottom: activeTab === 'ledger' ? '3px solid #2563eb' : '3px solid transparent',
              background: activeTab === 'ledger' ? '#ffffff' : 'transparent',
              color: activeTab === 'ledger' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'ledger' ? 800 : 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <Clock size={17} color={activeTab === 'ledger' ? '#2563eb' : '#94a3b8'} />
            <span>Points Ledger ({history.transactions.length})</span>
          </button>
        </div>

        {/* Tab 1: Claimed QR Offers */}
        {activeTab === 'claimed' && (
          <div style={{ padding: '24px' }}>
            {history.claimedTokens.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px',
                    color: '#94a3b8'
                  }}
                >
                  <QrCode size={28} />
                </div>
                <div style={{ fontWeight: 800, color: '#334155', fontSize: '1rem', marginBottom: '6px' }}>
                  No QR Codes Scanned Yet
                </div>
                <div style={{ fontSize: '0.82rem', maxWidth: '320px', margin: '0 auto 18px', color: '#94a3b8' }}>
                  Scan official QR offer codes printed on product packaging or promotional flyers to earn points.
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Scan QR Code Now
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {history.claimedTokens.map((tok) => (
                  <div
                    key={tok.id}
                    style={{
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '16px 18px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                          {tok.title || 'MWS Points Offer'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                          Token: {tok.token}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                          {formatDate(tok.claimedAt)}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 900,
                          color: '#059669',
                          background: '#ecfdf5',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          border: '1px solid #a7f3d0',
                          display: 'inline-block'
                        }}
                      >
                        +{tok.points} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Cash Redemptions */}
        {activeTab === 'redemptions' && (
          <div style={{ padding: '24px' }}>
            {history.redemptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px',
                    color: '#94a3b8'
                  }}
                >
                  <Wallet size={28} />
                </div>
                <div style={{ fontWeight: 800, color: '#334155', fontSize: '1rem', marginBottom: '6px' }}>
                  No Cash Redemptions Yet
                </div>
                <div style={{ fontSize: '0.82rem', maxWidth: '320px', margin: '0 auto 18px', color: '#94a3b8' }}>
                  Convert your accumulated points directly into bank payouts once you reach {summary.minRedemptionPoints} points.
                </div>
                <button
                  type="button"
                  onClick={() => setIsRedeemOpen(true)}
                  disabled={summary.pointsBalance < summary.minRedemptionPoints}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: summary.pointsBalance < summary.minRedemptionPoints ? 'not-allowed' : 'pointer',
                    opacity: summary.pointsBalance < summary.minRedemptionPoints ? 0.6 : 1
                  }}
                >
                  Request Cash Payout
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 14px' }}>Request ID</th>
                      <th style={{ padding: '12px 14px' }}>Date</th>
                      <th style={{ padding: '12px 14px' }}>Points</th>
                      <th style={{ padding: '12px 14px' }}>Cash Payout</th>
                      <th style={{ padding: '12px 14px' }}>Beneficiary Bank</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 14px' }}>Transaction Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.redemptions.map((red) => {
                      const badge = getStatusBadge(red.status);
                      return (
                        <tr key={red.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.84rem' }}>
                          <td style={{ padding: '14px', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                            {red.requestNumber}
                          </td>
                          <td style={{ padding: '14px', color: '#64748b', fontSize: '0.78rem' }}>
                            {formatDate(red.createdDate)}
                          </td>
                          <td style={{ padding: '14px', fontWeight: 700, color: '#dc2626' }}>
                            -{red.points} pts
                          </td>
                          <td style={{ padding: '14px', fontWeight: 900, color: '#059669', fontSize: '0.95rem' }}>
                            ₹{Number(red.cashAmount).toLocaleString()}
                          </td>
                          <td style={{ padding: '14px', color: '#334155' }}>
                            <div style={{ fontWeight: 700 }}>{red.bankName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              A/C: ••••{red.accountNumber.slice(-4)} | {red.ifscCode}
                            </div>
                          </td>
                          <td style={{ padding: '14px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                backgroundColor: badge.bg,
                                border: `1px solid ${badge.border}`,
                                color: badge.color,
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}
                            >
                              {badge.label}
                            </span>
                            {red.rejectionReason && (
                              <div style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '4px' }}>
                                Reason: {red.rejectionReason}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px', color: '#475569', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                            {red.transactionReference || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Points Ledger */}
        {activeTab === 'ledger' && (
          <div style={{ padding: '24px' }}>
            {history.transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                No points transactions recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.transactions.map((tx) => {
                  const isCredit = tx.points > 0;
                  return (
                    <div
                      key={tx.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: isCredit ? '#ecfdf5' : '#fef2f2',
                            color: isCredit ? '#059669' : '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                            {tx.description}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {formatDate(tx.createdDate)}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            color: isCredit ? '#059669' : '#dc2626'
                          }}
                        >
                          {isCredit ? `+${tx.points}` : tx.points} pts
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Bal: {tx.balanceAfter} pts
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Scanner Camera Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onClaimSuccess={() => loadRewardData(true)}
      />

      {/* Redemption Form Modal */}
      <RedemptionModal
        isOpen={isRedeemOpen}
        onClose={() => setIsRedeemOpen(false)}
        currentPoints={summary.pointsBalance}
        conversionRate={summary.conversionRate}
        minPoints={summary.minRedemptionPoints}
        onRedeemSuccess={() => loadRewardData(true)}
      />
    </div>
  );
};

export default RewardsSection;

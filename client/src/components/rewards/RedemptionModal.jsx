import React, { useState, useEffect } from 'react';
import {
  Wallet,
  X,
  Building2,
  CreditCard,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';

export const RedemptionModal = ({ isOpen, onClose, currentPoints = 0, conversionRate = 1.0, minPoints = 50, onRedeemSuccess }) => {
  const [points, setPoints] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const numPoints = parseInt(points, 10) || 0;
  const cashAmount = Math.round(numPoints * (conversionRate || 1.0) * 100) / 100;

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessResult(null);
      // Default to 100 points or current balance if less
      if (currentPoints >= minPoints) {
        setPoints(Math.min(100, currentPoints).toString());
      } else {
        setPoints(currentPoints.toString());
      }
    }
  }, [isOpen, currentPoints, minPoints]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (numPoints <= 0) {
      return setErrorMsg('Please enter a valid points amount to redeem.');
    }
    if (numPoints < minPoints) {
      return setErrorMsg(`Minimum redemption threshold is ${minPoints} points.`);
    }
    if (numPoints > currentPoints) {
      return setErrorMsg(`You only have ${currentPoints} points available to redeem.`);
    }

    if (!fullName.trim()) return setErrorMsg('Full Name is required.');
    if (!phoneNumber.trim()) return setErrorMsg('Phone Number is required.');
    if (!bankName.trim()) return setErrorMsg('Bank Name is required.');
    if (!accountHolderName.trim()) return setErrorMsg('Account Holder Name is required.');
    if (!accountNumber.trim()) return setErrorMsg('Account Number is required.');
    if (accountNumber.trim() !== confirmAccountNumber.trim()) {
      return setErrorMsg('Account numbers do not match. Please verify carefully.');
    }
    if (!ifscCode.trim()) return setErrorMsg('Bank IFSC Code is required.');

    setLoading(true);
    try {
      const payload = {
        points: numPoints,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        upiId: upiId.trim()
      };

      const res = await api.rewards.submitRedemption(payload);
      if (res.success) {
        setSuccessResult(res.request);
        window.dispatchEvent(new Event('mws_rewards_updated'));
        window.dispatchEvent(new Event('mws_notifications_refresh'));
        if (onRedeemSuccess) onRedeemSuccess(res);
      } else {
        setErrorMsg(res.message || 'Failed to submit redemption request.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit redemption request. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Wallet size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                Redeem Points for Cash
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Instant conversion & bank direct transfer
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {/* SUCCESS SCREEN */}
          {successResult ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                Redemption Request Submitted!
              </div>

              <div style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '380px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                Your request has been sent for admin verification. Payout will be transferred to your account within 24–48 hours.
              </div>

              {/* Receipt Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  textAlign: 'left',
                  marginBottom: '24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Request Number:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                    {successResult.requestNumber}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Points Redeemed:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#dc2626' }}>
                    -{successResult.points} pts
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Payout Amount:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669' }}>
                    ₹{Number(successResult.cashAmount).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Destination Bank:</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    {successResult.bankName} (A/C: ••••{successResult.accountNumber.slice(-4)})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                Track Status in Rewards
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Point Input & Live Valuation Calculator */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '18px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                    Points to Redeem
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Available: <strong style={{ color: '#059669' }}>{currentPoints} pts</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="number"
                      min={minPoints}
                      max={currentPoints}
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                      placeholder={`Min ${minPoints}`}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      padding: '10px 16px',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      textAlign: 'right',
                      minWidth: '130px'
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', color: '#059669', textTransform: 'uppercase', fontWeight: 700 }}>
                      Payout Amount
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669', lineHeight: 1.1 }}>
                      ₹{cashAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Quick Points Preset Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {[50, 100, 200, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={currentPoints < preset}
                      onClick={() => setPoints(preset.toString())}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: '1px solid #cbd5e1',
                        background: points === preset.toString() ? '#2563eb' : '#ffffff',
                        color: points === preset.toString() ? '#ffffff' : '#475569',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: currentPoints < preset ? 'not-allowed' : 'pointer',
                        opacity: currentPoints < preset ? 0.45 : 1
                      }}
                    >
                      {preset} pts
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPoints < minPoints}
                    onClick={() => setPoints(currentPoints.toString())}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      border: '1px solid #cbd5e1',
                      background: points === currentPoints.toString() ? '#2563eb' : '#ffffff',
                      color: points === currentPoints.toString() ? '#ffffff' : '#475569',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: currentPoints < minPoints ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Max ({currentPoints})
                  </button>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '8px' }}>
                  Rate: <strong>1 Point = ₹{conversionRate}</strong> | Minimum: <strong>{minPoints} Points</strong>
                </div>
              </div>

              {/* Bank Details Section */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Building2 size={16} color="#2563eb" />
                  <span>Beneficiary Bank & Payout Details</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. State Bank of India, HDFC Bank, ICICI Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="As printed on bank passbook / cheque"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Account Number *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Account Number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Confirm Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Re-enter Account Number"
                      value={confirmAccountNumber}
                      onChange={(e) => setConfirmAccountNumber(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Bank IFSC Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SBIN0001234"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      UPI ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. mobile@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Address / City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="Your residential address or shop location"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.8rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <div>{errorMsg}</div>
                </div>
              )}

              {/* Security note */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.72rem',
                  color: '#64748b',
                  marginBottom: '18px'
                }}
              >
                <ShieldCheck size={14} color="#059669" />
                <span>Points are securely reserved upon submission and transferred directly to your bank account.</span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || numPoints < minPoints || numPoints > currentPoints}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: loading || numPoints < minPoints || numPoints > currentPoints ? 'not-allowed' : 'pointer',
                    opacity: loading || numPoints < minPoints || numPoints > currentPoints ? 0.6 : 1,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Request ₹{cashAmount.toLocaleString()}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RedemptionModal;

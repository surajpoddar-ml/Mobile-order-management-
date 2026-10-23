import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  QrCode,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Keyboard,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';

export const QRScannerModal = ({ isOpen, onClose, onClaimSuccess }) => {
  const [activeMode, setActiveMode] = useState('camera'); // 'camera' | 'file' | 'manual'
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [claimResult, setClaimResult] = useState(null); // { success, pointsEarned, message, token }
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'mws-qr-scanner-view';

  // Cleanup scanner on close or unmount
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Scanner stop note:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanner = async (cameraId) => {
    setCameraError('');
    await stopScanner();

    try {
      const qrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = qrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      const cameraConfig = cameraId
        ? { deviceId: { exact: cameraId } }
        : { facingMode: 'environment' };

      await qrCode.start(
        cameraConfig,
        config,
        (decodedText) => {
          handleTokenScanned(decodedText);
        },
        () => {
          // Ignore frequent frame decode failure
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Camera start error:', err);
      setCameraError(err.message || 'Camera permission denied or camera not accessible.');
      setIsScanning(false);
    }
  };

  // Init cameras when modal opens in camera mode
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setClaimResult(null);
      setCameraError('');
      setManualCode('');
      return;
    }

    if (activeMode === 'camera' && !claimResult) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            // Default to back camera if found
            const backCam = devices.find((d) =>
              /back|rear|environment/i.test(d.label)
            );
            const chosenId = backCam ? backCam.id : devices[0].id;
            setSelectedCameraId(chosenId);
            startScanner(chosenId);
          } else {
            startScanner(null);
          }
        })
        .catch((err) => {
          console.warn('Camera enumeration error, trying facingMode:', err);
          startScanner(null);
        });
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, activeMode]);

  // Handle scanned token
  const handleTokenScanned = async (tokenString) => {
    if (loading || claimResult) return;
    await stopScanner();
    submitClaim(tokenString);
  };

  // Process claim API
  const submitClaim = async (tokenCode) => {
    if (!tokenCode || !tokenCode.trim()) return;
    setLoading(true);
    setCameraError('');

    try {
      const res = await api.rewards.scanAndClaim(tokenCode.trim());
      if (res.success) {
        setClaimResult({
          success: true,
          pointsEarned: res.pointsEarned,
          newBalance: res.newBalance,
          token: res.token,
          title: res.title,
          message: res.message
        });

        // Broadcast updates across app
        window.dispatchEvent(new Event('mws_rewards_updated'));
        window.dispatchEvent(new Event('mws_notifications_refresh'));

        if (onClaimSuccess) onClaimSuccess(res);
      } else {
        setCameraError(res.message || 'Could not verify QR code.');
      }
    } catch (err) {
      setCameraError(err.message || 'Failed to claim QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload scanning
  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setLoading(true);
    setCameraError('');

    try {
      const scanner = new Html5Qrcode('mws-qr-file-dummy');
      const decodedText = await scanner.scanFile(file, true);
      scanner.clear();
      if (decodedText) {
        await submitClaim(decodedText);
      }
    } catch (err) {
      setCameraError('No valid QR code was detected in this image. Please upload a clear photo of the QR code.');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setClaimResult(null);
    setCameraError('');
    setManualCode('');
    if (activeMode === 'camera') {
      startScanner(selectedCameraId);
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
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
              }}
            >
              <QrCode size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>
                Scan & Earn Points
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Scan official MWS Eagle QR offer codes
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
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs (Camera / Upload Photo / Enter Code) */}
        {!claimResult && (
          <div
            style={{
              display: 'flex',
              backgroundColor: '#f1f5f9',
              padding: '6px',
              gap: '6px',
              borderBottom: '1px solid #e2e8f0'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveMode('camera')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '10px',
                border: 'none',
                background: activeMode === 'camera' ? '#ffffff' : 'transparent',
                color: activeMode === 'camera' ? '#0f172a' : '#64748b',
                fontWeight: activeMode === 'camera' ? 700 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: activeMode === 'camera' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Camera size={14} />
              <span>Camera</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('file')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '10px',
                border: 'none',
                background: activeMode === 'file' ? '#ffffff' : 'transparent',
                color: activeMode === 'file' ? '#0f172a' : '#64748b',
                fontWeight: activeMode === 'file' ? 700 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: activeMode === 'file' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Upload size={14} />
              <span>Upload QR</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('manual')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '10px',
                border: 'none',
                background: activeMode === 'manual' ? '#ffffff' : 'transparent',
                color: activeMode === 'manual' ? '#0f172a' : '#64748b',
                fontWeight: activeMode === 'manual' ? 700 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: activeMode === 'manual' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Keyboard size={14} />
              <span>Enter Code</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          {/* 1. SUCCESS STATE */}
          {claimResult && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
                  marginBottom: '16px',
                  animation: 'bounce 0.6s ease'
                }}
              >
                <Sparkles size={36} />
              </div>

              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                +{claimResult.pointsEarned} Points Added!
              </div>

              <div style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '320px', marginBottom: '20px', lineHeight: 1.5 }}>
                {claimResult.message || `You claimed "${claimResult.title}". Points have been added to your balance.`}
              </div>

              {/* Point badge pill */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '12px 20px',
                  width: '100%',
                  maxWidth: '280px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Token Code
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                    {claimResult.token}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    New Balance
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#059669' }}>
                    {claimResult.newBalance} pts
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button
                  type="button"
                  onClick={resetScanner}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={15} />
                  <span>Scan Another</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  View Rewards
                </button>
              </div>
            </div>
          )}

          {/* 2. CAMERA SCANNER MODE */}
          {!claimResult && activeMode === 'camera' && (
            <div>
              {/* Scanner Viewport */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1',
                  maxHeight: '300px',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  backgroundColor: '#000000',
                  boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div id={scannerContainerId} style={{ width: '100%', height: '100%' }} />

                {/* Laser animation bar overlay */}
                {isScanning && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '15%',
                      left: '10%',
                      right: '10%',
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
                      boxShadow: '0 0 8px #22c55e',
                      animation: 'scanLaser 2s infinite ease-in-out',
                      pointerEvents: 'none'
                    }}
                  />
                )}

                {/* Corner guide overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '20px',
                    border: '2px dashed rgba(255, 255, 255, 0.4)',
                    borderRadius: '16px',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                />
              </div>

              {/* Camera Switcher if multiple available */}
              {cameras.length > 1 && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIndex = (cameras.findIndex((c) => c.id === selectedCameraId) + 1) % cameras.length;
                      const nextId = cameras[nextIndex].id;
                      setSelectedCameraId(nextId);
                      startScanner(nextId);
                    }}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '20px',
                      padding: '5px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RefreshCw size={13} />
                    <span>Switch Camera</span>
                  </button>
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.78rem', color: '#64748b' }}>
                Align the QR code within the frame to automatically scan and earn points.
              </div>
            </div>
          )}

          {/* 3. FILE UPLOAD SCANNER MODE */}
          {!claimResult && activeMode === 'file' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '16px',
                  padding: '36px 20px',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => document.getElementById('mws-qr-file-input')?.click()}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'rgba(37, 99, 235, 0.1)',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Upload size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                    Click to upload QR image
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    PNG, JPG, WEBP, or screenshot
                  </div>
                </div>
                <input
                  id="mws-qr-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
              <div id="mws-qr-file-dummy" style={{ display: 'none' }} />
            </div>
          )}

          {/* 4. MANUAL CODE INPUT MODE */}
          {!claimResult && activeMode === 'manual' && (
            <div style={{ padding: '8px 0' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '8px'
                }}
              >
                Enter QR Offer Token Code
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. MWS-7A8B-9C0D"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitClaim(manualCode);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    fontFamily: 'monospace',
                    outline: 'none',
                    textTransform: 'uppercase'
                  }}
                />
                <button
                  type="button"
                  onClick={() => submitClaim(manualCode)}
                  disabled={loading || !manualCode.trim()}
                  style={{
                    padding: '0 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: loading || !manualCode.trim() ? 'not-allowed' : 'pointer',
                    opacity: loading || !manualCode.trim() ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Verify</span>
                  <ArrowRight size={15} />
                </button>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '8px' }}>
                You can find the code printed underneath the QR code on your product box or reward voucher.
              </div>
            </div>
          )}

          {/* Error / Alert Message */}
          {cameraError && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                lineHeight: 1.45
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{cameraError}</div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div
              style={{
                marginTop: '16px',
                textAlign: 'center',
                color: '#2563eb',
                fontSize: '0.84rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Verifying reward token...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;

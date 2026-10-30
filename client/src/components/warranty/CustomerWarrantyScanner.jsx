import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  RefreshCw,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Flashlight,
  SwitchCamera,
  Keyboard,
  ShieldCheck
} from 'lucide-react';

export const CustomerWarrantyScanner = ({ onScanSuccess }) => {
  const [scannerState, setScannerState] = useState('idle'); // 'idle' | 'requesting' | 'scanning' | 'detected' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  const scannerRef = useRef(null);
  const qrRegionId = 'mws-customer-qr-reader';

  // Helper to extract clean token from URL or raw input
  const extractToken = (scannedText) => {
    if (!scannedText) return '';
    const text = String(scannedText).trim();

    // Check if it's a verification URL e.g. https://domain.com/verify-warranty/w_abc123...
    if (text.includes('/verify-warranty/')) {
      const parts = text.split('/verify-warranty/');
      const tokenWithQuery = parts[1] || '';
      return tokenWithQuery.split('?')[0].split('#')[0].trim();
    }

    return text;
  };

  const startScanner = async () => {
    setErrorMessage('');
    setScannerState('requesting');

    try {
      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error('No video camera detected on your device. Please use manual entry.');
      }

      setCameras(devices);
      setHasMultipleCameras(devices.length > 1);

      // Prefer back / environment facing camera
      let selectedCameraId = devices[0].id;
      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') || 
        d.label.toLowerCase().includes('environment')
      );
      if (backCamera) {
        selectedCameraId = backCamera.id;
        const idx = devices.findIndex(d => d.id === backCamera.id);
        if (idx !== -1) setCurrentCameraIndex(idx);
      }

      // Initialize scanner instance
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {}
      }

      const html5QrCode = new Html5Qrcode(qrRegionId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false
      });
      scannerRef.current = html5QrCode;

      setScannerState('scanning');

      await html5QrCode.start(
        selectedCameraId,
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Success callback
          const cleanToken = extractToken(decodedText);
          if (cleanToken) {
            setScannerState('detected');
            try {
              // Play subtle audio confirmation if supported
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.frequency.value = 880;
              gain.gain.value = 0.1;
              osc.start();
              osc.stop(audioCtx.currentTime + 0.15);
            } catch (e) {}

            // Stop scanner and notify parent
            html5QrCode.stop().then(() => {
              if (onScanSuccess) {
                onScanSuccess(cleanToken);
              }
            }).catch(() => {
              if (onScanSuccess) {
                onScanSuccess(cleanToken);
              }
            });
          }
        },
        () => {
          // Continuous frame scan error — ignore normal scanning frames
        }
      );
    } catch (err) {
      console.warn('Camera scanner initialization error:', err);
      setScannerState('error');
      setErrorMessage(err.message || 'Unable to access device camera. Please check camera permissions.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    setScannerState('idle');
  };

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIdx = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIdx);

    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.start(
          cameras[nextIdx].id,
          { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (decodedText) => {
            const cleanToken = extractToken(decodedText);
            if (cleanToken && onScanSuccess) {
              scannerRef.current.stop().then(() => onScanSuccess(cleanToken));
            }
          },
          () => {}
        );
      } catch (err) {
        console.error('Camera switch error:', err);
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const clean = extractToken(manualCode);
    if (!clean) {
      setErrorMessage('Please enter a valid warranty verification token or code.');
      return;
    }
    if (onScanSuccess) {
      onScanSuccess(clean);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div style={{
      maxWidth: '460px',
      margin: '0 auto',
      background: '#ffffff',
      borderRadius: '16px',
      border: '1.5px solid var(--border-medium)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden'
    }}>
      {/* Scanner Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #031738 0%, #082252 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={22} color="#38bdf8" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>MWS Eagle QR Scanner</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Point camera at printed warranty card</div>
          </div>
        </div>

        {scannerState === 'scanning' && hasMultipleCameras && (
          <button
            type="button"
            onClick={handleSwitchCamera}
            title="Switch Camera"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              padding: '6px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.74rem'
            }}
          >
            <SwitchCamera size={14} />
            Switch
          </button>
        )}
      </div>

      {/* Main View Area */}
      <div style={{ padding: '20px', textAlign: 'center' }}>

        {/* 1. Idle State */}
        {scannerState === 'idle' && (
          <div>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: '#f0f9ff',
              border: '2px dashed #0284c7',
              margin: '10px auto 16px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7'
            }}>
              <Camera size={42} />
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              Scan Product Warranty QR
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.4 }}>
              Open your camera to scan the QR printed on your MWS Eagle product box or warranty card.
            </p>

            <button
              type="button"
              onClick={startScanner}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
              }}
            >
              <Camera size={18} />
              Open Device Camera
            </button>
          </div>
        )}

        {/* 2. Requesting Permission */}
        {scannerState === 'requesting' && (
          <div style={{ padding: '30px 10px' }}>
            <RefreshCw size={36} className="spin-animation" style={{ color: '#0284c7', margin: '0 auto 14px auto' }} />
            <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#0f172a' }}>Requesting Camera Permission...</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
              Please allow camera access when prompted by your browser.
            </div>
          </div>
        )}

        {/* 3. Active Scanning Viewport */}
        {scannerState === 'scanning' && (
          <div>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '320px',
              height: '320px',
              margin: '0 auto',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#000000',
              border: '2px solid #0284c7'
            }}>
              {/* HTML5 QR Code Mount Element */}
              <div id={qrRegionId} style={{ width: '100%', height: '100%' }} />

              {/* Viewfinder Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '28px', height: '28px', borderTop: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8' }} />
                  <div style={{ width: '28px', height: '28px', borderTop: '4px solid #38bdf8', borderRight: '4px solid #38bdf8' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '28px', height: '28px', borderBottom: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8' }} />
                  <div style={{ width: '28px', height: '28px', borderBottom: '4px solid #38bdf8', borderRight: '4px solid #38bdf8' }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>Scanning Product...</span>
            </div>

            <button
              type="button"
              onClick={stopScanner}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel Camera
            </button>
          </div>
        )}

        {/* 4. QR Detected Confirmation */}
        {scannerState === 'detected' && (
          <div style={{ padding: '30px 10px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#dcfce7',
              margin: '0 auto 12px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#15803d' }}>QR Code Detected</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Verifying warranty authenticity...</div>
          </div>
        )}

        {/* 5. Error State */}
        {scannerState === 'error' && (
          <div style={{ padding: '16px 8px' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: '#fee2e2',
              margin: '0 auto 12px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626'
            }}>
              <CameraOff size={28} />
            </div>

            <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#991b1b', marginBottom: '6px' }}>
              Camera Unavailable
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.4 }}>
              {errorMessage}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={startScanner}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Try Camera Again
              </button>

              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1.5px solid var(--border-medium)',
                  color: '#334155',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Enter Code Manually
              </button>
            </div>
          </div>
        )}

        {/* Manual Token Entry Toggle */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          {!showManualInput ? (
            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Keyboard size={15} />
              Have a verification token or link? Enter manually
            </button>
          ) : (
            <form onSubmit={handleManualSubmit} style={{ marginTop: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px', textAlign: 'left' }}>
                Paste Verification URL or Token:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. w_abc123... or full verify URL"
                  required
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-medium)',
                    fontSize: '0.84rem',
                    color: '#0f172a'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Verify
                </button>
              </div>
            </form>
          )}
        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default CustomerWarrantyScanner;

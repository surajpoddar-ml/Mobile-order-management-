import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  X,
  Sparkles,
  QrCode,
  ShieldCheck,
  Check,
  Copy
} from 'lucide-react';
import { downloadAllAsZip, downloadSingleCard } from '../../utils/qrCardGenerator';

export const PrintQRCodesModal = ({ isOpen, onClose, tokens = [] }) => {
  const [qrImages, setQrImages] = useState({}); // { [tokenId]: dataUrl }
  const [copiedId, setCopiedId] = useState(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (!isOpen || !Array.isArray(tokens) || tokens.length === 0) return;

    let isMounted = true;
    const generateAllImages = async () => {
      const map = {};
      for (const tok of tokens) {
        try {
          const url = await QRCode.toDataURL(tok.token, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 340,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });
          map[tok.id] = url;
        } catch (e) {
          console.warn('QR gen error:', e);
        }
      }
      if (isMounted) setQrImages(map);
    };

    generateAllImages();
    return () => {
      isMounted = false;
    };
  }, [isOpen, tokens]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadAllZip = async () => {
    if (!tokens || tokens.length === 0) return;
    setZipLoading(true);
    setZipProgress({ current: 0, total: tokens.length });
    try {
      await downloadAllAsZip(tokens, `MWS-Eagle-${tokens.length}-QR-Cards.zip`, (cur, tot) => {
        setZipProgress({ current: cur, total: tot });
      });
    } catch (err) {
      console.error('ZIP Error:', err);
      alert('Failed to package cards: ' + (err.message || 'Unknown error'));
    } finally {
      setZipLoading(false);
    }
  };

  const handleDownloadSingle = (token) => {
    downloadSingleCard(token);
  };

  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token.token);
    setCopiedId(token.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (!isOpen || !Array.isArray(tokens) || tokens.length === 0) return null;

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
        className="print-modal-container"
        style={{
          width: '100%',
          maxWidth: '820px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
      >
        {/* Modal Header (Hidden on print) */}
        <div
          className="no-print"
          style={{
            padding: '16px 24px',
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
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Printer size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                Print & Download QR Reward Codes
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {tokens.length} offer code{tokens.length > 1 ? 's' : ''} ready for printing / packaging inserts
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={zipLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: zipLoading ? 'not-allowed' : 'pointer',
                opacity: zipLoading ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 10px rgba(5, 150, 105, 0.3)'
              }}
            >
              <Download size={15} />
              <span>
                {zipLoading
                  ? `Zipping (${zipProgress.current}/${zipProgress.total})...`
                  : `Download All (${tokens.length}) as ZIP`}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
              }}
            >
              <Printer size={15} />
              <span>Print Sheet</span>
            </button>

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
        </div>

        {/* Scrollable Printable Cards Grid */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            backgroundColor: '#f8fafc'
          }}
        >
          <div
            className="printable-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: tokens.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
              maxWidth: tokens.length === 1 ? '380px' : '100%',
              margin: '0 auto'
            }}
          >
            {tokens.map((tok) => {
              const dataUrl = qrImages[tok.id] || tok.qrDataUrl;
              const isCopied = copiedId === tok.id;

              return (
                <div
                  key={tok.id}
                  className="printable-qr-card"
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    border: '2px solid #e2e8f0',
                    padding: '20px',
                    textAlign: 'center',
                    boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid'
                  }}
                >
                  {/* Brand Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <img
                      src="/mws_eagle_logo.jpg?v=3"
                      alt="MWS Eagle"
                      style={{ height: '24px', borderRadius: '4px' }}
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', letterSpacing: '0.02em' }}>
                      MWS EAGLE
                    </div>
                  </div>

                  {/* Points Badge */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '0.88rem',
                      padding: '5px 14px',
                      borderRadius: '20px',
                      marginBottom: '12px',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Sparkles size={14} />
                    <span>{tok.points} REWARD POINTS</span>
                  </div>

                  {/* QR Image Display */}
                  <div
                    style={{
                      width: '180px',
                      height: '180px',
                      padding: '10px',
                      backgroundColor: '#ffffff',
                      borderRadius: '14px',
                      border: '1.5px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)'
                    }}
                  >
                    {dataUrl ? (
                      <img
                        src={dataUrl}
                        alt={`QR Code ${tok.token}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Generating QR...</div>
                    )}
                  </div>

                  {/* Token alphanumeric ID */}
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      letterSpacing: '0.06em',
                      background: '#f1f5f9',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      marginBottom: '6px'
                    }}
                  >
                    {tok.token}
                  </div>

                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '14px' }}>
                    Scan with MWS Eagle App to earn instant points!
                  </div>

                  {/* Quick Card Action Buttons (Hidden on print) */}
                  <div className="no-print" style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(tok)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#059669',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                      title="Download Branded Card PNG"
                    >
                      <Download size={12} />
                      <span>Card PNG</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyToken(tok)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: isCopied ? '#f0fdf4' : '#ffffff',
                        color: isCopied ? '#16a34a' : '#334155',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                      title="Copy Code"
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Print CSS Stylesheet */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-modal-container,
            .print-modal-container * {
              visibility: visible;
            }
            .print-modal-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border: none !important;
            }
            .no-print {
              display: none !important;
            }
            .printable-grid {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 20px !important;
            }
            .printable-qr-card {
              border: 1.5px solid #000000 !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PrintQRCodesModal;

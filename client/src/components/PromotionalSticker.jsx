import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getMediaUrl } from '../services/api';

export const PromotionalSticker = () => {
  const { navigate } = useAuth();
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveStickers = () => {
    api.stickers.getActive()
      .then(res => {
        if (res && res.success && Array.isArray(res.stickers)) {
          setStickers(res.stickers);
        } else {
          setStickers([]);
        }
      })
      .catch(err => {
        // Silently handle if offline or not seeded
        setStickers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchActiveStickers();

    const handleSync = () => fetchActiveStickers();
    window.addEventListener('mws_stickers_updated', handleSync);
    window.addEventListener('storage', (e) => {
      if (e.key === 'mws_stickers_last_update') fetchActiveStickers();
    });

    return () => {
      window.removeEventListener('mws_stickers_updated', handleSync);
    };
  }, []);

  // DO NOT show anything if no stickers are active or uploaded by Admin (per prompt requirement: never invent a default sticker!)
  if (loading || !stickers.length) {
    return null;
  }

  // Display the active promotional stickers
  return (
    <section
      id="promotional-sticker-section"
      style={{
        maxWidth: '1240px',
        margin: '12px auto 28px auto',
        padding: '0 16px'
      }}
      aria-label="Promotional Announcement Strip"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {stickers.map((st) => (
          <div
            key={st.id}
            onClick={() => {
              if (st.linkUrl) {
                if (st.linkUrl.startsWith('http')) {
                  window.open(st.linkUrl, '_blank');
                } else {
                  navigate(st.linkUrl);
                }
              }
            }}
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: st.linkUrl ? 'pointer' : 'default',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              maxHeight: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (st.linkUrl) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.09)';
              }
            }}
            onMouseLeave={(e) => {
              if (st.linkUrl) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
              }
            }}
          >
            <img
              src={getMediaUrl(st.imageUrl)}
              alt={st.title || 'MWS Eagle Promotional Announcement'}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '135px',
                objectFit: 'cover',
                display: 'block'
              }}
              onError={(e) => {
                // If broken link, hide rather than showing broken image
                e.currentTarget.parentElement.style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PromotionalSticker;

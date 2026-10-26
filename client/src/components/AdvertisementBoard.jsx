import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getMediaUrl } from '../services/api';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Sparkles,
  Film,
  Image as ImageIcon
} from 'lucide-react';

export const AdvertisementBoard = () => {
  const { navigate } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const videoRefs = useRef({});
  const timerRef = useRef(null);

  // Fetch active advertisements
  const fetchAds = () => {
    api.advertisements.getActive()
      .then(res => {
        if (res.success && res.advertisements?.length > 0) {
          setAds(res.advertisements);
        } else {
          setAds([]);
        }
      })
      .catch(err => console.warn('Could not load advertisements:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAds();
    const handleSync = () => fetchAds();
    window.addEventListener('mws_ads_updated', handleSync);
    window.addEventListener('storage', (e) => {
      if (e.key === 'mws_ads_last_update') fetchAds();
    });
    return () => {
      window.removeEventListener('mws_ads_updated', handleSync);
    };
  }, []);

  // Autoplay slider logic (auto-advances unless paused)
  useEffect(() => {
    if (!ads.length || !isPlaying) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ads.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ads.length, isPlaying, currentIndex]);

  // Handle video element playback when active slide changes
  useEffect(() => {
    if (!ads.length) return;
    const currentAd = ads[currentIndex];

    // Pause all other videos
    Object.keys(videoRefs.current).forEach(id => {
      const vid = videoRefs.current[id];
      if (vid && id !== String(currentAd.id)) {
        try { vid.pause(); } catch (e) {}
      }
    });

    // Play active video if it is a video ad
    if (currentAd && currentAd.mediaType === 'video') {
      const activeVid = videoRefs.current[currentAd.id];
      if (activeVid) {
        activeVid.muted = isMuted;
        activeVid.play().catch(() => {});
      }
    }
  }, [currentIndex, ads, isMuted]);

  const handlePrev = () => {
    if (!ads.length) return;
    setCurrentIndex(prev => (prev - 1 + ads.length) % ads.length);
  };

  const handleNext = () => {
    if (!ads.length) return;
    setCurrentIndex(prev => (prev + 1) % ads.length);
  };

  // Touch Swipe handlers for comfortable mobile scrolling
  const minSwipeDistance = 45;
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();
  };

  // If loading or if admin has not inserted any advertisement, remain blank / show nothing
  const activeAds = (ads || []).filter(a => a && a.mediaUrl);
  if (loading || activeAds.length === 0) {
    return null;
  }

  const currentAd = activeAds[currentIndex % activeAds.length] || activeAds[0];
  // Determine mediaUrl using dynamic API helper (ensures backend origin is resolved for /uploads/...)
  const getFullMediaUrl = (url) => {
    if (!url) return '';
    return getMediaUrl(url);
  };

  return (
    <section
      style={{
        maxWidth: '1240px',
        margin: '6px auto 20px auto',
        padding: '0 16px',
        position: 'relative'
      }}
      aria-label="Interactive Advertisement Board"
    >
      {/* Board Controls Bar (Clean minimal controls without bulky text headers) */}
      {ads.length > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '6px',
          marginBottom: '6px',
          paddingRight: '4px'
        }}>
          {/* Autoplay Pause / Play toggle */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause auto-scroll' : 'Resume auto-scroll'}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '4px 8px',
              fontSize: '0.74rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '6px'
            }}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>

          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            className="btn btn-secondary btn-sm"
            style={{ width: '30px', height: '30px', padding: 0, borderRadius: '50%' }}
            aria-label="Previous advertisement"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Slide counter indicator */}
          <div style={{
            fontSize: '0.76rem',
            fontWeight: 700,
            color: 'var(--text-body)',
            padding: '0 2px',
            minWidth: '34px',
            textAlign: 'center'
          }}>
            {currentIndex + 1} / {ads.length}
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="btn btn-secondary btn-sm"
            style={{ width: '30px', height: '30px', padding: 0, borderRadius: '50%' }}
            aria-label="Next advertisement"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Main Advertisement Showcase Card (Touch swipe enabled) */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => {
          if (currentAd?.linkUrl) {
            if (currentAd.linkUrl.startsWith('http')) {
              window.open(currentAd.linkUrl, '_blank');
            } else {
              navigate(currentAd.linkUrl);
            }
          }
        }}
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          background: 'transparent',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          cursor: currentAd?.linkUrl ? 'pointer' : 'default',
          width: '100%'
        }}
      >
        {/* Media Frame (Image or Video) - Full responsive banner */}
        <div style={{
          position: 'relative',
          width: '100%',
          background: 'transparent',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'inherit'
        }}>
          {currentAd.mediaType === 'video' ? (
            <video
              ref={el => { if (el) videoRefs.current[currentAd.id] = el; }}
              src={getFullMediaUrl(currentAd.mediaUrl)}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '460px',
                display: 'block',
                objectFit: 'contain',
                borderRadius: 'inherit'
              }}
              playsInline
              loop
              autoPlay
              muted={isMuted}
              onError={(e) => {
                const cur = e.currentTarget.src || '';
                if (!e.currentTarget.dataset.retried && cur.includes('/uploads/')) {
                  e.currentTarget.dataset.retried = 'true';
                  const uploadRel = '/uploads/' + cur.split('/uploads/')[1];
                  e.currentTarget.src = cur.startsWith('http') ? uploadRel : getMediaUrl(uploadRel);
                }
              }}
            />
          ) : (
            <img
              src={getFullMediaUrl(currentAd.mediaUrl)}
              alt={currentAd.title ? `${currentAd.title} - MWS Eagle` : 'MWS Eagle'}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '460px',
                display: 'block',
                objectFit: 'contain',
                borderRadius: 'inherit'
              }}
              onError={(e) => {
                const cur = e.currentTarget.src || '';
                if (!e.currentTarget.dataset.retried && cur.includes('/uploads/')) {
                  e.currentTarget.dataset.retried = 'true';
                  const uploadRel = '/uploads/' + cur.split('/uploads/')[1];
                  e.currentTarget.src = getMediaUrl(uploadRel);
                  return;
                }
                // If uploaded asset is not found on server, fallback to official verified banner
                if (!cur.includes('mws_main_banner.jpg')) {
                  e.currentTarget.src = '/mws_main_banner.jpg';
                }
              }}
            />
          )}

          {/* Sound mute/unmute control for video ads */}
          {currentAd.mediaType === 'video' && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                title={isMuted ? 'Unmute video audio' : 'Mute video audio'}
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s, transform 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} color="#38bdf8" />}
              </button>
            </div>
          )}

          {/* Clean minimal dot indicators when multiple ads exist */}
          {activeAds.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              zIndex: 10,
              pointerEvents: 'none'
            }}>
              {activeAds.map((ad, idx) => {
                const active = idx === (currentIndex % activeAds.length);
                return (
                  <button
                    key={ad.id || idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    style={{
                      height: '5px',
                      width: active ? '18px' : '5px',
                      borderRadius: 'var(--radius-full)',
                      background: active ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      padding: 0,
                      pointerEvents: 'auto'
                    }}
                    title={ad.title}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdvertisementBoard;

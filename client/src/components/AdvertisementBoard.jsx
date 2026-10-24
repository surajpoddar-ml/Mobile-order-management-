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
  useEffect(() => {
    let isMounted = true;
    api.advertisements.getActive()
      .then(res => {
        if (isMounted && res.success && res.advertisements?.length > 0) {
          setAds(res.advertisements);
        }
      })
      .catch(err => console.warn('Could not load advertisements:', err))
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
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

  if (loading) {
    return (
      <div style={{
        maxWidth: '1240px',
        margin: '20px auto 40px auto',
        padding: '0 16px'
      }}>
        <div style={{
          height: '360px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(110deg, #ede8de 8%, #f6f1e9 18%, #ede8de 33%)',
          backgroundSize: '200% 100%',
          animation: 'shine 1.5s linear infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)'
        }}>
          Loading live showcase board...
        </div>
      </div>
    );
  }

  if (!ads.length) {
    return null;
  }

  const currentAd = ads[currentIndex];
  // Determine mediaUrl using dynamic API helper
  const getFullMediaUrl = (url) => getMediaUrl(url);

  return (
    <section
      style={{
        maxWidth: '1240px',
        margin: '10px auto 50px auto',
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
          gap: '8px',
          marginBottom: '10px'
        }}>
          {/* Autoplay Pause / Play toggle */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause auto-scroll' : 'Resume auto-scroll'}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '6px 10px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span style={{ display: 'none', '@media (min-width: 640px)': { display: 'inline' } }}>
              {isPlaying ? 'Pause' : 'Play'}
            </span>
          </button>

          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            className="btn btn-secondary btn-sm"
            style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%' }}
            aria-label="Previous advertisement"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Slide counter indicator */}
          <div style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--text-body)',
            padding: '0 4px',
            minWidth: '40px',
            textAlign: 'center'
          }}>
            {currentIndex + 1} / {ads.length}
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="btn btn-secondary btn-sm"
            style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%' }}
            aria-label="Next advertisement"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Main Advertisement Showcase Card (Touch swipe enabled) */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          background: '#0f172a',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-medium)',
          minHeight: '340px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Media Frame (Image or Video) */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(260px, 45vw, 460px)',
          background: '#090d16',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {currentAd.mediaType === 'video' ? (
            <video
              ref={el => { if (el) videoRefs.current[currentAd.id] = el; }}
              src={getFullMediaUrl(currentAd.mediaUrl)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              playsInline
              loop
              autoPlay
              muted={isMuted}
            />
          ) : (
            <img
              src={getFullMediaUrl(currentAd.mediaUrl)}
              alt={currentAd.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s ease'
              }}
              onError={(e) => {
                // Fallback graceful graphic if image URL broken
                e.currentTarget.src = 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=1200&q=80';
              }}
            />
          )}

          {/* Dark gradient overlay for text readability */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.55) 45%, rgba(0, 0, 0, 0.25) 100%)',
            pointerEvents: 'none'
          }} />

          {/* Top badges & media type indicator */}
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Badge Tag */}
              <span style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#ffffff',
                fontSize: '0.74rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                textTransform: 'uppercase'
              }}>
                {currentAd.badgeText || 'HOT DEAL'}
              </span>

              {/* Media format pill */}
              <span style={{
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(8px)',
                color: '#f8fafc',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                {currentAd.mediaType === 'video' ? <Film size={12} color="#38bdf8" /> : <ImageIcon size={12} color="#4ade80" />}
                {currentAd.mediaType === 'video' ? 'Interactive Video' : 'HD Showcase'}
              </span>
            </div>

            {/* Video sound mute/unmute control */}
            {currentAd.mediaType === 'video' && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Unmute video audio' : 'Mute video audio'}
                style={{
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
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
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} color="#38bdf8" />}
              </button>
            )}
          </div>

          {/* Bottom Card Content overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px 20px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <h3 style={{
              fontSize: 'clamp(1.15rem, 3.2vw, 1.8rem)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.25,
              margin: 0,
              textShadow: '0 2px 10px rgba(0,0,0,0.7)'
            }}>
              {currentAd.title}
            </h3>

            {currentAd.description && (
              <p style={{
                fontSize: 'clamp(0.85rem, 2vw, 0.98rem)',
                color: '#cbd5e1',
                lineHeight: 1.45,
                maxWidth: '750px',
                margin: 0,
                textShadow: '0 1px 6px rgba(0,0,0,0.6)'
              }}>
                {currentAd.description}
              </p>
            )}

            {/* Action CTA */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '6px'
            }}>
              <button
                onClick={() => navigate(currentAd.linkUrl || '/login')}
                className="btn btn-primary"
                style={{
                  padding: '9px 20px',
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Explore Details
                <ExternalLink size={14} />
              </button>

              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(6px)',
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              >
                Sign In to Portal
              </button>
            </div>
          </div>
        </div>

        {/* Thumbnail & Dot Navigation Bar at bottom */}
        <div style={{
          background: '#090d16',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          overflowX: 'auto'
        }}>
          {/* Dots / Mini pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {ads.map((ad, idx) => {
              const active = idx === currentIndex;
              return (
                <button
                  key={ad.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    height: '8px',
                    width: active ? '28px' : '9px',
                    borderRadius: 'var(--radius-full)',
                    background: active ? '#4f46e5' : 'rgba(255, 255, 255, 0.25)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    padding: 0
                  }}
                  title={ad.title}
                  aria-label={`Go to slide ${idx + 1}: ${ad.title}`}
                />
              );
            })}
          </div>

          <div style={{
            fontSize: '0.74rem',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#22c55e',
              animation: 'pulseGlow 2s infinite'
            }} />
            Swipe or use arrows to view all {ads.length} promotions
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvertisementBoard;

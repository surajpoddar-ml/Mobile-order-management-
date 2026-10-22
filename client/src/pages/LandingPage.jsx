import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdvertisementBoard from '../components/AdvertisementBoard';
import {
  ShieldCheck,
  Zap,
  Package,
  Users,
  ArrowRight,
  Smartphone,
  Battery,
  Cable,
  Monitor,
  Headphones,
  Plug,
  ChevronRight,
  Star,
  TrendingUp,
  Globe,
  Award,
  CheckCircle2
} from 'lucide-react';

export const LandingPage = () => {
  const { navigate } = useAuth();
  const [currentCategory, setCurrentCategory] = useState(0);

  const categories = [
    { icon: Monitor, label: 'Displays & Screens', count: '200+ SKUs', color: '#4f46e5' },
    { icon: Battery, label: 'Batteries', count: '150+ SKUs', color: '#059669' },
    { icon: Cable, label: 'Cables & Chargers', count: '300+ SKUs', color: '#0284c7' },
    { icon: Headphones, label: 'Earphones & Audio', count: '80+ SKUs', color: '#d97706' },
    { icon: Plug, label: 'Connectors & Ports', count: '120+ SKUs', color: '#db2777' },
    { icon: Smartphone, label: 'Power Banks', count: '50+ SKUs', color: '#7c3aed' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCategory(prev => (prev + 1) % categories.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Active Products', value: '1,200+', icon: Package, color: '#4f46e5' },
    { label: 'Verified Distributors', value: '500+', icon: Users, color: '#0284c7' },
    { label: 'Coverage Hubs', value: '45+ Regions', icon: Globe, color: '#059669' },
    { label: 'Verified Ratings', value: '99.4% Positive', icon: Star, color: '#d97706' },
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: 'Verified Distributors Only',
      desc: 'Every wholesale distributor undergoes strict admin license & PAN/VAT review before obtaining marketplace access.',
      color: '#4f46e5',
      bg: 'rgba(79, 70, 229, 0.08)'
    },
    {
      icon: Zap,
      title: 'Fast Order Fulfillment',
      desc: 'Genuine OEM-grade components dispatched within 24 hours with real-time tracking and logistics priority.',
      color: '#059669',
      bg: 'rgba(5, 150, 105, 0.08)'
    },
    {
      icon: TrendingUp,
      title: 'Competitive Wholesale Tiers',
      desc: 'Approved distributors access wholesale tier pricing and bulk box lots hidden from general retail customers.',
      color: '#0284c7',
      bg: 'rgba(2, 132, 199, 0.08)'
    },
    {
      icon: Award,
      title: 'Certified OEM & Tested Spares',
      desc: 'All spare screens, batteries, and IC chips undergo lab testing with role-segregated visibility and warranty.',
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.08)'
    },
  ];

  return (
    <div style={{ overflowX: 'hidden' }}>
      {/* ====== HERO SECTION ====== */}
      <section style={{
        minHeight: '82vh',
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(32px, 6vw, 64px) 20px clamp(20px, 4vw, 40px) 20px',
        position: 'relative'
      }}>
        {/* Soft decorative background glows */}
        <div style={{
          position: 'absolute',
          top: '5%', left: '3%',
          width: 'clamp(280px, 40vw, 500px)', height: 'clamp(280px, 40vw, 500px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.07) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '5%', right: '3%',
          width: 'clamp(240px, 35vw, 420px)', height: 'clamp(240px, 35vw, 420px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'clamp(32px, 5vw, 60px)',
          alignItems: 'center'
        }}>
          {/* LEFT: Text Content */}
          <div className="animate-fade-in">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(79, 70, 229, 0.08)',
              border: '1px solid rgba(79, 70, 229, 0.25)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              marginBottom: '20px',
              fontSize: '0.82rem',
              color: 'var(--primary)',
              fontWeight: 700
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} className="pulse-indicator" />
              Official B2B & Retail Mobile Spares Marketplace
            </div>

            <h1 style={{
              fontSize: 'clamp(2.1rem, 5vw, 3.6rem)',
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              color: 'var(--text-main)',
              marginBottom: '18px'
            }}>
              MWS EAGLE
              <span style={{
                display: 'block',
                background: 'linear-gradient(135deg, #4f46e5, #0284c7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Mobile Parts Hub
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(0.98rem, 2vw, 1.15rem)',
              color: 'var(--text-body)',
              lineHeight: 1.65,
              marginBottom: '30px',
              maxWidth: '520px'
            }}>
              Premium smartphone displays, OEM replacement batteries, high-speed cables, and wholesale spares. Connected through role-based access for Customers and Approved Distributors.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
              <button
                onClick={() => navigate('/login?mode=signup&role=Customer')}
                className="btn btn-primary"
                style={{ padding: '13px 26px', fontSize: '0.94rem' }}
              >
                Join as Customer <ArrowRight size={16} />
              </button>

              <button
                onClick={() => navigate('/login?mode=signup&role=Distributor')}
                className="btn btn-sky"
                style={{ padding: '13px 24px', fontSize: '0.94rem' }}
              >
                Apply as Distributor
              </button>

              <button
                onClick={() => navigate('/login')}
                className="btn btn-secondary"
                style={{ padding: '13px 20px', fontSize: '0.94rem' }}
              >
                Sign In
              </button>
            </div>

            {/* Micro Highlights */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              flexWrap: 'wrap',
              fontSize: '0.84rem',
              color: 'var(--text-muted)',
              fontWeight: 600
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={16} color="#059669" /> Instant Customer Activation
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={16} color="#0284c7" /> Verified Distributor Tier
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={16} color="#4f46e5" /> 100% Genuine Quality
              </span>
            </div>
          </div>

          {/* RIGHT: Featured Category Interactive Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="glass-panel" style={{
              padding: '28px',
              background: '#ffffff',
              border: `1.5px solid ${categories[currentCategory].color}40`,
              boxShadow: 'var(--shadow-card)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: 0, right: 0, width: '130px', height: '130px',
                background: `radial-gradient(circle, ${categories[currentCategory].color}18 0%, transparent 70%)`,
                borderRadius: '50%', pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div style={{
                  width: '56px', height: '56px',
                  borderRadius: '16px',
                  background: `${categories[currentCategory].color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: categories[currentCategory].color,
                  boxShadow: `0 4px 14px ${categories[currentCategory].color}25`
                }}>
                  {React.createElement(categories[currentCategory].icon, { size: 28 })}
                </div>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: categories[currentCategory].color,
                  background: `${categories[currentCategory].color}12`,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {categories[currentCategory].count}
                </span>
              </div>

              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Category Spotlight
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 10px 0' }}>
                {categories[currentCategory].label}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.5, margin: 0 }}>
                High-demand original and OEM compatible replacement parts. Available for immediate retail ordering or bulk wholesale box dispatch.
              </p>

              {/* Category indicator dots */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '20px' }}>
                {categories.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentCategory(i)}
                    style={{
                      width: i === currentCategory ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: i === currentCategory ? categories[currentCategory].color : 'var(--border-medium)',
                      border: 'none',
                      transition: 'all 0.3s',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    aria-label={`Category ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Quick Category Chips Grid (Full touch responsive) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px'
            }}>
              {categories.map((cat, i) => {
                const isSelected = i === currentCategory;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentCategory(i)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? `${cat.color}15` : '#ffffff',
                      border: `1px solid ${isSelected ? cat.color : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {React.createElement(cat.icon, { size: 18, color: cat.color })}
                    <span style={{
                      fontSize: '0.73rem',
                      color: isSelected ? cat.color : 'var(--text-body)',
                      fontWeight: isSelected ? 700 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%'
                    }}>
                      {cat.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ====== ADVERTISEMENT BOARD (VIDEO & IMAGE SCROLLER) ====== */}
      <AdvertisementBoard />

      {/* ====== STATS BAR ====== */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto 60px auto',
        padding: '0 16px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          {stats.map((s, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '6px' }}>
              <div style={{
                width: '46px', height: '46px',
                borderRadius: '12px',
                background: `${s.color}14`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.color, flexShrink: 0
              }}>
                {React.createElement(s.icon, { size: 22 })}
              </div>
              <div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== FEATURES SECTION ====== */}
      <section style={{
        padding: '60px 20px',
        background: 'rgba(120, 95, 55, 0.04)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '8px'
            }}>
              Platform Capabilities
            </div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.3rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-main)',
              marginBottom: '10px'
            }}>
              Engineered for Wholesale Scale & Reliability
            </h2>
            <p style={{
              color: 'var(--text-body)',
              fontSize: '0.96rem',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              MWS EAGLE operates an enterprise-grade mobile parts marketplace with verified distributors, strict quality checks, and role visibility.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px'
          }}>
            {features.map((feat, i) => (
              <div
                key={i}
                className="glass-panel"
                style={{
                  padding: '24px',
                  background: '#ffffff',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <div style={{
                  width: '48px', height: '48px',
                  borderRadius: '12px',
                  background: feat.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px',
                  color: feat.color
                }}>
                  {React.createElement(feat.icon, { size: 24 })}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  {feat.title}
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== TWO PORTALS SELECTOR CTA ====== */}
      <section style={{ padding: '70px 20px' }}>
        <div style={{
          maxWidth: '1060px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '28px'
        }}>
          {/* Customer Portal Card */}
          <div className="glass-panel" style={{
            padding: '32px',
            background: '#ffffff',
            border: '1.5px solid rgba(5, 150, 105, 0.25)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: '52px', height: '52px',
                borderRadius: '14px',
                background: 'rgba(5, 150, 105, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '18px',
                color: '#059669'
              }}>
                <Users size={26} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Instant Access
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 10px 0' }}>
                Customer Portal
              </h3>
              <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '20px' }}>
                Direct sign up with immediate login. Browse genuine smartphone accessories, cables, screen protectors, and audio accessories at retail pricing.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Instant sign up & immediate login',
                  'Customer-specific retail catalog',
                  'Quality guaranteed spare parts',
                  'Fast doorstep dispatch'
                ].map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                    <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => navigate('/login?mode=signup&role=Customer')}
              className="btn btn-emerald"
              style={{ width: '100%', padding: '12px' }}
            >
              Sign Up as Customer
            </button>
          </div>

          {/* Distributor Portal Card */}
          <div className="glass-panel" style={{
            padding: '32px',
            background: '#ffffff',
            border: '1.5px solid rgba(2, 132, 199, 0.25)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: '52px', height: '52px',
                borderRadius: '14px',
                background: 'rgba(2, 132, 199, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '18px',
                color: '#0284c7'
              }}>
                <Package size={26} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Wholesale Application
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 10px 0' }}>
                Distributor Portal
              </h3>
              <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '20px' }}>
                Wholesale dealer registration. Submit your business credentials and PAN/VAT number for admin review to unlock wholesale lots and exclusive inventory.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Admin review & verification workflow',
                  'Exclusive wholesale box pricing',
                  'Distributor-only component assemblies',
                  'Bulk logistics & invoice processing'
                ].map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                    <CheckCircle2 size={16} color="#0284c7" style={{ flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => navigate('/login?mode=signup&role=Distributor')}
              className="btn btn-sky"
              style={{ width: '100%', padding: '12px' }}
            >
              Apply as Distributor
            </button>
          </div>
        </div>
      </section>

      {/* ====== BOTTOM CALLOUT ====== */}
      <section style={{
        padding: '50px 20px',
        background: '#ffffff',
        borderTop: '1px solid var(--border-subtle)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginBottom: '12px'
          }}>
            Ready to Elevate Your Mobile Spares Supply?
          </h2>
          <p style={{ color: 'var(--text-body)', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: '26px' }}>
            Access genuine smartphone spares, wholesale pricing tiers, and fast priority fulfillment today.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ padding: '12px 30px', fontSize: '0.95rem' }}
            >
              Sign In to Your Account <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

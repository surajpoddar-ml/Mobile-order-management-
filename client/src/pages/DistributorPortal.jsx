import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Building2, ShieldCheck, Layers, Eye, Lock, CheckCircle, MapPin, Briefcase, Phone, Mail
} from 'lucide-react';

export const DistributorPortal = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    api.products.getVisibleProducts()
      .then(res => { if (res.success) setProducts(res.products); })
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filtered = filterCategory === 'All' ? products : products.filter(p => p.category === filterCategory);

  return (
    <div style={{ maxWidth: '1240px', margin: '32px auto 80px', padding: '0 20px' }}>

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 60%)',
        border: '1px solid rgba(2, 132, 199, 0.2)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span className="badge badge-distributor"><Building2 size={11} /> Approved Wholesale Partner</span>
              <span className="badge badge-active"><CheckCircle size={11} /> {user?.accountStatus}</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              {user?.businessName || user?.fullName}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '580px', lineHeight: 1.6 }}>
              Wholesale distributor trade terminal. Access bulk supplier lots, technician replacement modules, and exclusive B2B dealer pricing.
            </p>
          </div>

          <div style={{
            background: '#ffffff', border: '1px solid rgba(2,132,199,0.15)',
            borderRadius: 'var(--radius-md)', padding: '16px 20px',
            fontSize: '0.82rem', lineHeight: '1.8', minWidth: '240px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ color: 'var(--distributor-accent)', fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={13} /> Verified Credentials
            </div>
            <div style={{ color: 'var(--text-body)' }}><strong>ID:</strong> <span style={{ color: 'var(--distributor-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{user?.userId}</span></div>
            <div style={{ color: 'var(--text-body)' }}><strong>PAN/VAT:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{user?.panVatNumber || 'N/A'}</span></div>
            <div style={{ color: 'var(--text-body)' }}><strong>Approved:</strong> {user?.approvalDate ? new Date(user.approvalDate).toLocaleDateString() : 'Active'}</div>
            <div style={{ color: 'var(--text-body)' }}><strong>By:</strong> {user?.approvedBy || 'Administrator'}</div>
          </div>
        </div>

        {/* Business Details Row */}
        <div style={{
          marginTop: '22px', paddingTop: '18px',
          borderTop: '1px solid rgba(2,132,199,0.12)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '0.83rem'
        }}>
          {[
            { Icon: MapPin, label: 'Business Address', value: user?.businessAddress },
            { Icon: Briefcase, label: 'Contact Person', value: user?.contactPerson || user?.fullName },
            { Icon: Phone, label: 'Business Phone', value: user?.businessPhone || user?.phoneNumber },
            { Icon: Mail, label: 'Business Email', value: user?.businessEmail || user?.email },
          ].map(({ Icon, label, value }) => (
            <div key={label} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Icon size={14} color="var(--distributor-accent)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1px' }}>{label}</div>
                <div style={{ color: 'var(--text-body)', fontWeight: 500 }}>{value || 'Not specified'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visibility Info Bar */}
      <div style={{
        background: '#ffffff', border: '1px solid rgba(2,132,199,0.15)',
        borderRadius: 'var(--radius-lg)', padding: '16px 22px', marginBottom: '28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--distributor-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--distributor-accent)', flexShrink: 0 }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              Distributor Wholesale Visibility Engine
              <span className="badge" style={{ background: 'var(--distributor-light)', color: 'var(--distributor-accent)', border: '1px solid rgba(2,132,199,0.2)', fontSize: '0.68rem' }}>Wholesale Tier</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Showing <strong>Distributor</strong> and <strong>Both</strong> tagged products with wholesale B2B pricing.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div className="badge badge-distributor"><Eye size={11} /> {products.length} Visible</div>
          <div className="badge badge-rejected"><Lock size={11} /> Retail Items: Hidden</div>
        </div>
      </div>

      {/* Catalog Header + Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '3px' }}>
            Wholesale Mobile Spares & Bulk Components
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.81rem' }}>
            Exclusive B2B dealer pricing for bulk assemblies, batteries, and technician repair trays.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)} className="btn btn-sm"
              style={{
                background: filterCategory === cat ? 'var(--distributor-accent)' : '#ffffff',
                color: filterCategory === cat ? '#ffffff' : 'var(--text-muted)',
                border: '1px solid var(--border-medium)',
                boxShadow: filterCategory === cat ? 'var(--shadow-sm)' : 'none'
              }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loadingProducts ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading wholesale catalog...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          No parts found in category "{filterCategory}".
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))', gap: '20px' }}>
          {filtered.map(p => (
            <div key={p.id}
              style={{
                background: '#ffffff', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)', padding: '20px',
                boxShadow: 'var(--shadow-xs)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'rgba(2,132,199,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{p.sku}</span>
                  <span className="badge" style={{
                    background: p.targetVisibility === 'Both' ? 'var(--primary-light)' : 'var(--distributor-light)',
                    color: p.targetVisibility === 'Both' ? 'var(--primary)' : 'var(--distributor-accent)',
                    border: `1px solid ${p.targetVisibility === 'Both' ? 'rgba(79,70,229,0.2)' : 'rgba(2,132,199,0.2)'}`,
                    fontSize: '0.66rem'
                  }}>
                    {p.targetVisibility === 'Both' ? 'Universal' : 'Distributor Exclusive'}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--distributor-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
                  {p.category}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '8px', color: 'var(--text-main)' }}>{p.name}</h3>
                <p style={{ fontSize: '0.81rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '16px' }}>{p.description}</p>
              </div>
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-dim)' }}>Dealer Wholesale </span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--distributor-accent)' }}>${p.price?.toFixed(2)}</span>
                </div>
                <span style={{ fontSize: '0.73rem', color: 'var(--distributor-accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={11} /> B2B Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

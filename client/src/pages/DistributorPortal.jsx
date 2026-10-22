import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Building2, 
  ShieldCheck, 
  Layers, 
  Eye, 
  Lock, 
  CheckCircle, 
  Briefcase, 
  MapPin, 
  FileText, 
  Phone, 
  Mail, 
  Calendar, 
  UserCheck 
} from 'lucide-react';

export const DistributorPortal = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.products.getVisibleProducts();
        if (res.success && res.products) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error('Error fetching distributor products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchCatalog();
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = filterCategory === 'All' 
    ? products 
    : products.filter(p => p.category === filterCategory);

  return (
    <div style={{ maxWidth: '1240px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Wholesale Header Banner */}
      <div 
        className="glass-panel" 
        style={{
          padding: '32px',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '28px',
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(15, 23, 42, 0.85))',
          border: '1px solid rgba(14, 165, 233, 0.25)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge badge-distributor">
                <Building2 size={12} /> Approved Wholesale Partner
              </span>
              <span className="badge badge-active">
                <CheckCircle size={12} /> Status: {user?.accountStatus}
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '6px' }}>
              {user?.businessName || user?.fullName}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '650px' }}>
              Wholesale distributor trade terminal. Access bulk supplier lots, technician replacement modules, special distributor volume discounts, and B2B ordering.
            </p>
          </div>

          {/* Verification Badge Box */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            fontSize: '0.82rem',
            lineHeight: '1.7',
            minWidth: '260px'
          }}>
            <div style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} /> Verified Distributor Credentials
            </div>
            <div><strong>Distributor ID:</strong> <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{user?.userId}</span></div>
            <div><strong>PAN/VAT:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{user?.panVatNumber || 'N/A'}</span></div>
            <div><strong>Approval Date:</strong> {user?.approvalDate ? new Date(user.approvalDate).toLocaleDateString() : 'Active'}</div>
            <div><strong>Authorized By:</strong> {user?.approvedBy || 'Master Administrator'}</div>
          </div>
        </div>

        {/* Business Information Grid */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <MapPin size={16} color="var(--distributor-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Business Address</div>
              <div style={{ color: 'var(--text-main)' }}>{user?.businessAddress || 'Not specified'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Briefcase size={16} color="var(--distributor-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Contact Person</div>
              <div style={{ color: 'var(--text-main)' }}>{user?.contactPerson || user?.fullName}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Phone size={16} color="var(--distributor-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Distributor Phone</div>
              <div style={{ color: 'var(--text-main)' }}>{user?.businessPhone || user?.phoneNumber}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Mail size={16} color="var(--distributor-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Official Business Email</div>
              <div style={{ color: 'var(--text-main)' }}>{user?.businessEmail || user?.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Visibility System Demonstration Card (Section 5 Requirement) */}
      <div 
        className="glass-panel" 
        style={{
          padding: '20px 24px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '28px',
          border: '1px solid rgba(14, 165, 233, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(14, 165, 233, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--distributor-accent)'
          }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Distributor Wholesale Visibility Engine</span>
              <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', fontSize: '0.7rem' }}>
                Wholesale Tier Active
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Displaying items tagged for <strong>Distributor</strong> and <strong>Both</strong>. Retail-only products are excluded from your bulk feed.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(14, 165, 233, 0.15)',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            fontSize: '0.8rem',
            color: '#38bdf8',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Eye size={14} /> Visible: {products.length} Products
          </div>

          <div style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            fontSize: '0.8rem',
            color: '#f87171',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Lock size={14} /> Retail Items: Hidden
          </div>
        </div>
      </div>

      {/* Catalog Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            Wholesale Mobile Spares & Bulk Components
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Exclusive B2B distributor pricing for assemblies, bulk batteries, and technician repair trays.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className="btn btn-sm"
              style={{
                background: filterCategory === cat ? 'var(--distributor-accent)' : 'rgba(255, 255, 255, 0.05)',
                color: filterCategory === cat ? '#ffffff' : 'var(--text-muted)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loadingProducts ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading wholesale distributor catalog...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No wholesale parts found under category "{filterCategory}".
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="glass-panel"
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {p.sku}
                  </span>
                  <span className="badge" style={{
                    fontSize: '0.68rem',
                    background: p.targetVisibility === 'Both' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                    color: p.targetVisibility === 'Both' ? '#818cf8' : '#38bdf8',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {p.targetVisibility === 'Both' ? 'Universal' : 'Distributor Exclusive'}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--distributor-accent)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {p.category}
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: '1.4', marginBottom: '8px', color: '#ffffff' }}>
                  {p.name}
                </h3>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                  {p.description}
                </p>
              </div>

              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Dealer Wholesale: </span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>
                      ${p.price?.toFixed(2)}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> B2B Verified
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

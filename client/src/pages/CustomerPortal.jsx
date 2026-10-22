import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  User, 
  Smartphone, 
  ShieldCheck, 
  Package, 
  Eye, 
  EyeOff, 
  Filter, 
  Tag, 
  Clock, 
  CheckCircle, 
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

export const CustomerPortal = () => {
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
        console.error('Error fetching customer products:', err);
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
      {/* Welcome Banner */}
      <div 
        className="glass-panel" 
        style={{
          padding: '32px',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '28px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.85))',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge badge-customer">
                <User size={12} /> Retail Customer Account
              </span>
              <span className="badge badge-active">
                <CheckCircle size={12} /> Status: {user?.accountStatus}
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '6px' }}>
              Welcome, {user?.fullName}!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '650px' }}>
              Your customer account gives you direct access to genuine mobile spare parts, consumer charging kits, replacement accessories, and rapid dispatch.
            </p>
          </div>

          {/* User Account ID & Quick Info Card */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            fontSize: '0.82rem',
            lineHeight: '1.7',
            minWidth: '240px'
          }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
              Account Dossier
            </div>
            <div><strong>User ID:</strong> <span style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>{user?.userId}</span></div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Phone:</strong> {user?.phoneNumber}</div>
            <div><strong>Member Since:</strong> {new Date(user?.createdDate).toLocaleDateString()}</div>
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
          border: '1px solid rgba(99, 102, 241, 0.2)',
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
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Role-Based Product Visibility Engine</span>
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: '0.7rem' }}>
                Active Filter
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Showing items tagged for <strong>Customer</strong> and <strong>Both</strong>. Distributor-only products (wholesale packs & technician parts) are hidden on this portal.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.8rem',
            color: '#34d399',
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
            <Lock size={14} /> Distributor Lots: Hidden
          </div>
        </div>
      </div>

      {/* Product Catalog Section */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            Customer Spare Parts & Accessories Catalog
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Genuine certified replacement mobile parts and accessories.
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
                background: filterCategory === cat ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
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
          Loading products with Customer permissions...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No products found under category "{filterCategory}".
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
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
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
                    background: p.targetVisibility === 'Both' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: p.targetVisibility === 'Both' ? '#818cf8' : '#34d399',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {p.targetVisibility === 'Both' ? 'Universal' : 'Retail Only'}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--customer-accent)', textTransform: 'uppercase', marginBottom: '4px' }}>
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
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Retail Price: </span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>
                      ${p.price?.toFixed(2)}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> In Stock
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

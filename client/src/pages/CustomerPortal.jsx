import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User, Package, Eye, Lock, CheckCircle, Layers, Filter
} from 'lucide-react';

export const CustomerPortal = () => {
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
        background: 'linear-gradient(135deg, #f0fdf8 0%, #ffffff 60%)',
        border: '1px solid rgba(5, 150, 105, 0.2)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span className="badge badge-customer"><User size={11} /> Retail Customer Account</span>
              <span className="badge badge-active"><CheckCircle size={11} /> {user?.accountStatus}</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              Welcome back, {user?.fullName}!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '580px', lineHeight: 1.6 }}>
              Browse genuine mobile spare parts, replacement accessories, and retail charging kits — all verified and ready for dispatch.
            </p>
          </div>

          <div style={{
            background: '#ffffff', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', padding: '16px 20px',
            fontSize: '0.82rem', lineHeight: '1.8', minWidth: '220px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Account Details</div>
            <div style={{ color: 'var(--text-body)' }}><strong>ID:</strong> <span style={{ color: 'var(--customer-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{user?.userId}</span></div>
            <div style={{ color: 'var(--text-body)' }}><strong>Email:</strong> {user?.email}</div>
            <div style={{ color: 'var(--text-body)' }}><strong>Phone:</strong> {user?.phoneNumber}</div>
            <div style={{ color: 'var(--text-body)' }}><strong>Member since:</strong> {new Date(user?.createdDate).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Product Visibility Info Bar */}
      <div style={{
        background: '#ffffff', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '16px 22px', marginBottom: '28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'var(--primary-light)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'var(--primary)', flexShrink: 0
          }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              Role-Based Product Visibility
              <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(79,70,229,0.15)', fontSize: '0.68rem' }}>Active Filter</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Showing <strong>Customer</strong> and <strong>Both</strong> tagged products. Distributor-only wholesale lots are hidden.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div className="badge badge-active"><Eye size={11} /> {products.length} Visible</div>
          <div className="badge badge-rejected"><Lock size={11} /> Distributor Lots: Hidden</div>
        </div>
      </div>

      {/* Catalog Header + Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '3px' }}>
            Spare Parts & Accessories Catalog
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.81rem' }}>
            Genuine certified replacement mobile parts and accessories at retail pricing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)} className="btn btn-sm"
              style={{
                background: filterCategory === cat ? 'var(--primary)' : '#ffffff',
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
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading products...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          No products in category "{filterCategory}".
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
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'rgba(5,150,105,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{p.sku}</span>
                  <span className="badge" style={{
                    background: p.targetVisibility === 'Both' ? 'var(--primary-light)' : 'var(--customer-light)',
                    color: p.targetVisibility === 'Both' ? 'var(--primary)' : 'var(--customer-accent)',
                    border: `1px solid ${p.targetVisibility === 'Both' ? 'rgba(79,70,229,0.2)' : 'rgba(5,150,105,0.2)'}`,
                    fontSize: '0.66rem'
                  }}>
                    {p.targetVisibility === 'Both' ? 'Universal' : 'Retail Only'}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--customer-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
                  {p.category}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '8px', color: 'var(--text-main)' }}>{p.name}</h3>
                <p style={{ fontSize: '0.81rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '16px' }}>{p.description}</p>
              </div>
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-dim)' }}>Retail Price </span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--customer-accent)' }}>${p.price?.toFixed(2)}</span>
                </div>
                <span style={{ fontSize: '0.73rem', color: 'var(--customer-accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={11} /> In Stock
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

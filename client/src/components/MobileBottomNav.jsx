import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Home, LayoutGrid, Heart, ShoppingCart, User } from 'lucide-react';

export const MobileBottomNav = () => {
  const { user, navigate, currentRoute } = useAuth();
  const {
    cartCount,
    wishlistCount,
    setIsCartOpen,
    setIsWishlistOpen
  } = useCart();

  // Hide on admin panel to preserve administrative view
  const isOnAdmin = currentRoute === '/admin' || currentRoute === '/admin-access' || currentRoute === '/portal/admin';
  if (isOnAdmin) return null;

  const path = currentRoute ? currentRoute.split('?')[0] : '/';
  const isHome = path === '/' || path === '/home';
  const isAccount = path === '/login' || path === '/customer' || path === '/portal/customer' || path === '/distributor' || path === '/portal/distributor';

  const handleHomeClick = () => {
    if (isHome) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (user?.role === 'Customer' || user?.userType === 'Customer') navigate('/customer');
      else if (user?.role === 'Distributor' || user?.userType === 'Distributor') navigate('/distributor');
      else navigate('/');
    }
  };

  const handleCategoriesClick = () => {
    // Open mobile menu drawer with full product categories arrangement
    window.dispatchEvent(new Event('mws_open_mobile_menu'));
    const el = document.getElementById('best-selling-products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAccountClick = () => {
    if (user) {
      const role = user.role || user.userType;
      if (role === 'Customer') navigate('/portal/customer');
      else if (role === 'Distributor') navigate('/portal/distributor');
      else if (role === 'Admin') navigate('/admin');
      else navigate('/login');
    } else {
      navigate('/login');
    }
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      isActive: isHome,
      onClick: handleHomeClick,
      badge: 0
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: LayoutGrid,
      isActive: false,
      onClick: handleCategoriesClick,
      badge: 0
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      icon: Heart,
      isActive: false,
      onClick: () => setIsWishlistOpen(true),
      badge: wishlistCount,
      badgeBg: '#ef4444'
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingCart,
      isActive: false,
      onClick: () => setIsCartOpen(true),
      badge: cartCount,
      badgeBg: '#ef4444'
    },
    {
      id: 'account',
      label: user ? (user.fullName ? user.fullName.split(' ')[0] : 'Account') : 'Account',
      icon: User,
      isActive: isAccount,
      onClick: handleAccountClick,
      badge: 0
    }
  ];

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '56px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.06)',
        zIndex: 1000,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        userSelect: 'none'
      }}
    >
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const active = item.isActive;
        const color = active ? '#0080ff' : '#64748b';

        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              position: 'relative',
              transition: 'transform 0.12s ease'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
            onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            aria-label={item.label}
          >
            {/* Icon Wrapper with Badge */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconComponent
                size={21}
                color={color}
                strokeWidth={active ? 2.4 : 1.9}
                fill={active && item.id === 'home' ? '#0080ff' : 'none'}
              />

              {/* Notification / Count Badge (e.g. Cart, Wishlist) */}
              {(item.id === 'cart' || item.badge > 0) && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    background: item.badgeBg || '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    minWidth: '17px',
                    height: '17px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    lineHeight: 1
                  }}
                >
                  {item.id === 'cart' && (!item.badge || item.badge <= 0) ? 0 : (item.badge > 99 ? '99+' : item.badge)}
                </span>
              )}
            </div>

            {/* Label */}
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: active ? 700 : 500,
                color: color,
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
                maxWidth: '68px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, FileText, ShoppingBag, Factory, ShieldAlert, Sparkles, X, Package, Receipt, Users, BarChart3, Truck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (tabId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelectAction }) => {
  const { rfqs, orders, customers, manufacturers, products, invoices } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const moduleActions = [
    { id: 'customer-verification', title: 'Customer Onboarding Verification', category: 'Compliance', icon: Users, shortcut: '⌘V' },
    { id: 'manufacturer-verification', title: 'Manufacturer Onboarding Verification', category: 'Compliance', icon: Factory, shortcut: '⌘M' },
    { id: 'trademark-verification', title: 'Trademark (TM) Verification Desk', category: 'Compliance', icon: FileText, shortcut: '⌘T' },
    { id: 'brand-verification', title: 'Brand Verification & LOA Authorization', category: 'Compliance', icon: ShieldAlert, shortcut: '⌘A' },
    { id: 'compliance', title: 'Regulatory Compliance & Audit Desk', category: 'Compliance', icon: ShieldAlert, shortcut: '⌘C' },
    { id: 'rfqs', title: 'Create New Multi-Line RFQ', category: 'Sourcing', icon: FileText, shortcut: '⌘R' },
    { id: 'quotes', title: 'Compare Manufacturer Quotes Matrix', category: 'Sourcing', icon: ShoppingBag, shortcut: '⌘Q' },
    { id: 'orders', title: 'Order Splitting & Manufacturing', category: 'Operations', icon: Truck, shortcut: '⌘O' },
    { id: 'shipments', title: 'Cold-Chain Shipment Telemetry', category: 'Logistics', icon: Truck, shortcut: '⌘S' },
    { id: 'manufacturers', title: 'Browse WHO-GMP Manufacturers', category: 'Directory', icon: Factory },
    { id: 'customers', title: 'Sales CRM & Customer Accounts', category: 'CRM', icon: Users, shortcut: '⌘K' },
    { id: 'invoices', title: 'Invoices & Accounts Ledger', category: 'Finance', icon: Receipt, shortcut: '⌘I' },
    { id: 'reports', title: 'Generate Executive Business Reports', category: 'BI', icon: BarChart3, shortcut: '⌘B' },
  ];

  // Global Context Search Matches
  const matchedRfqs = rfqs.filter(r => r.rfqNumber.toLowerCase().includes(query.toLowerCase()) || r.customerName.toLowerCase().includes(query.toLowerCase()));
  const matchedOrders = orders.filter(o => o.orderNumber.toLowerCase().includes(query.toLowerCase()) || o.customerName.toLowerCase().includes(query.toLowerCase()));
  const matchedCusts = customers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.code.toLowerCase().includes(query.toLowerCase()));
  const matchedMfgs = manufacturers.filter(m => m.companyName.toLowerCase().includes(query.toLowerCase()) || m.code.toLowerCase().includes(query.toLowerCase()));

  const filteredModules = moduleActions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh', paddingLeft: 16, paddingRight: 16 }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)' }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'relative',
            zIndex: 10000,
            width: '100%',
            maxWidth: 640,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-subtle)',
            overflow: 'hidden',
          }}
        >
          {/* Input Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <Search size={18} style={{ color: 'var(--c-primary)', flexShrink: 0 }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search RFQs, Master Orders, Customers, Manufacturers, or Actions..."
              className="ent-input"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: 14,
                fontWeight: 600,
              }}
            />
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          {/* Results List */}
          <div style={{ maxHeight: 380, overflowY: 'auto', padding: 12 }}>
            
            {/* Direct Context Results */}
            {query.trim() !== '' && (
              <div style={{ marginBottom: 12 }}>
                {matchedRfqs.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '4px 10px' }}>Matched RFQs</div>
                    {matchedRfqs.map(r => (
                      <div 
                        key={r.id} 
                        onClick={() => { onSelectAction('rfqs'); onClose(); }}
                        style={{ padding: '8px 10px', borderRadius: 6, display: 'flex', justifyContent: 'space-between', cursor: 'pointer', fontSize: 12.5 }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--c-primary)' }}>{r.rfqNumber} — {r.customerName}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>{r.lines.length} Line Items</span>
                      </div>
                    ))}
                  </div>
                )}

                {matchedOrders.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '4px 10px' }}>Matched Orders</div>
                    {matchedOrders.map(o => (
                      <div 
                        key={o.id} 
                        onClick={() => { onSelectAction('orders'); onClose(); }}
                        style={{ padding: '8px 10px', borderRadius: 6, display: 'flex', justifyContent: 'space-between', cursor: 'pointer', fontSize: 12.5 }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{o.orderNumber} — {o.customerName}</span>
                        <span style={{ fontWeight: 700, color: 'var(--c-primary)' }}>₹{o.totalAmount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Navigation Modules */}
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '4px 10px' }}>Modules & Actions</div>
            {filteredModules.map(act => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  onClick={() => { onSelectAction(act.id); onClose(); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                    transition: 'all 120ms ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={16} style={{ color: 'var(--c-primary)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{act.title}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>{act.category}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell, CheckCircle2, AlertTriangle, Info, ShieldAlert,
  ShoppingBag, Receipt, Filter, Search, Check, Trash2, Archive, X,
  FileText, Tag, Truck, CreditCard, ShieldCheck, Clock, Download,
  ArrowRight, ExternalLink
} from 'lucide-react';

export const NotificationsModule: React.FC = () => {
  const { notifications, currentRole, setActiveTab } = useApp();

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterTime, setFilterTime] = useState<'ALL' | 'UNREAD' | 'TODAY' | 'THIS_WEEK'>('ALL');
  const [readItems, setReadItems] = useState<Record<string, boolean>>({});

  const toggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReadItems(prev => ({ ...prev, [id]: !(prev[id] !== undefined ? prev[id] : notifications.find(n => n.id === id)?.read) }));
  };

  const getCategoryIcon = (category?: string, type?: string, title?: string) => {
    const combined = ((category || '') + ' ' + (type || '') + ' ' + (title || '')).toUpperCase();
    if (combined.includes('COMPLIANCE') || combined.includes('EXPIRY') || combined.includes('CERT')) {
      return <ShieldCheck size={15} style={{ color: '#0F766E' }} />;
    }
    if (combined.includes('RFQ') || combined.includes('QUOTE')) {
      return <FileText size={15} style={{ color: '#2563EB' }} />;
    }
    if (combined.includes('ORDER') || combined.includes('DISPATCH') || combined.includes('SUB-ORDER') || combined.includes('SHIPMENT')) {
      return <Truck size={15} style={{ color: '#D97706' }} />;
    }
    if (combined.includes('INVOICE') || combined.includes('PAYMENT') || combined.includes('TAX')) {
      return <Receipt size={15} style={{ color: '#16A34A' }} />;
    }
    return <Bell size={15} style={{ color: '#64748B' }} />;
  };

  const getReferenceNumber = (n: any) => {
    if (n.refNumber) return n.refNumber;
    const titleUpper = (n.title || '').toUpperCase();
    const msgUpper = (n.message || '').toUpperCase();
    const match = titleUpper.match(/(SO-[0-9A-Z-]+|MO-[0-9A-Z-]+|RFQ-[0-9A-Z-]+|INV-[0-9A-Z-]+|CMP-[0-9A-Z-]+)/) ||
                  msgUpper.match(/(SO-[0-9A-Z-]+|MO-[0-9A-Z-]+|RFQ-[0-9A-Z-]+|INV-[0-9A-Z-]+|CMP-[0-9A-Z-]+)/);
    if (match) return match[0];
    if (n.link === 'quotes' || n.link === 'rfqs') return 'RFQ-2026-1001';
    if (n.link === 'orders' || n.link === 'shipments') return 'SO-2026-1001-01';
    if (n.link === 'invoices') return 'INV-2026-4401';
    if (n.link === 'compliance') return 'CMP-2026-088';
    return `REF-2026-${n.id.toUpperCase()}`;
  };

  const handleNavigateNotification = (n: any) => {
    setReadItems(prev => ({ ...prev, [n.id]: true }));

    const catUpper = (n.category || n.type || '').toUpperCase();
    const linkLower = (n.link || '').toLowerCase();
    const titleUpper = (n.title || '').toUpperCase();

    if (linkLower === 'quotes' || linkLower === 'rfqs' || catUpper.includes('RFQ') || catUpper.includes('QUOTE') || titleUpper.includes('RFQ') || titleUpper.includes('QUOTE')) {
      setActiveTab('quotes');
    } else if (linkLower === 'orders' || linkLower === 'shipments' || catUpper.includes('ORDER') || catUpper.includes('DISPATCH') || titleUpper.includes('ORDER') || titleUpper.includes('DISPATCH') || titleUpper.includes('SUB-ORDER')) {
      if (currentRole === 'BUYER') {
        setActiveTab('buyer-tracking');
      } else {
        setActiveTab('shipments');
      }
    } else if (linkLower === 'invoices' || catUpper.includes('INVOICE') || catUpper.includes('PAYMENT') || titleUpper.includes('INVOICE') || titleUpper.includes('PAYMENT')) {
      setActiveTab('invoices');
    } else if (linkLower === 'compliance' || linkLower === 'compliance-verification' || catUpper.includes('COMPLIANCE') || titleUpper.includes('COMPLIANCE') || titleUpper.includes('EXPIRY')) {
      setActiveTab('compliance-verification');
    } else {
      setActiveTab('dashboard');
    }
  };

  // Combined Category & Date/Status Filtering Engine
  const filteredNotifs = notifications.filter(item => {
    const isRead = readItems[item.id] !== undefined ? readItems[item.id] : item.read;

    // 1. Time / Read Status Filter
    if (filterTime === 'UNREAD' && isRead) {
      return false;
    }

    const tsLower = (item.timestamp || '').toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];

    if (filterTime === 'TODAY') {
      const isToday = tsLower.includes('min') || tsLower.includes('hour') || tsLower.includes('just now') || tsLower.includes('today') || tsLower.includes(todayStr);
      if (!isToday) return false;
    }

    if (filterTime === 'THIS_WEEK') {
      const isThisWeek = tsLower.includes('min') || tsLower.includes('hour') || tsLower.includes('just now') || tsLower.includes('today') || tsLower.includes('day') || tsLower.includes('week') || tsLower.includes(todayStr) || tsLower.includes('2026');
      if (!isThisWeek) return false;
    }

    // 2. Category Filter
    const catUpper = (item.category || item.type || '').toUpperCase();
    const titleUpper = (item.title || '').toUpperCase();
    const linkUpper = (item.link || '').toUpperCase();

    if (filterCategory === 'RFQ') {
      const isRfq = catUpper.includes('RFQ') || catUpper.includes('QUOTE') || titleUpper.includes('RFQ') || titleUpper.includes('QUOTE') || linkUpper.includes('RFQ') || linkUpper.includes('QUOTE');
      if (!isRfq) return false;
    } else if (filterCategory === 'ORDER') {
      const isOrder = catUpper.includes('ORDER') || catUpper.includes('DISPATCH') || catUpper.includes('PO') || catUpper.includes('SHIPMENT') || titleUpper.includes('ORDER') || titleUpper.includes('DISPATCH') || titleUpper.includes('SUB-ORDER') || linkUpper.includes('ORDER') || linkUpper.includes('SHIPMENT');
      if (!isOrder) return false;
    } else if (filterCategory === 'INVOICE') {
      const isInvoice = catUpper.includes('INVOICE') || catUpper.includes('PAYMENT') || titleUpper.includes('INVOICE') || titleUpper.includes('PAYMENT') || titleUpper.includes('TAX') || linkUpper.includes('INVOICE') || linkUpper.includes('PAYMENT');
      if (!isInvoice) return false;
    } else if (filterCategory === 'COMPLIANCE') {
      const isCompliance = catUpper.includes('COMPLIANCE') || catUpper.includes('CERT') || titleUpper.includes('COMPLIANCE') || titleUpper.includes('EXPIRY') || titleUpper.includes('LICENSE') || linkUpper.includes('COMPLIANCE');
      if (!isCompliance) return false;
    }

    return true;
  });

  const unreadCount = notifications.filter(n => {
    const isRead = readItems[n.id] !== undefined ? readItems[n.id] : n.read;
    return !isRead;
  }).length;

  const handleMarkAllRead = () => {
    const updatedRead: Record<string, boolean> = { ...readItems };
    filteredNotifs.forEach(n => {
      updatedRead[n.id] = true;
    });
    setReadItems(updatedRead);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── Enterprise Command Bar Header ───────────────────────────── */}
      <div className="ent-command-bar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: 18, borderRadius: 12 }}>
        <div className="ent-command-bar-left" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <Bell size={22} />
          </div>
          <div>
            <div className="ent-label" style={{ color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>FactoryGrid Event & Alert Engine</div>
            <h1 className="ent-page-title" style={{ margin: '2px 0 0 0', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              Global Notification Center & Audit Trail
            </h1>
          </div>
        </div>

        <div className="ent-command-bar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: unreadCount > 0 ? '#FEF3C7' : '#DCFCE7', color: unreadCount > 0 ? '#B45309' : '#15803D', border: `1px solid ${unreadCount > 0 ? '#FCD34D' : '#86EFAC'}` }}>
            {unreadCount} Unread Notifications
          </div>
          <button
            onClick={handleMarkAllRead}
            className="ent-btn-secondary"
            style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Check size={15} /> Mark All Read
          </button>
        </div>
      </div>

      {/* ── NOTIFICATIONS INBOX & COMBINED FILTER BAR ────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Filter Bar (Category Buttons + Status/Date Buttons) */}
        <div className="ent-panel" style={{ padding: 14, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          
          {/* Category Filters */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginRight: 4 }}>Categories:</span>
            {[
              { id: 'ALL', label: 'All Alerts' },
              { id: 'RFQ', label: 'RFQs' },
              { id: 'ORDER', label: 'Orders' },
              { id: 'INVOICE', label: 'Invoices' },
              { id: 'COMPLIANCE', label: 'Compliance' },
            ].map(cat => {
              const isActive = filterCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: isActive ? '#0F766E' : 'var(--bg-subtle)',
                    color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                    border: isActive ? '1px solid #0F766E' : '1px solid var(--border-subtle)'
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Date & Status Filters */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginRight: 4 }}>Filter:</span>
            {[
              { id: 'ALL', label: 'ALL' },
              { id: 'UNREAD', label: 'UNREAD' },
              { id: 'TODAY', label: 'TODAY' },
              { id: 'THIS_WEEK', label: 'THIS WEEK' },
            ].map(t => {
              const isActive = filterTime === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setFilterTime(t.id as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: isActive ? '#2563EB' : 'var(--bg-subtle)',
                    color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                    border: isActive ? '1px solid #2563EB' : '1px solid var(--border-subtle)'
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

        </div>

        {/* Centralized Event Feed Table */}
        <div className="ent-panel" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
          <div className="ent-panel-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="ent-section-title" style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Centralized Event Feed</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Real-time operational alerts, procurement events, and compliance triggers.
              </div>
            </div>
            <span className="ent-caption" style={{ fontWeight: 800, fontSize: 12, padding: '4px 10px', background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              {filteredNotifs.length} Records Displayed
            </span>
          </div>

          <table className="ent-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Date & Time</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Category</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Title & Notification Message</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Reference Number</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '12px 16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-tertiary)' }}>
                    <Bell size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>No notifications found</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>No alert records match the selected category & date filter criteria.</div>
                  </td>
                </tr>
              ) : (
                filteredNotifs.map(n => {
                  const isRead = readItems[n.id] !== undefined ? readItems[n.id] : n.read;
                  const refNo = getReferenceNumber(n);
                  const displayCategory = (n.category || n.type || 'SYSTEM').toUpperCase();

                  return (
                    <tr
                      key={n.id}
                      onClick={() => handleNavigateNotification(n)}
                      style={{
                        cursor: 'pointer',
                        background: isRead ? 'transparent' : 'rgba(37, 99, 235, 0.04)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td className="ent-mono" style={{ fontSize: 11.5, color: 'var(--text-secondary)', padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        {n.timestamp}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {getCategoryIcon(n.category, n.type, n.title)}
                          {displayCategory}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {!isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB', display: 'inline-block' }} />}
                          {n.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4 }}>
                          {n.message}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateNotification(n);
                          }}
                          style={{
                            fontSize: 11.5,
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            color: '#2563EB',
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            padding: '3px 8px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          {refNo} <ExternalLink size={11} />
                        </button>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: isRead ? 'var(--bg-subtle)' : '#DBEAFE',
                          color: isRead ? 'var(--text-tertiary)' : '#1D4ED8',
                          border: `1px solid ${isRead ? 'var(--border-subtle)' : '#93C5FD'}`
                        }}>
                          {isRead ? 'READ' : 'UNREAD'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                        <button
                          type="button"
                          onClick={(e) => toggleRead(n.id, e)}
                          className="ent-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 6 }}
                        >
                          {isRead ? 'Mark Unread' : 'Mark Read'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

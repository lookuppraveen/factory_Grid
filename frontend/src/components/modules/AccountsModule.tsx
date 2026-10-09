import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Receipt, DollarSign, Send, CheckCircle2, AlertCircle,
  FileText, Download, Plus, Search, BarChart3, Clock, AlertTriangle
} from 'lucide-react';

// AR Aging buckets
const getAgingBucket = (dueDate: string): '0-30' | '31-60' | '61-90' | '90+' => {
  const today = new Date('2026-08-07');
  const due = new Date(dueDate);
  const days = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
};

const agingBucketColor = { '0-30': '#047857', '31-60': '#B45309', '61-90': '#B91C1C', '90+': '#7F1D1D' };
const agingBucketLabel = { '0-30': 'Current (0–30 days)', '31-60': 'Moderate (31–60 days)', '61-90': 'Overdue (61–90 days)', '90+': 'Critical (90+ days)' };

export const AccountsModule: React.FC = () => {
  const { invoices, paymentTransactions, customers, recordInvoicePayment, addAuditLog, currentRole } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'RECEIVABLES' | 'TRANSACTIONS' | 'CREDIT_LIMITS' | 'AGING'>('RECEIVABLES');

  const isFinanceUser = currentRole === 'ACCOUNTS_MANAGER';
  const isBuyerUser = currentRole === 'BUYER';

  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);
  const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE');

  const [paymentModalInvoiceId, setPaymentModalInvoiceId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number>(50000);
  const [payMethod, setPayMethod] = useState<string>('RTGS');
  const [payRef, setPayRef] = useState<string>('RTGS-HDFC-' + Math.floor(Math.random() * 899999 + 100000));

  const handleRecordPayment = () => {
    if (!paymentModalInvoiceId) return;
    recordInvoicePayment(paymentModalInvoiceId, Number(payAmount), payMethod, payRef);
    setPaymentModalInvoiceId(null);
    alert(`Payment of ₹${payAmount.toLocaleString()} posted to ledger.`);
  };

  // Compute aging buckets
  const agingBuckets = invoices.reduce((acc, inv) => {
    if (inv.balanceAmount <= 0) return acc;
    const bucket = getAgingBucket(inv.dueDate);
    if (!acc[bucket]) acc[bucket] = { count: 0, amount: 0 };
    acc[bucket].count += 1;
    acc[bucket].amount += inv.balanceAmount;
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  const totalAgingAmount = Object.values(agingBuckets).reduce((a, b) => a + b.amount, 0) || 1;

  const statusDot = (status: string) => {
    const colors: Record<string, string> = {
      PAID: '#047857', OVERDUE: '#B91C1C', OPEN: '#1E40AF', PARTIAL_PAYMENT: '#B45309', COMPLETED: '#047857', LOW: '#047857', HIGH: '#B91C1C', MEDIUM: '#B45309'
    };
    return colors[status] || '#64748B';
  };

  const tabs = [
    { id: 'RECEIVABLES', label: `Receivables Ledger (${invoices.length})` },
    { id: 'TRANSACTIONS', label: `Payment Transactions (${paymentTransactions.length})` },
    { id: 'CREDIT_LIMITS', label: `Customer Credit Limits (${customers.length})` },
    { id: 'AGING', label: 'AR Aging Analysis' },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* Header Bar */}
      <div className="ent-command-bar">
        <div className="ent-command-bar-left">
          <div>
            <div className="ent-label">Finance & Accounts / Treasury Oversight</div>
            <div className="ent-page-title" style={{ margin: 0 }}>{currentRole === 'ADMIN' ? 'Payments & AR Governance Monitor' : 'Accounts Receivable & Ledger Control'}</div>
          </div>
        </div>
        <div className="ent-command-bar-right">
          <button onClick={() => alert('Exporting Accounts Ledger to Excel...')} className="ent-btn-secondary">
            <Download size={14} /> Export Ledger
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="ent-kpi-strip">
        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Total Billed (YTD)</div>
          <div className="kpi-value ent-mono">₹{(totalBilled / 100000).toFixed(1)}L</div>
          <div className="kpi-sub">{invoices.length} Invoices raised</div>
        </div>
        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Total Collected</div>
          <div className="kpi-value ent-mono" style={{ color: '#047857' }}>₹{(totalPaid / 100000).toFixed(1)}L</div>
          <div className="kpi-sub">Via RTGS / NEFT / UPI</div>
        </div>
        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Outstanding Receivables</div>
          <div className="kpi-value ent-mono" style={{ color: '#B45309' }}>₹{(totalOutstanding / 100000).toFixed(1)}L</div>
          <div className="kpi-sub">Pending collection</div>
        </div>
        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Overdue Balance</div>
          <div className="kpi-value ent-mono" style={{ color: '#B91C1C' }}>
            ₹{(overdueInvoices.reduce((a, b) => a + b.balanceAmount, 0) / 100000).toFixed(1)}L
          </div>
          <div className="kpi-sub">{overdueInvoices.length} overdue accounts</div>
        </div>
        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Collection Rate</div>
          <div className="kpi-value" style={{ color: '#047857' }}>
            {totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0}%
          </div>
          <div className="kpi-sub">Of total billed amount</div>
        </div>
        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Customer Accounts</div>
          <div className="kpi-value">{customers.length}</div>
          <div className="kpi-sub">Avg credit: 45 days</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="ent-tab-bar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`ent-tab ${activeSubTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveSubTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: RECEIVABLES LEDGER
      ══════════════════════════════════════════════════════ */}
      {activeSubTab === 'RECEIVABLES' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <span className="ent-section-title">Accounts Receivable Queue</span>
            <span className="ent-caption">{invoices.filter(i => i.balanceAmount > 0).length} invoices with outstanding balance</span>
          </div>
          <div className="ent-table-container">
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer Entity</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="ent-mono" style={{ fontWeight: 700 }}>{inv.invoiceNumber}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.customerName}</div>
                      <div className="ent-mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{inv.customerCode}</div>
                    </td>
                    <td className="ent-mono">{inv.invoiceDate}</td>
                    <td className="ent-mono">{inv.dueDate}</td>
                    <td className="ent-mono" style={{ fontWeight: 700 }}>₹{inv.totalAmount.toLocaleString()}</td>
                    <td className="ent-mono" style={{ fontWeight: 700 }}>₹{inv.paidAmount.toLocaleString()}</td>
                    <td className="ent-mono" style={{ fontWeight: 800, color: inv.balanceAmount > 0 ? '#B45309' : '#047857' }}>
                      ₹{inv.balanceAmount.toLocaleString()}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusDot(inv.status) }} />
                        {inv.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {inv.balanceAmount > 0 ? (
                        isFinanceUser ? (
                          <button
                            onClick={() => { setPaymentModalInvoiceId(inv.id); setPayAmount(inv.balanceAmount); }}
                            className="ent-btn-primary" style={{ fontSize: 11, height: 30, padding: '0 10px' }}
                          >
                            <Plus size={11} /> Record Payment
                          </button>
                        ) : isBuyerUser ? (
                          Boolean(inv.uploadedFileUrl || inv.uploadedFileName) ? (
                            <button
                              onClick={() => alert(`Online Payment Gateway:\n\nInitiating secure payment for Invoice ${inv.invoiceNumber}.\nOutstanding Balance: ₹${inv.balanceAmount.toLocaleString()}`)}
                              className="ent-btn-primary" style={{ fontSize: 11, height: 30, padding: '0 10px', background: '#166534' }}
                            >
                              Pay Now →
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Awaiting Invoice PDF</span>
                          )
                        ) : (
                          <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Unpaid Balance</span>
                        )
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>PAID IN FULL ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: PAYMENT TRANSACTIONS
      ══════════════════════════════════════════════════════ */}
      {activeSubTab === 'TRANSACTIONS' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <span className="ent-section-title">Payment Transaction Ledger</span>
            <span className="ent-caption">{paymentTransactions.length} transactions recorded</span>
          </div>
          <div className="ent-table-container">
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Transaction Ref</th>
                  <th>Invoice #</th>
                  <th>Customer Entity</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Amount Cleared</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="ent-mono" style={{ fontWeight: 700, color: 'var(--c-secondary)' }}>{tx.transactionRef}</td>
                    <td className="ent-mono">{tx.invoiceNumber}</td>
                    <td style={{ fontWeight: 600 }}>{tx.customerName}</td>
                    <td className="ent-mono">{tx.date}</td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="ent-mono" style={{ fontWeight: 800, color: '#047857' }}>₹{tx.amount.toLocaleString()}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#047857' }} />
                        COMPLETED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: CREDIT LIMITS
      ══════════════════════════════════════════════════════ */}
      {activeSubTab === 'CREDIT_LIMITS' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <span className="ent-section-title">Customer Credit Facility Control</span>
          </div>
          <div className="ent-table-container">
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Customer Entity</th>
                  <th>Credit Limit</th>
                  <th>Available Credit</th>
                  <th>Utilization</th>
                  <th>Credit Terms</th>
                  <th>Risk Grade</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => {
                  const used = c.creditLimit - c.availableCredit;
                  const utilPct = c.creditLimit > 0 ? Math.round((used / c.creditLimit) * 100) : 0;
                  const riskColor = c.riskScore === 'LOW' ? '#047857' : c.riskScore === 'HIGH' ? '#B91C1C' : '#B45309';
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                        <div className="ent-mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{c.code}</div>
                      </td>
                      <td className="ent-mono" style={{ fontWeight: 700 }}>₹{c.creditLimit.toLocaleString()}</td>
                      <td className="ent-mono" style={{ fontWeight: 700, color: '#047857' }}>₹{c.availableCredit.toLocaleString()}</td>
                      <td style={{ width: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${utilPct}%`, background: utilPct > 80 ? '#B91C1C' : '#1E40AF', borderRadius: 3 }} />
                          </div>
                          <span className="ent-mono" style={{ fontSize: 11, fontWeight: 700 }}>{utilPct}%</span>
                        </div>
                      </td>
                      <td>{c.creditDays} Days</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: riskColor }} />
                          {c.riskScore} RISK
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            addAuditLog('Accounts', `Issued payment reminder for ${c.name}`);
                            alert(`Payment reminder sent to ${c.email}`);
                          }}
                          className="ent-btn-secondary" style={{ fontSize: 11, height: 30, padding: '0 10px' }}
                        >
                          <Send size={11} /> Send Reminder
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: AR AGING ANALYSIS
      ══════════════════════════════════════════════════════ */}
      {activeSubTab === 'AGING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Aging Bucket Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {(['0-30', '31-60', '61-90', '90+'] as const).map(bucket => {
              const data = agingBuckets[bucket] || { count: 0, amount: 0 };
              const color = agingBucketColor[bucket];
              const pct = Math.round((data.amount / totalAgingAmount) * 100);
              return (
                <div key={bucket} className="ent-card" style={{ padding: 16, borderLeft: `3px solid ${color}` }}>
                  <div className="ent-label">{agingBucketLabel[bucket]}</div>
                  <div className="ent-mono" style={{ fontSize: 20, fontWeight: 800, color, marginTop: 6 }}>
                    ₹{(data.amount / 100000).toFixed(1)}L
                  </div>
                  <div className="ent-caption" style={{ marginTop: 4 }}>{data.count} invoices · {pct}% of outstanding</div>
                  <div style={{ marginTop: 8, height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Aging Detail Table */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <span className="ent-section-title">Overdue Invoice Aging Detail</span>
              <button className="ent-btn-secondary" style={{ fontSize: 11, height: 30, padding: '0 10px' }}>
                <Download size={13} /> Export Aging Report
              </button>
            </div>
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer Entity</th>
                  <th>Due Date</th>
                  <th>Total Amount</th>
                  <th>Balance Due</th>
                  <th>Days Overdue</th>
                  <th>Aging Bucket</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices
                  .filter(inv => inv.balanceAmount > 0)
                  .map(inv => {
                    const bucket = getAgingBucket(inv.dueDate);
                    const color = agingBucketColor[bucket];
                    const today = new Date('2026-08-07');
                    const due = new Date(inv.dueDate);
                    const daysOver = Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
                    return (
                      <tr key={inv.id}>
                        <td className="ent-mono" style={{ fontWeight: 700 }}>{inv.invoiceNumber}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{inv.customerName}</div>
                          <div className="ent-mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{inv.customerCode}</div>
                        </td>
                        <td className="ent-mono">{inv.dueDate}</td>
                        <td className="ent-mono" style={{ fontWeight: 700 }}>₹{inv.totalAmount.toLocaleString()}</td>
                        <td className="ent-mono" style={{ fontWeight: 800, color }}>₹{inv.balanceAmount.toLocaleString()}</td>
                        <td className="ent-mono" style={{ fontWeight: 700, color }}>{daysOver > 0 ? `${daysOver} days` : 'Due soon'}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                            {agingBucketLabel[bucket].split('(')[0].trim()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isFinanceUser ? (
                            <button
                              onClick={() => { setPaymentModalInvoiceId(inv.id); setPayAmount(inv.balanceAmount); setActiveSubTab('RECEIVABLES'); }}
                              className="ent-btn-primary" style={{ fontSize: 11, height: 30, padding: '0 10px' }}
                            >
                              Record Payment
                            </button>
                          ) : isBuyerUser ? (
                            Boolean(inv.uploadedFileUrl || inv.uploadedFileName) ? (
                              <button
                                onClick={() => alert(`Online Payment Gateway:\n\nInitiating secure payment for Invoice ${inv.invoiceNumber}.\nOutstanding Balance: ₹${inv.balanceAmount.toLocaleString()}`)}
                                className="ent-btn-primary" style={{ fontSize: 11, height: 30, padding: '0 10px', background: '#166534' }}
                              >
                                Pay Now →
                              </button>
                            ) : (
                              <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Awaiting Invoice PDF</span>
                            )
                          ) : (
                            <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Unpaid</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal (Finance & Accounts Only) */}
      {paymentModalInvoiceId && isFinanceUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="ent-card" style={{ width: 480, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Record Treasury Payment</h3>
            <p className="ent-caption" style={{ marginBottom: 20 }}>Post incoming payment to accounts ledger</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Amount Received (₹) *</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} className="ent-input" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Payment Method *</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="ent-input" style={{ width: '100%' }}>
                  <option value="RTGS">RTGS Bank Transfer</option>
                  <option value="NEFT">NEFT Settlement</option>
                  <option value="UPI">UPI Direct</option>
                  <option value="CHEQUE">Corporate Cheque</option>
                  <option value="CREDIT_LINE">Credit Line Drawdown</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Bank Transaction Reference *</label>
                <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)} className="ent-input" style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <button onClick={() => setPaymentModalInvoiceId(null)} className="ent-btn-secondary">Cancel</button>
              <button onClick={handleRecordPayment} className="ent-btn-primary">Post to Ledger</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

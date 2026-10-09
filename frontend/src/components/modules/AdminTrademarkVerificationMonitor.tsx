import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Award, Search, Eye, X, ShieldCheck } from 'lucide-react';

export const AdminTrademarkVerificationMonitor: React.FC = () => {
  const { currentRole } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const mockTrademarks = [
    { id: 'tm1', name: 'FLAVOCIP-500', owner: 'Apex Pharma PCD Franchise', regNo: 'TM-CLASS5-9018', class: 'Class 5 (Pharma)', status: 'REGISTERED', expiry: '2032-05-14', reviewer: 'Legal Desk' },
    { id: 'tm2', name: 'PANTOFINE-40', owner: 'SunBio LifeSciences Ltd', regNo: 'TM-CLASS5-8821', class: 'Class 5 (Pharma)', status: 'REGISTERED', expiry: '2031-11-20', reviewer: 'Legal Desk' },
    { id: 'tm3', name: 'AZITHER-500', owner: 'Cipla CDMO Division', regNo: 'TM-CLASS5-7729', class: 'Class 5 (Pharma)', status: 'UNDER_REVIEW', expiry: '2026-09-30', reviewer: 'Compliance Officer Desk' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Award size={14} /> Trademark Oversight · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Trademark Verification Monitor
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Monitor pharma formulation trademarks, brand name registrations and Class 5 CDSCO filings.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFFBEB', border: '1px solid #FDE68A', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#B45309' }}>
          <Eye size={14} /> READ-ONLY MONITORING MODE
        </div>
      </div>

      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input type="text" placeholder="Search trademark..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', height: 34, paddingLeft: 32, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6 }} />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Trademark Name</th>
              <th style={{ padding: '12px 16px' }}>Owner / Organization</th>
              <th style={{ padding: '12px 16px' }}>Application / Reg #</th>
              <th style={{ padding: '12px 16px' }}>Class</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Expiry Date</th>
              <th style={{ padding: '12px 16px' }}>Reviewer</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockTrademarks.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>{t.name}</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>{t.owner}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{t.regNo}</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{t.class}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: t.status === 'REGISTERED' ? '#DCFCE7' : '#FEF3C7', color: t.status === 'REGISTERED' ? '#15803D' : '#B45309' }}>
                    {t.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{t.expiry}</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{t.reviewer}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button style={{ padding: '4px 10px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

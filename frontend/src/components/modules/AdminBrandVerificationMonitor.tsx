import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Tag, Search, Eye, X, ShieldCheck } from 'lucide-react';

export const AdminBrandVerificationMonitor: React.FC = () => {
  const { currentRole } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const mockBrands = [
    { id: 'b1', name: 'Apex Care Formulations', owner: 'Apex Pharma PCD Franchise', category: 'Analgesics & Anti-inflammatory', status: 'VERIFIED', expiry: '2030-12-31', reviewer: 'Brand Audit Desk' },
    { id: 'b2', name: 'SunBio Generic Portfolio', owner: 'SunBio LifeSciences Ltd', category: 'Antibiotics & Anti-infectives', status: 'VERIFIED', expiry: '2029-06-30', reviewer: 'Brand Audit Desk' },
    { id: 'b3', name: 'Cipla Gastro Care', owner: 'Cipla CDMO Division', category: 'Gastroenterology', status: 'UNDER_REVIEW', expiry: '2027-04-15', reviewer: 'Compliance Officer Desk' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Tag size={14} /> Brand Portfolio Oversight · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Brand Verification Monitor
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Monitor platform registered brand portfolios, therapeutic categories and authorization status.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#1D4ED8' }}>
          <Eye size={14} /> READ-ONLY MONITORING MODE
        </div>
      </div>

      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input type="text" placeholder="Search brand..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', height: 34, paddingLeft: 32, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6 }} />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Brand Name</th>
              <th style={{ padding: '12px 16px' }}>Manufacturer / Owner</th>
              <th style={{ padding: '12px 16px' }}>Brand Category</th>
              <th style={{ padding: '12px 16px' }}>Verification Status</th>
              <th style={{ padding: '12px 16px' }}>Expiry Date</th>
              <th style={{ padding: '12px 16px' }}>Current Reviewer</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockBrands.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>{b.name}</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>{b.owner}</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{b.category}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: b.status === 'VERIFIED' ? '#DCFCE7' : '#FEF3C7', color: b.status === 'VERIFIED' ? '#15803D' : '#B45309' }}>
                    {b.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{b.expiry}</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{b.reviewer}</td>
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

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Tag, Search, Eye, X, CheckCircle2 } from 'lucide-react';

export const AdminBrandVerification: React.FC = () => {
  const { currentRole, addAuditLog } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [brands, setBrands] = useState([
    { id: 'b1', name: 'Apex Care Formulations', owner: 'Apex Pharma PCD Franchise', category: 'Analgesics & Anti-inflammatory', status: 'VERIFIED', expiry: '2030-12-31' },
    { id: 'b2', name: 'SunBio Generic Portfolio', owner: 'SunBio LifeSciences Ltd', category: 'Antibiotics & Anti-infectives', status: 'VERIFIED', expiry: '2029-06-30' },
    { id: 'b3', name: 'Cipla Gastro Care', owner: 'Cipla CDMO Division', category: 'Gastroenterology', status: 'UNDER_REVIEW', expiry: '2027-04-15' }
  ]);

  const handleApproveBrand = (id: string, name: string) => {
    setBrands(prev => prev.map(b => b.id === id ? { ...b, status: 'VERIFIED' } : b));
    addAuditLog('Brand Verification', `Admin verified & approved brand portfolio for ${name}`);
    setToastMessage(`✔ Brand ${name} verified & approved.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {toastMessage && (
        <div style={{ background: '#059669', color: '#FFF', padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Tag size={14} /> Brand Portfolio Operations · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Brand Verification
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Operational verification desk for platform registered brand portfolios, therapeutic categories and authorizations.
          </p>
        </div>
      </div>

      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Brand Name</th>
              <th style={{ padding: '12px 16px' }}>Manufacturer / Owner</th>
              <th style={{ padding: '12px 16px' }}>Brand Category</th>
              <th style={{ padding: '12px 16px' }}>Verification Status</th>
              <th style={{ padding: '12px 16px' }}>Expiry Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map(b => (
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
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  {b.status !== 'VERIFIED' && (
                    <button onClick={() => handleApproveBrand(b.id, b.name)} style={{ padding: '5px 10px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      Approve ✓
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

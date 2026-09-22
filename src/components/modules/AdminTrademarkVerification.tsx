import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Award, Search, Eye, X, CheckCircle2 } from 'lucide-react';

export const AdminTrademarkVerification: React.FC = () => {
  const { currentRole, addAuditLog } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [trademarks, setTrademarks] = useState([
    { id: 'tm1', name: 'FLAVOCIP-500', owner: 'Apex Pharma PCD Franchise', regNo: 'TM-CLASS5-9018', class: 'Class 5 (Pharma)', status: 'REGISTERED', expiry: '2032-05-14' },
    { id: 'tm2', name: 'PANTOFINE-40', owner: 'SunBio LifeSciences Ltd', regNo: 'TM-CLASS5-8821', class: 'Class 5 (Pharma)', status: 'REGISTERED', expiry: '2031-11-20' },
    { id: 'tm3', name: 'AZITHER-500', owner: 'Cipla CDMO Division', regNo: 'TM-CLASS5-7729', class: 'Class 5 (Pharma)', status: 'UNDER_REVIEW', expiry: '2026-09-30' }
  ]);

  const handleApproveTM = (id: string, name: string) => {
    setTrademarks(prev => prev.map(t => t.id === id ? { ...t, status: 'REGISTERED' } : t));
    addAuditLog('Trademark Verification', `Admin verified & approved trademark filing for ${name}`);
    setToastMessage(`✔ Trademark ${name} approved & verified.`);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Award size={14} /> Operational Trademark Desk · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Trademark Verification
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Operational verification desk for pharma formulation trademarks, brand filings and Class 5 CDSCO registrations.
          </p>
        </div>
      </div>

      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Trademark Name</th>
              <th style={{ padding: '12px 16px' }}>Owner / Organization</th>
              <th style={{ padding: '12px 16px' }}>Application / Reg #</th>
              <th style={{ padding: '12px 16px' }}>Class</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Expiry Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trademarks.map(t => (
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
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  {t.status !== 'REGISTERED' && (
                    <button onClick={() => handleApproveTM(t.id, t.name)} style={{ padding: '5px 10px', background: '#D97706', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
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

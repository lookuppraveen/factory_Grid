import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Factory, Search, Eye, X, CheckCircle2, ShieldCheck, Clock, Award } from 'lucide-react';

export const AdminManufacturerVerificationMonitor: React.FC = () => {
  const { manufacturers, currentRole } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Factory size={14} /> Platform Oversight · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Manufacturer Verification Monitor
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Monitor WHO-GMP certifications, manufacturing unit licenses and audit verifications.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#047857' }}>
          <Eye size={14} /> READ-ONLY MONITORING MODE
        </div>
      </div>

      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input type="text" placeholder="Search manufacturer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', height: 34, paddingLeft: 32, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6 }} />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Manufacturer</th>
              <th style={{ padding: '12px 16px' }}>Registration / License</th>
              <th style={{ padding: '12px 16px' }}>WHO-GMP Status</th>
              <th style={{ padding: '12px 16px' }}>GST Status</th>
              <th style={{ padding: '12px 16px' }}>Verification Status</th>
              <th style={{ padding: '12px 16px' }}>Expiry Date</th>
              <th style={{ padding: '12px 16px' }}>Current Reviewer</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {manufacturers.filter(m => m.companyName.toLowerCase().includes(searchTerm.toLowerCase())).map(mfg => (
              <tr key={mfg.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>{mfg.companyName}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{mfg.mfgLicenseNo}</td>
                <td style={{ padding: '12px 16px', color: '#15803D', fontWeight: 700 }}>✓ WHO-GMP Valid</td>
                <td style={{ padding: '12px 16px', color: '#059669', fontWeight: 700 }}>✓ Active GSTIN</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: '#DCFCE7', color: '#15803D' }}>VERIFIED</span>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>2028-12-31</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>Compliance Desk</td>
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

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { adminVerificationApi, ManufacturerReviewItem } from '../../services/adminVerificationApi';
import { Factory, Search, Eye, X, CheckCircle2, ShieldCheck, Clock, Award, RefreshCw } from 'lucide-react';

export const AdminManufacturerVerificationMonitor: React.FC = () => {
  const { currentRole } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [mfgList, setMfgList] = useState<ManufacturerReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await adminVerificationApi.listManufacturerVerifications();
      setMfgList(Array.isArray(data) ? data : []);
    } catch {
      setMfgList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = mfgList.filter(m =>
    m.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.registrationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.city && m.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            Monitor WHO-GMP certifications, manufacturing unit licenses and audit verifications from PostgreSQL database.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={loadData}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Syncing...' : '↻ Refresh'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#047857' }}>
            <Eye size={14} /> READ-ONLY MONITORING MODE
          </div>
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
              <th style={{ padding: '12px 16px' }}>Registration Code</th>
              <th style={{ padding: '12px 16px' }}>Location</th>
              <th style={{ padding: '12px 16px' }}>Certificates</th>
              <th style={{ padding: '12px 16px' }}>Verification Status</th>
              <th style={{ padding: '12px 16px' }}>Submission Date</th>
              <th style={{ padding: '12px 16px' }}>Reviewer</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                  No manufacturer verification records found in database.
                </td>
              </tr>
            ) : (
              filtered.map(mfg => (
                <tr key={mfg.registrationCode} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>
                    <div>{mfg.companyName}</div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400 }}>{mfg.contactPerson} ({mfg.email})</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{mfg.registrationCode}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{mfg.city ? `${mfg.city}, ${mfg.state}` : 'N/A'}</td>
                  <td style={{ padding: '12px 16px', color: '#15803D', fontWeight: 700 }}>{mfg.documentsTotal} Certificates</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: mfg.status === 'APPROVED' ? '#DCFCE7' : mfg.status === 'REJECTED' ? '#FEF2F2' : '#EFF6FF',
                      color: mfg.status === 'APPROVED' ? '#15803D' : mfg.status === 'REJECTED' ? '#DC2626' : '#2563EB'
                    }}>
                      {mfg.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>
                    {mfg.submittedAt ? new Date(mfg.submittedAt).toLocaleDateString() : 'Draft'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>Compliance Desk</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

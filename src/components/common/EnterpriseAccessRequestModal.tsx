import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Building2, Factory, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface EnterpriseAccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'BUYER' | 'MANUFACTURER';
}

export const EnterpriseAccessRequestModal: React.FC<EnterpriseAccessRequestModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'BUYER'
}) => {
  const { submitBuyerOnboarding, submitManufacturerOnboarding, addAuditLog } = useApp();

  const [accountType, setAccountType] = useState<'BUYER' | 'MANUFACTURER'>(defaultType);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    cityState: '',
    gstNumber: '',
    mfgLicenseNo: '',
    whoGmpCertNo: '',
    estimatedVolume: '₹5,00,00,000 – ₹25,00,00,000',
    notes: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [requestId, setRequestId] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const generatedReqId = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setRequestId(generatedReqId);

    if (accountType === 'BUYER') {
      submitBuyerOnboarding({
        companyName: formData.companyName,
        gstin: formData.gstNumber || '36APXPH0001A1Z5',
        pan: 'AAACA1234A',
        drugLicenseNo: 'DL-20B-2026-99',
        address: formData.cityState || 'Hyderabad, Telangana',
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        estimatedAnnualSourcing: formData.estimatedVolume,
        sourcingCategory: formData.notes || 'Finished Formulations & Active Ingredients',
        documents: [
          { name: 'GSTIN_Certificate.pdf', type: 'GST', status: 'PENDING', url: '#' },
          { name: 'Drug_License_20B_21B.pdf', type: 'DRUG_LICENSE', status: 'PENDING', url: '#' }
        ]
      });
      addAuditLog('Sales Qualification', `Logged Buyer Enterprise Demo Request from ${formData.companyName} (${generatedReqId})`);
    } else {
      submitManufacturerOnboarding({
        companyName: formData.companyName,
        factoryDetails: `${formData.companyName} Unit I`,
        mfgCapacity: formData.estimatedVolume,
        whoGmpNo: formData.whoGmpCertNo || 'WHO-GMP-2026-091',
        factoryLocation: formData.cityState || 'Baddi, Himachal Pradesh',
        gstin: formData.gstNumber || '02SUNBI0001A1Z8',
        pan: 'BBBBB5678B',
        mfgLicenseNo: formData.mfgLicenseNo || 'ML-HP-2024-001',
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        targetMarkets: 'Domestic PCD & International Exports',
        drugCategories: formData.notes ? [formData.notes] : ['Tablets', 'Capsules', 'Injectables'],
        certifications: ['WHO-GMP', 'ISO 9001:2015'],
        documents: [
          { name: 'WHO_GMP_Certificate.pdf', type: 'WHO_GMP', status: 'PENDING', url: '#' },
          { name: 'Mfg_License_Form25.pdf', type: 'MFG_LICENSE', status: 'PENDING', url: '#' }
        ]
      });
      addAuditLog('Sales Qualification', `Logged Manufacturer Enterprise Demo Request from ${formData.companyName} (${generatedReqId})`);
    }

    setIsSubmitted(true);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div style={{
        background: '#0F172A',
        border: '1px solid #334155',
        borderRadius: 8,
        width: '100%',
        maxWidth: 560,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        color: '#F8FAFC',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1E293B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                Request Enterprise Demo & Access
              </div>
              <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
                FactoryGrid B2B Pharmaceutical Procurement Platform
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
          {isSubmitted ? (
            <div style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981',
                color: '#10B981', display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: 16
              }}>
                <CheckCircle2 size={28} />
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: '#38BDF8', fontFamily: 'monospace', marginBottom: 6 }}>
                Reference ID: {requestId}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                Request Submitted Successfully.
              </h3>
              <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5, marginBottom: 20 }}>
                Your access request for <strong style={{ color: '#F8FAFC' }}>{formData.companyName}</strong> has been logged into the FactoryGrid enterprise pipeline.
              </p>

              {/* Next Steps List */}
              <div style={{
                background: '#1E293B', border: '1px solid #334155', borderRadius: 6,
                padding: 16, textAlign: 'left', marginBottom: 20, fontSize: 12.5
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Next Steps:
                </div>
                {[
                  { label: '✓ Sales Qualification', status: 'Request Logged', color: '#10B981' },
                  { label: '✓ Compliance Verification', status: 'Compliance Verification Pending', color: '#F59E0B' },
                  { label: '✓ Platform Admin Approval', status: 'Account Provisioning', color: '#64748B' },
                  { label: '✓ Invitation Email', status: 'Credentials will be emailed after approval', color: '#94A3B8' },
                ].map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: idx < 3 ? '1px solid #334155' : 'none' }}>
                    <span style={{ fontWeight: 600, color: '#E2E8F0' }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.status}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleClose}
                style={{
                  background: '#0EA5E9', color: '#FFFFFF', fontSize: 13, fontWeight: 700,
                  border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer'
                }}
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* 1. Organization Type */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                  Organization Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setAccountType('BUYER')}
                    style={{
                      border: `1px solid ${accountType === 'BUYER' ? '#0EA5E9' : '#334155'}`,
                      background: accountType === 'BUYER' ? '#1E293B' : '#0F172A',
                      borderRadius: 6, padding: '10px 12px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      color: accountType === 'BUYER' ? '#FFFFFF' : '#94A3B8',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <Building2 size={16} style={{ color: accountType === 'BUYER' ? '#38BDF8' : '#64748B' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Buyer Organization</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('MANUFACTURER')}
                    style={{
                      border: `1px solid ${accountType === 'MANUFACTURER' ? '#0EA5E9' : '#334155'}`,
                      background: accountType === 'MANUFACTURER' ? '#1E293B' : '#0F172A',
                      borderRadius: 6, padding: '10px 12px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      color: accountType === 'MANUFACTURER' ? '#FFFFFF' : '#94A3B8',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <Factory size={16} style={{ color: accountType === 'MANUFACTURER' ? '#38BDF8' : '#64748B' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Manufacturer</span>
                  </button>
                </div>
              </div>

              {/* 2. Legal Company Name & Primary Business Contact */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                    Legal Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Apex Pharma Labs Ltd"
                    style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#FFFFFF', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                    Primary Business Contact *
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Dr. Vikram Sethi"
                    style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#FFFFFF', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Business Email & Business Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                    Business Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="name@company.com"
                    style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#FFFFFF', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                    Business Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#FFFFFF', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Headquarters Location & License/GST Inputs */}
              {accountType === 'BUYER' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                      Headquarters Location *
                    </label>
                    <input
                      type="text"
                      name="cityState"
                      value={formData.cityState}
                      onChange={handleChange}
                      placeholder="e.g. Hyderabad, Telangana"
                      style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#FFFFFF', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      placeholder="e.g. 36APXPH0001A1Z5"
                      style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#FFFFFF', outline: 'none' }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                      Headquarters Location *
                    </label>
                    <input
                      type="text"
                      name="cityState"
                      value={formData.cityState}
                      onChange={handleChange}
                      placeholder="e.g. Baddi, Himachal Pradesh"
                      style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#FFFFFF', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                        Manufacturing License Number
                      </label>
                      <input
                        type="text"
                        name="mfgLicenseNo"
                        value={formData.mfgLicenseNo}
                        onChange={handleChange}
                        placeholder="e.g. ML-HP-2024-001"
                        style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#FFFFFF', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                        WHO-GMP Certificate Number
                      </label>
                      <input
                        type="text"
                        name="whoGmpCertNo"
                        value={formData.whoGmpCertNo}
                        onChange={handleChange}
                        placeholder="e.g. WHO-GMP-2026-091"
                        style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#FFFFFF', outline: 'none' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 3. Estimated Procurement Volume (Optional) */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                  Estimated Procurement Volume (Optional)
                </label>
                <select
                  name="estimatedVolume"
                  value={formData.estimatedVolume}
                  onChange={handleChange}
                  style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#FFFFFF', outline: 'none' }}
                >
                  <option value="Under ₹1,00,00,000">Under ₹1 Cr / year</option>
                  <option value="₹1,00,00,000 – ₹5,00,00,000">₹1 Cr – ₹5 Cr / year</option>
                  <option value="₹5,00,00,000 – ₹25,00,00,000">₹5 Cr – ₹25 Cr / year</option>
                  <option value="₹25,00,00,000+">₹25 Cr+ Enterprise Sourcing</option>
                </select>
              </div>

              {/* 4. Products Required / Manufacturing Capability */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                  Products Required / Manufacturing Capability
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. Paracetamol Tablets, Injectables, Capsules, Syrup, Oncology, Nutraceuticals..."
                  style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#FFFFFF', outline: 'none', resize: 'none' }}
                />
              </div>

              {/* 5. CTA Button */}
              <div style={{ marginTop: 6 }}>
                <button
                  type="submit"
                  style={{
                    width: '100%', background: '#0EA5E9', color: '#FFFFFF', fontSize: 13.5, fontWeight: 700,
                    border: 'none', borderRadius: 6, padding: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  Request Demo & Platform Access <Send size={14} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

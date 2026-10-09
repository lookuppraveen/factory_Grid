import React, { useState } from 'react';
import { X, CheckCircle2, PhoneCall, Mail, Building2, Send, ShieldCheck, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ContactSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactSalesModal: React.FC<ContactSalesModalProps> = ({ isOpen, onClose }) => {
  const { addAuditLog } = useApp();
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    workEmail: '',
    phone: '',
    country: 'India',
    orgType: 'Buyer Distributor / Hospital Network',
    procurementVolume: '₹5,00,00,000 – ₹25,00,00,000',
    preferredContact: 'Phone & Email',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedTicketId = `SALES-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketId(generatedTicketId);
    setIsSubmitted(true);

    addAuditLog(
      'ENTERPRISE_SALES_LEAD',
      `Contact Sales lead received from ${formData.companyName} (${formData.contactPerson})`,
      'SUCCESS'
    );
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, background: 'rgba(5, 12, 22, 0.75)', backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)'
    }}>
      <div style={{
        width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto',
        background: '#0B1726', border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20, padding: '32px 28px', color: '#F8FAFC',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          style={{
            position: 'absolute', top: 20, right: 20,
            background: 'rgba(255, 255, 255, 0.06)', border: 'none',
            borderRadius: 8, width: 32, height: 32, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#94A3B8',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <X size={18} />
        </button>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '24px 8px' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'rgba(24, 213, 165, 0.15)', border: '1px solid rgba(24, 213, 165, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#18D5A5', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(24, 213, 165, 0.3)'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
              Sales Consultation Requested!
            </h3>
            <p style={{ fontSize: 13.5, color: '#94A3B8', lineHeight: 1.6, maxWidth: 420, margin: '0 auto 20px' }}>
              Thank you {formData.contactPerson}. Reference ID: <strong style={{ color: '#22D8FF' }}>{ticketId}</strong>. Our Enterprise Sales VP will connect with <strong style={{ color: '#FFF' }}>{formData.companyName}</strong> within 4 business hours.
            </p>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left', fontSize: 12.5 }}>
              <div style={{ fontWeight: 700, color: '#E2E8F0', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} style={{ color: '#22D8FF' }} /> Direct Escalation Line:
              </div>
              <div style={{ color: '#94A3B8' }}>📞 Toll Free: +91 1800-889-9000</div>
              <div style={{ color: '#94A3B8', marginTop: 4 }}>✉️ Direct Email: sales@factorygrid.com</div>
            </div>
            <button
              onClick={handleResetAndClose}
              style={{
                height: 44, padding: '0 32px', background: '#3B82F6', color: '#FFF',
                border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: 'pointer'
              }}
            >
              Close Window
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6'
              }}>
                <PhoneCall size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Talk to Enterprise Sales
                </h3>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                  Volume Licensing, Custom Integrations &amp; SLA Discussion
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>
                    Company Name *
                  </label>
                  <input
                    type="text" required name="companyName" value={formData.companyName} onChange={handleChange}
                    placeholder="e.g. Apex Healthcare Ltd."
                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>
                    Contact Person *
                  </label>
                  <input
                    type="text" required name="contactPerson" value={formData.contactPerson} onChange={handleChange}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>
                    Work Email *
                  </label>
                  <input
                    type="email" required name="workEmail" value={formData.workEmail} onChange={handleChange}
                    placeholder="name@company.com"
                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel" required name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>
                    Organization Type
                  </label>
                  <select
                    name="orgType" value={formData.orgType} onChange={handleChange}
                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, outline: 'none' }}
                  >
                    <option value="Buyer Distributor / Hospital Network">Buyer Distributor / Hospital Network</option>
                    <option value="CDSCO Verified Manufacturer">CDSCO Verified Manufacturer</option>
                    <option value="Pharma Exporter & CDMO">Pharma Exporter &amp; CDMO</option>
                    <option value="Enterprise Logistics Partner">Enterprise Logistics Partner</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>
                    Country
                  </label>
                  <input
                    type="text" name="country" value={formData.country} onChange={handleChange}
                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>
                  Expected Annual Procurement Volume
                </label>
                <select
                  name="procurementVolume" value={formData.procurementVolume} onChange={handleChange}
                  style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, outline: 'none' }}
                >
                  <option value="Under ₹1,00,00,000">Under ₹1,00,00,000</option>
                  <option value="₹1,00,00,000 – ₹5,00,00,000">₹1,00,00,000 – ₹5,00,00,000</option>
                  <option value="₹5,00,00,000 – ₹25,00,00,000">₹5,00,00,000 – ₹25,00,00,000</option>
                  <option value="₹25,00,00,000+">₹25,00,00,000+</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>
                  Message / Sourcing Requirements
                </label>
                <textarea
                  name="message" rows={3} value={formData.message} onChange={handleChange}
                  placeholder="How can our sales team help your procurement operations?"
                  style={{ width: '100%', padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, outline: 'none', resize: 'none' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  height: 44, marginTop: 6, background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
                  color: '#FFFFFF', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 0 20px rgba(59,130,246,0.3)'
                }}
              >
                <Send size={16} /> Request Sales Consultation
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

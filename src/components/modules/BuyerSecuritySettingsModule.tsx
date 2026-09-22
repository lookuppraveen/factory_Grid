import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck, Lock, Key, CheckCircle2, AlertTriangle, X,
  Smartphone, ShieldAlert, Check, RefreshCw, ChevronRight, UserCheck
} from 'lucide-react';

export const BuyerSecuritySettingsModule: React.FC = () => {
  const { addAuditLog } = useApp();

  // 2FA Persisted State (Session / LocalStorage)
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fg_buyer_2fa_enabled') === 'true';
    } catch {
      return false;
    }
  });

  // Modal States
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [showDisableModal, setShowDisableModal] = useState<boolean>(false);

  // OTP State
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Password Change Form State
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (passForm.newPassword.length < 8) {
      setPassError('New password must be at least 8 characters long.');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError('New password and confirm password do not match.');
      return;
    }

    setPassSuccess('Password updated successfully.');
    setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    addAuditLog('Buyer Security', 'Updated buyer account password.');
  };

  const handleOpenEnable2FA = () => {
    setOtpInput('');
    setOtpError(null);
    setShowSetupModal(true);
  };

  const handleVerifyAndEnable2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (otpInput.trim().length !== 6 || !/^\d+$/.test(otpInput.trim())) {
      setOtpError('Please enter a valid 6-digit numerical OTP code (e.g. 123456).');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIs2FAEnabled(true);
      try {
        localStorage.setItem('fg_buyer_2fa_enabled', 'true');
      } catch (e) { console.error(e); }

      setShowSetupModal(false);
      setOtpInput('');
      addAuditLog('Buyer Security', 'Enabled Two-Factor Authentication (2FA) for Buyer Account.');
    }, 600);
  };

  const handleDisable2FA = () => {
    setIs2FAEnabled(false);
    try {
      localStorage.setItem('fg_buyer_2fa_enabled', 'false');
    } catch (e) { console.error(e); }

    setShowDisableModal(false);
    addAuditLog('Buyer Security', 'Disabled Two-Factor Authentication (2FA) for Buyer Account.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48, background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── TOP HEADER BANNER ────────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              <span>Buyer Portal</span>
              <ChevronRight size={12} />
              <span>Account Settings</span>
              <ChevronRight size={12} />
              <span style={{ color: '#2563EB', fontWeight: 600 }}>Security & 2FA</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              Buyer Security Settings
            </h1>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              Manage your account password, authentication credentials, and Two-Factor Authentication (2FA) security controls.
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: TWO-FACTOR AUTHENTICATION (2FA) ────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: is2FAEnabled ? '#F0FDF4' : '#FFFBEB', color: is2FAEnabled ? '#16A34A' : '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${is2FAEnabled ? '#BBF7D0' : '#FCD34D'}` }}>
                {is2FAEnabled ? <ShieldCheck size={20} /> : <Lock size={20} />}
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Two-Factor Authentication (2FA)</h2>
                <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                  Require a 6-digit security verification code during buyer login and sensitive procurement approvals.
                </div>
              </div>
            </div>
          </div>

          {/* Current Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800,
              background: is2FAEnabled ? '#F0FDF4' : '#FFFBEB',
              color: is2FAEnabled ? '#15803D' : '#B45309',
              border: `1px solid ${is2FAEnabled ? '#BBF7D0' : '#FCD34D'}`
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: is2FAEnabled ? '#16A34A' : '#D97706' }} />
              {is2FAEnabled ? '✓ 2FA Enabled' : '● Disabled / Not Enabled'}
            </span>
          </div>
        </div>

        {/* Dynamic Status Explanation Banner */}
        <div style={{
          background: is2FAEnabled ? '#F0FDF4' : '#FFFBEB',
          border: `1px solid ${is2FAEnabled ? '#BBF7D0' : '#FCD34D'}`,
          borderRadius: 10, padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start'
        }}>
          <div style={{ color: is2FAEnabled ? '#16A34A' : '#D97706', marginTop: 2 }}>
            {is2FAEnabled ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: is2FAEnabled ? '#166534' : '#92400E' }}>
              {is2FAEnabled ? 'Your Buyer Account is Protected with 2FA' : 'Two-Factor Authentication is Currently Disabled'}
            </div>
            <div style={{ fontSize: 12.5, color: is2FAEnabled ? '#15803D' : '#78350F', marginTop: 4, lineHeight: 1.5 }}>
              {is2FAEnabled
                ? 'Two-Factor Authentication is active for your account (v.sethi@apexpharma.com). Verification codes will be requested during account login and critical transaction releases.'
                : 'Add an extra security layer to your pharmaceutical procurement account. When 2FA is enabled, you will be required to enter a 6-digit verification code sent to your registered mobile or authenticator app during login.'
              }
            </div>

            <div style={{ marginTop: 14 }}>
              {is2FAEnabled ? (
                <button
                  onClick={() => setShowDisableModal(true)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, background: '#FEF2F2', color: '#DC2626',
                    border: '1px solid #FECACA', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6
                  }}
                >
                  Disable 2FA
                </button>
              ) : (
                <button
                  onClick={handleOpenEnable2FA}
                  style={{
                    padding: '9px 18px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF',
                    border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 6px rgba(37,99,235,0.2)'
                  }}
                >
                  <Key size={16} /> Enable 2FA
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: PASSWORD CHANGE FORM ───────────────────────────── */}
      <form onSubmit={handlePasswordSubmit} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Password & Account Credentials</h2>
          <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
            Update your login password. Passwords must be at least 8 characters long.
          </div>
        </div>

        {passSuccess && (
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', padding: 12, borderRadius: 8, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} /> {passSuccess}
          </div>
        )}

        {passError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: 12, borderRadius: 8, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} /> {passError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={passForm.currentPassword}
              onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={passForm.newPassword}
              onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={passForm.confirmPassword}
              onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
              required
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            style={{ padding: '9px 20px', borderRadius: 8, background: '#0F172A', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
          >
            Update Password
          </button>
        </div>
      </form>

      {/* ── 2FA ENABLE SETUP MODAL ────────────────────────────────────── */}
      {showSetupModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowSetupModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={18} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Enable Two-Factor Authentication</h3>
              </div>
              <button onClick={() => setShowSetupModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
              Two-Factor Authentication adds an additional verification step to protect your buyer account against unauthorized access.
            </div>

            {/* Simulated Demo OTP Box */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Demo Verification OTP Sent To Mobile</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#2563EB', letterSpacing: '0.25em', margin: '6px 0', fontFamily: 'monospace' }}>123456</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>Enter code <strong style={{ color: '#0F172A' }}>123456</strong> below to complete setup</div>
            </div>

            <form onSubmit={handleVerifyAndEnable2FA} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Enter 6-Digit Verification Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 16, fontWeight: 800, textAlign: 'center', letterSpacing: '0.3em', outline: 'none' }}
                  autoFocus
                  required
                />
              </div>

              {otpError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  ⚠️ {otpError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowSetupModal(false)}
                  style={{ padding: '9px 16px', borderRadius: 8, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  style={{ padding: '9px 20px', borderRadius: 8, background: '#16A34A', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {isVerifying ? <RefreshCw size={15} className="animate-spin" /> : <Check size={16} />}
                  {isVerifying ? 'Verifying...' : 'Verify & Enable 2FA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2FA DISABLE CONFIRMATION MODAL ───────────────────────────── */}
      {showDisableModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowDisableModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={18} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Disable Two-Factor Authentication?</h3>
            </div>

            <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
              Are you sure you want to disable 2FA? Your buyer account will rely solely on password authentication for login and transactions.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                onClick={() => setShowDisableModal(false)}
                style={{ padding: '9px 16px', borderRadius: 8, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDisable2FA}
                style={{ padding: '9px 18px', borderRadius: 8, background: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                Confirm Disable
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

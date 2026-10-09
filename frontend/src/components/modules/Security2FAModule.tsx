import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck, Lock, Key, Copy, Download, Check, AlertTriangle, RefreshCw, X, Shield, QrCode
} from 'lucide-react';
import {
  generateBase32Secret, formatSecretKey, getOtpAuthUrl,
  verifyTOTPToken, generateRecoveryCodes, generateQRCodeSvgUri
} from '../../services/auth/totpUtils';

export const Security2FAModule: React.FC = () => {
  const { twoFactorState, enable2FA, disable2FA, regenerateRecoveryCodes, addAuditLog, userProfile } = useApp();

  // Wizard Modal States
  const [isEnableModalOpen, setIsEnableModalOpen] = useState<boolean>(false);
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);

  // Setup Secret & QR Code State
  const [setupSecret, setSetupSecret] = useState<string>('');
  const [setupQrSvg, setSetupQrSvg] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [generatedRecoveryCodes, setGeneratedRecoveryCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [copiedCodes, setCopiedCodes] = useState<boolean>(false);

  // Manage / Disable Modal States
  const [isDisableModalOpen, setIsDisableModalOpen] = useState<boolean>(false);
  const [disablePasswordInput, setDisablePasswordInput] = useState<string>('');
  const [disableOtpInput, setDisableOtpInput] = useState<string>('');
  const [disableError, setDisableError] = useState<string | null>(null);
  const [isDisabling, setIsDisabling] = useState<boolean>(false);

  // Regenerate Codes Modal States
  const [isRegenModalOpen, setIsRegenModalOpen] = useState<boolean>(false);
  const [regenPasswordInput, setRegenPasswordInput] = useState<string>('');
  const [regenOtpInput, setRegenOtpInput] = useState<string>('');
  const [regenError, setRegenError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [newRegenCodes, setNewRegenCodes] = useState<string[] | null>(null);

  const userEmail = userProfile?.email || 'user@factorygrid.com';

  // Start Enable 2FA Flow
  const handleStartEnable = () => {
    const newSecret = generateBase32Secret(16);
    const otpAuthUrl = getOtpAuthUrl(newSecret, userEmail);
    const qrSvgUri = generateQRCodeSvgUri(otpAuthUrl);

    setSetupSecret(newSecret);
    setSetupQrSvg(qrSvgUri);
    setOtpInput('');
    setOtpError(null);
    setSetupStep(1);
    setCopiedSecret(false);
    setCopiedCodes(false);
    setIsEnableModalOpen(true);
  };

  // Step 2: Verify & Enable 2FA
  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    const cleanInput = otpInput.replace(/\s+/g, '').trim();
    if (!/^\d{6}$/.test(cleanInput)) {
      setOtpError('✕ Please enter a valid 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    const isValid = await verifyTOTPToken(setupSecret, cleanInput);
    setIsVerifying(false);

    if (isValid) {
      const codes = generateRecoveryCodes(8);
      setGeneratedRecoveryCodes(codes);
      enable2FA(setupSecret, codes);
      setSetupStep(3); // Advance to recovery codes screen
    } else {
      setOtpError('✕ Invalid verification code. Please check your authenticator app and try again.');
      addAuditLog('Security Alert', 'Failed 2FA Setup Code Verification');
    }
  };

  // Copy Secret Key
  const handleCopySecret = () => {
    navigator.clipboard.writeText(setupSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 3000);
  };

  // Copy Recovery Codes
  const handleCopyRecoveryCodes = (codesList: string[]) => {
    navigator.clipboard.writeText(codesList.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 3000);
  };

  // Download Recovery Codes as TXT file
  const handleDownloadRecoveryCodes = (codesList: string[]) => {
    const textContent = `FACTORYGRID PLATFORM — RECOVERY CODES\n=========================================\nAccount: ${userEmail}\nDate: ${new Date().toISOString().split('T')[0]}\n\nThese codes allow emergency access if you lose your authenticator app.\nEach code can only be used once.\n\n` + codesList.map((c, i) => `${i + 1}. ${c}`).join('\n') + `\n\n🔒 Keep these codes stored securely offline.`;

    const element = document.createElement('a');
    const file = new Blob([textContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `FactoryGrid_Recovery_Codes_${userEmail.split('@')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Disable 2FA Submit Handler
  const handleDisableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableError(null);

    if (!disablePasswordInput || !disableOtpInput) {
      setDisableError('✕ Password and 2FA verification code are required.');
      return;
    }

    setIsDisabling(true);
    const res = await disable2FA(disablePasswordInput, disableOtpInput);
    setIsDisabling(false);

    if (res.success) {
      setIsDisableModalOpen(false);
      setDisablePasswordInput('');
      setDisableOtpInput('');
      alert(res.message);
    } else {
      setDisableError(res.message);
    }
  };

  // Regenerate Recovery Codes Submit Handler
  const handleRegenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegenError(null);

    if (!regenPasswordInput || !regenOtpInput) {
      setRegenError('✕ Password and 2FA code are required.');
      return;
    }

    setIsRegenerating(true);
    const res = await regenerateRecoveryCodes(regenPasswordInput, regenOtpInput);
    setIsRegenerating(false);

    if (res.success && res.newCodes) {
      setNewRegenCodes(res.newCodes);
    } else {
      setRegenError(res.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* MAIN 2FA CARD */}
      <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 22, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: 10, background: twoFactorState.isEnabled ? '#DCFCE7' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: twoFactorState.isEnabled ? '1px solid #86EFAC' : '1px solid #CBD5E1' }}>
              <ShieldCheck size={26} style={{ color: twoFactorState.isEnabled ? '#15803D' : '#64748B' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Two-Factor Authentication (2FA)
                </h3>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                  background: twoFactorState.isEnabled ? '#DCFCE7' : '#F1F5F9',
                  color: twoFactorState.isEnabled ? '#15803D' : '#64748B',
                  border: twoFactorState.isEnabled ? '1px solid #86EFAC' : '1px solid #CBD5E1'
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: twoFactorState.isEnabled ? '#16A34A' : '#94A3B8' }} />
                  {twoFactorState.isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                Protect your manufacturer account with an additional verification step during sign-in.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {twoFactorState.isEnabled ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setRegenPasswordInput('');
                    setRegenOtpInput('');
                    setRegenError(null);
                    setNewRegenCodes(null);
                    setIsRegenModalOpen(true);
                  }}
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFF', color: '#0F172A', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Key size={14} /> Recovery Codes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDisablePasswordInput('');
                    setDisableOtpInput('');
                    setDisableError(null);
                    setIsDisableModalOpen(true);
                  }}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #FECDD3', background: '#FFF1F2', color: '#E11D48', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  Disable 2FA
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEnable}
                style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 6px rgba(37,99,235,0.25)' }}
              >
                <ShieldCheck size={16} /> Enable 2FA →
              </button>
            )}
          </div>
        </div>

        {/* 2FA Summary Details if Enabled */}
        {twoFactorState.isEnabled && (
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, fontSize: 12, color: '#334155', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 700 }}>2FA Authentication Method</span>
              <strong style={{ color: '#0F172A' }}>TOTP Authenticator App</strong>
            </div>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 700 }}>Enabled Date</span>
              <strong style={{ color: '#0F172A' }}>{twoFactorState.enabledAt || 'Active'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 700 }}>Unused Recovery Codes</span>
              <strong style={{ color: '#15803D' }}>
                {twoFactorState.recoveryCodes.filter(c => !c.isUsed).length} of {twoFactorState.recoveryCodes.length} Remaining
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL 1: ENABLE 2FA WIZARD ──────────────────────────────── */}
      {isEnableModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10030, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setIsEnableModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.35)', display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <QrCode size={22} style={{ color: '#2563EB' }} />
                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Set Up Two-Factor Authentication
                </h3>
              </div>
              <button onClick={() => setIsEnableModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Stepper Progress */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11.5, fontWeight: setupStep === 1 ? 800 : 600, color: setupStep === 1 ? '#2563EB' : '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: setupStep === 1 ? '#2563EB' : '#CBD5E1', color: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>1</span>
                Scan QR Code
              </div>
              <div style={{ width: 20, height: 1, background: '#CBD5E1' }} />
              <div style={{ fontSize: 11.5, fontWeight: setupStep === 2 ? 800 : 600, color: setupStep === 2 ? '#2563EB' : '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: setupStep === 2 ? '#2563EB' : '#CBD5E1', color: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>2</span>
                Verify Code
              </div>
              <div style={{ width: 20, height: 1, background: '#CBD5E1' }} />
              <div style={{ fontSize: 11.5, fontWeight: setupStep === 3 ? 800 : 600, color: setupStep === 3 ? '#16A34A' : '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: setupStep === 3 ? '#16A34A' : '#CBD5E1', color: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>3</span>
                Recovery Codes
              </div>
            </div>

            {/* STEP 1: SCAN QR CODE */}
            {setupStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 12.5, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  Scan this QR code using <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, <strong>Authy</strong>, or another compatible TOTP app.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 16, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <img src={setupQrSvg} alt="2FA QR Code" style={{ width: 160, height: 160, borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF' }} />
                  <div style={{ fontSize: 11, color: '#64748B' }}>Or enter key manually into your app:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFF', border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 12px' }}>
                    <code style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', letterSpacing: '0.1em' }}>
                      {formatSecretKey(setupSecret)}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      style={{ border: 'none', background: 'none', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}
                    >
                      {copiedSecret ? <Check size={14} style={{ color: '#16A34A' }} /> : <Copy size={14} />}
                      {copiedSecret ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                  <button type="button" onClick={() => setIsEnableModalOpen(false)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button
                    type="button"
                    onClick={() => setSetupStep(2)}
                    style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#FFF', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Next: Verify Code →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: VERIFY CODE */}
            {setupStep === 2 && (
              <form onSubmit={handleVerifyAndEnable} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 12.5, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  Enter the 6-digit verification code generated by your authenticator app to complete setup.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="000 000"
                    style={{
                      width: 220, textAlign: 'center', fontSize: 24, fontWeight: 900, letterSpacing: '0.3em',
                      padding: '10px 14px', border: '2px solid #2563EB', borderRadius: 8, fontFamily: 'monospace'
                    }}
                  />
                </div>

                {otpError && (
                  <div style={{ padding: 10, borderRadius: 8, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
                    {otpError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                  <button type="button" onClick={() => setSetupStep(1)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>← Back to QR</button>
                  <button
                    type="submit"
                    disabled={isVerifying || otpInput.length !== 6}
                    style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#FFF', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {isVerifying ? <RefreshCw size={14} className="spin" /> : null}
                    {isVerifying ? 'Verifying...' : 'Verify & Enable 2FA →'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: RECOVERY CODES */}
            {setupStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 8, padding: 12, color: '#15803D', fontSize: 12.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={20} />
                  Two-Factor Authentication (2FA) Successfully Enabled!
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Save Your Recovery Codes</h4>
                  <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.4 }}>
                    These codes can be used to access your account if you lose access to your authenticator app. <strong>Each code can only be used once.</strong> Store them securely.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                  {generatedRecoveryCodes.map((c, idx) => (
                    <div key={idx} style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: '#0F172A', background: '#FFF', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: 6, textAlign: 'center' }}>
                      {c}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyRecoveryCodes(generatedRecoveryCodes)}
                    style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#0F172A', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {copiedCodes ? <Check size={14} style={{ color: '#16A34A' }} /> : <Copy size={14} />}
                    {copiedCodes ? 'Codes Copied!' : 'Copy All Codes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadRecoveryCodes(generatedRecoveryCodes)}
                    style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#0F172A', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Download size={14} /> Download .TXT File
                  </button>
                </div>

                <div style={{ paddingTop: 10, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setIsEnableModalOpen(false)}
                    style={{ padding: '9px 24px', borderRadius: 6, border: 'none', background: '#16A34A', color: '#FFF', fontSize: 12.5, fontWeight: 900, cursor: 'pointer' }}
                  >
                    Done & Complete Setup ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 2: DISABLE 2FA ───────────────────────────────────── */}
      {isDisableModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10030, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setIsDisableModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 22, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.35)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={22} style={{ color: '#DC2626' }} />
                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Disable Two-Factor Authentication
                </h3>
              </div>
              <button onClick={() => setIsDisableModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 10, fontSize: 12, color: '#991B1B', fontWeight: 600 }}>
              ⚠️ Are you sure you want to disable 2FA? Your account will be less secure against unauthorized access attempts.
            </div>

            <form onSubmit={handleDisableSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Current Password *</label>
                <input
                  type="password"
                  required
                  value={disablePasswordInput}
                  onChange={e => setDisablePasswordInput(e.target.value)}
                  placeholder="Enter current account password"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Current 2FA Authenticator Code *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={disableOtpInput}
                  onChange={e => setDisableOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="000 000"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }}
                />
              </div>

              {disableError && (
                <div style={{ padding: 10, borderRadius: 6, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: 12, fontWeight: 700 }}>
                  {disableError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setIsDisableModalOpen(false)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button
                  type="submit"
                  disabled={isDisabling}
                  style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  {isDisabling ? 'Disabling...' : 'Confirm Disable 2FA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: VIEW / REGENERATE RECOVERY CODES ───────────────── */}
      {isRegenModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10030, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setIsRegenModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 22, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.35)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Key size={22} style={{ color: '#2563EB' }} />
                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  2FA Recovery Codes
                </h3>
              </div>
              <button onClick={() => setIsRegenModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {newRegenCodes ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 8, padding: 10, color: '#15803D', fontSize: 12, fontWeight: 800 }}>
                  ✓ New recovery codes generated successfully. Previous codes are now invalid.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                  {newRegenCodes.map((c, i) => (
                    <div key={i} style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: '#0F172A', background: '#FFF', border: '1px solid #E2E8F0', padding: '6px', borderRadius: 4, textAlign: 'center' }}>
                      {c}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => handleCopyRecoveryCodes(newRegenCodes)} style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Copy Codes</button>
                  <button type="button" onClick={() => handleDownloadRecoveryCodes(newRegenCodes)} style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Download TXT</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  Active Unused Recovery Codes:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                  {twoFactorState.recoveryCodes.map((rc, i) => (
                    <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: rc.isUsed ? '#94A3B8' : '#0F172A', textDecoration: rc.isUsed ? 'line-through' : 'none', background: '#FFF', border: '1px solid #E2E8F0', padding: '4px 8px', borderRadius: 4, textAlign: 'center' }}>
                      {rc.code} {rc.isUsed ? '(USED)' : ''}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleRegenSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>Generate Completely New Recovery Codes</div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 2 }}>Current Password *</label>
                    <input
                      type="password"
                      required
                      value={regenPasswordInput}
                      onChange={e => setRegenPasswordInput(e.target.value)}
                      placeholder="Enter password"
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 2 }}>2FA Authenticator Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={regenOtpInput}
                      onChange={e => setRegenOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="000 000"
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, fontFamily: 'monospace' }}
                    />
                  </div>

                  {regenError && (
                    <div style={{ padding: 8, borderRadius: 6, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: 11.5, fontWeight: 700 }}>
                      {regenError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
                    <button type="button" onClick={() => setIsRegenModalOpen(false)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Close</button>
                    <button type="submit" disabled={isRegenerating} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#FFF', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                      {isRegenerating ? 'Generating...' : 'Regenerate New Codes'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

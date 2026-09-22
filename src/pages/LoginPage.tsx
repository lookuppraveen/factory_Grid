import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Factory, ShieldCheck, ArrowRight, CheckCircle2,
  Lock, KeyRound, Sparkles, FileText, Upload, ChevronRight, ArrowLeft, Users, AlertCircle, HelpCircle,
  Eye, EyeOff, Mail, Bot, Zap, Truck, BarChart3, Key, RefreshCw
} from 'lucide-react';;
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { PharmaFactoryIllustration } from '../components/common/Illustrations';
import { LogoMark } from '../components/common/LogoMark';
import { EnterpriseAccessRequestModal } from '../components/common/EnterpriseAccessRequestModal';

interface LoginPageProps {
  onNavigate: (page: string, overrideRole?: string) => void;
}

type CategoryType = 'BUYER_COMPANY' | 'MANUFACTURER_COMPANY' | 'FG_STAFF';

/* ─────────────────────────────────────────────────────────
   PREMIUM BACKGROUND CANVAS
   Fine 22px grid + ambient glows + 60 slow twinkling particles
───────────────────────────────────────────────────────── */
function LoginBgCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>(0);
  const tick = useRef<number>(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = 0, H = 0;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    type Pt = { x: number; y: number; vx: number; vy: number; r: number; ph: number; c: number };
    const pts: Pt[] = Array.from({ length: 60 }, (_, i) => ({
      x:  (i * 137.5 % 100) / 100 * window.innerWidth,
      y:  (i * 97.3  % 100) / 100 * window.innerHeight,
      vx: ((i * 13 % 7) - 3) * 0.022,
      vy: -((i * 7 % 5) + 1) * 0.022,
      r:  (i % 4) * 0.26 + 0.28,
      ph: (i * 0.52) % (Math.PI * 2),
      c:  i % 3,
    }));

    const draw = () => {
      tick.current += 1;
      const T = tick.current;
      ctx.clearRect(0, 0, W, H);

      // Base gradient
      const bg = ctx.createLinearGradient(0, 0, W * 0.5, H);
      bg.addColorStop(0, '#07111D');
      bg.addColorStop(0.5, '#081521');
      bg.addColorStop(1, '#0A1929');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Left teal ambient glow
      const g1 = ctx.createRadialGradient(W * 0.05, H * 0.45, 0, W * 0.05, H * 0.45, W * 0.48);
      g1.addColorStop(0, 'rgba(20,184,166,0.13)');
      g1.addColorStop(0.6, 'rgba(20,184,166,0.03)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

      // Right cyan blue glow (form side)
      const g2 = ctx.createRadialGradient(W * 0.75, H * 0.38, 0, W * 0.75, H * 0.38, W * 0.42);
      g2.addColorStop(0, 'rgba(59,130,246,0.12)');
      g2.addColorStop(0.5, 'rgba(6,182,212,0.05)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

      // Fine Standard 14px Blueprint Sub-Grid (Ultra-Light)
      ctx.lineWidth = 0.5;
      const GS = 14;
      for (let c = 0; c <= Math.ceil(W / GS) + 1; c++) {
        ctx.strokeStyle = 'rgba(34,216,255,0.016)';
        ctx.beginPath(); ctx.moveTo(c * GS, 0); ctx.lineTo(c * GS, H); ctx.stroke();
      }
      for (let r = 0; r <= Math.ceil(H / GS) + 1; r++) {
        ctx.strokeStyle = 'rgba(34,216,255,0.012)';
        ctx.beginPath(); ctx.moveTo(0, r * GS); ctx.lineTo(W, r * GS); ctx.stroke();
      }

      // Floating particles
      const colors = ['rgba(220,240,255', 'rgba(34,216,255', 'rgba(20,210,190'];
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const a = (Math.sin(T * 0.016 + p.ph) * 0.42 + 0.58) * 0.28;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${colors[p.c]},${a.toFixed(3)})`; ctx.fill();
      });

      // Edge vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.95);
      vg.addColorStop(0, 'transparent');
      vg.addColorStop(1, 'rgba(5,14,24,0.55)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

/* ─────────────────────────────────────────────────────────
   ENTERPRISE ISO ILLUSTRATION — animated SVG network nodes
───────────────────────────────────────────────────────── */
function EnterpriseIsoIllustration() {
  return (
    <svg viewBox="0 0 340 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 380 }}>
      <defs>
        <filter id="lgi"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="sgi"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <line x1="60" y1="100" x2="170" y2="60"  stroke="rgba(20,241,217,0.2)"  strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="170" y1="60"  x2="280" y2="90"  stroke="rgba(59,130,246,0.2)"  strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="60" y1="100" x2="170" y2="150" stroke="rgba(20,241,217,0.15)" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="170" y1="150" x2="280" y2="90"  stroke="rgba(59,130,246,0.15)" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="170" y1="60"  x2="170" y2="150" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      {/* Factory */}
      <rect x="145" y="38" width="50" height="34" rx="8" fill="rgba(20,184,166,0.12)" stroke="rgba(20,184,166,0.45)" strokeWidth="1" filter="url(#sgi)"/>
      <rect x="155" y="48" width="10" height="14" rx="2" fill="rgba(20,184,166,0.6)"/>
      <rect x="170" y="44" width="10" height="18" rx="2" fill="rgba(20,184,166,0.8)"/>
      {/* Hub */}
      <circle cx="170" cy="100" r="18" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.55)" strokeWidth="1.5" filter="url(#lgi)"/>
      <circle cx="170" cy="100" r="8" fill="rgba(59,130,246,0.5)"/>
      <circle cx="170" cy="100" r="3" fill="#fff"/>
      {/* Buyer */}
      <rect x="30" y="78" width="44" height="34" rx="8" fill="rgba(59,130,246,0.10)" stroke="rgba(59,130,246,0.4)" strokeWidth="1" filter="url(#sgi)"/>
      <rect x="38" y="86" width="14" height="18" rx="2" fill="rgba(59,130,246,0.5)"/>
      <rect x="55" y="90" width="12" height="14" rx="2" fill="rgba(59,130,246,0.35)"/>
      {/* Warehouse */}
      <rect x="145" y="128" width="50" height="34" rx="8" fill="rgba(99,102,241,0.10)" stroke="rgba(99,102,241,0.35)" strokeWidth="1" filter="url(#sgi)"/>
      <rect x="155" y="138" width="12" height="16" rx="2" fill="rgba(99,102,241,0.5)"/>
      <rect x="170" y="134" width="18" height="20" rx="2" fill="rgba(99,102,241,0.35)"/>
      {/* Truck */}
      <rect x="258" y="72" width="48" height="32" rx="8" fill="rgba(20,241,217,0.08)" stroke="rgba(20,241,217,0.35)" strokeWidth="1" filter="url(#sgi)"/>
      <rect x="265" y="82" width="24" height="14" rx="2" fill="rgba(20,241,217,0.35)"/>
      <rect x="291" y="78" width="10" height="18" rx="2" fill="rgba(20,241,217,0.5)"/>
      <circle cx="272" cy="98" r="4" fill="rgba(20,241,217,0.6)" filter="url(#sgi)"/>
      <circle cx="292" cy="98" r="4" fill="rgba(20,241,217,0.6)" filter="url(#sgi)"/>
      {/* Animated pulse dots */}
      <circle cx="0" cy="0" r="2.5" fill="#14F1D9" filter="url(#sgi)" opacity="0.9">
        <animateMotion dur="3s" repeatCount="indefinite" path="M60,100 L170,60"/>
      </circle>
      <circle cx="0" cy="0" r="2" fill="#3B82F6" filter="url(#sgi)" opacity="0.8">
        <animateMotion dur="4s" repeatCount="indefinite" begin="1.5s" path="M170,60 L280,90"/>
      </circle>
      <circle cx="0" cy="0" r="2" fill="#14B8A6" filter="url(#sgi)" opacity="0.7">
        <animateMotion dur="3.5s" repeatCount="indefinite" begin="0.5s" path="M170,150 L60,100"/>
      </circle>
    </svg>
  );
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { setCurrentRole, setActiveTab, login, twoFactorState, verify2FAAttempt, useRecoveryCode } = useApp();

  const [activeCategory, setActiveCategory] = useState<CategoryType>('BUYER_COMPANY');
  const [isRegistering, setIsRegistering] = useState(false);
  const [staffRole, setStaffRole] = useState<UserRole | ''>('');
  const [roleValidationError, setRoleValidationError] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Form State
  const [email, setEmail] = useState('buyer@apexpharma.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Multi-step Registration Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [buyerData, setBuyerData] = useState({
    companyName: '', contactPerson: '', phone: '', email: '', companyType: 'Distributor',
    address: '', city: '', state: '', gstin: '', pan: '', drugLicenseNo: '', dlExpiry: '', docUploaded: false,
  });
  const [mfgData, setMfgData] = useState({
    factoryName: '', contactPerson: '', phone: '', email: '', city: '', state: '',
    capacity: '10,000,000 Units/year', whoGmpCertNo: '', whoGmpExpiry: '', mfgLicenseNo: '',
    drugLicenseNo: '', trademark: '', docUploaded: false,
  });

  // Two-Factor Authentication (2FA) Intercept State
  const [step2FA, setStep2FA] = useState<'NONE' | 'TOTP' | 'RECOVERY_CODE'>('NONE');
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [totpCodeInput, setTotpCodeInput] = useState<string>('');
  const [recoveryCodeInput, setRecoveryCodeInput] = useState<string>('');
  const [otpLoginError, setOtpLoginError] = useState<string | null>(null);
  const [isVerifying2FA, setIsVerifying2FA] = useState<boolean>(false);

  // Handle Login & Auto Role-Based Redirection
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOtpLoginError(null);

    let role: UserRole = 'BUYER';
    if (activeCategory === 'BUYER_COMPANY') {
      role = 'BUYER';
      setActiveTab('dashboard');
    } else if (activeCategory === 'MANUFACTURER_COMPANY') {
      role = 'SUPPLIER';
      setActiveTab('dashboard');
    } else {
      if (!staffRole) {
        setLoading(false);
        setRoleValidationError('Please select a staff role.');
        return;
      }
      setRoleValidationError(null);
      role = staffRole as UserRole;
      if (staffRole === 'COMPLIANCE_OFFICER') {
        setActiveTab('customer-verification');
      } else if (staffRole === 'ADMIN') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('dashboard');
      }
    }

    // Intercept with Two-Factor Authentication if Enabled
    if (twoFactorState.isEnabled) {
      setTimeout(() => {
        setLoading(false);
        setPendingRole(role);
        setStep2FA('TOTP');
        setTotpCodeInput('');
      }, 300);
      return;
    }

    login(role);

    setTimeout(() => {
      setLoading(false);
      onNavigate('dashboard', role);
    }, 200);
  };

  // Submit TOTP Code
  const handleVerify2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoginError(null);

    if (!totpCodeInput || totpCodeInput.length !== 6) {
      setOtpLoginError('✕ Please enter a valid 6-digit verification code.');
      return;
    }

    setIsVerifying2FA(true);
    const res = await verify2FAAttempt(totpCodeInput);
    setIsVerifying2FA(false);

    if (res.success && pendingRole) {
      login(pendingRole);
      setStep2FA('NONE');
      onNavigate('dashboard');
    } else {
      setOtpLoginError(res.message);
    }
  };

  // Submit Recovery Code
  const handleVerifyRecoveryCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoginError(null);

    if (!recoveryCodeInput.trim()) {
      setOtpLoginError('✕ Please enter a valid recovery code.');
      return;
    }

    const res = useRecoveryCode(recoveryCodeInput);
    if (res.success && pendingRole) {
      login(pendingRole);
      setStep2FA('NONE');
      onNavigate('dashboard');
    } else {
      setOtpLoginError(res.message);
    }
  };

  // Complete Registration & Auto Login
  const handleCompleteRegistration = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      let role: UserRole = 'BUYER';
      if (activeCategory === 'BUYER_COMPANY') {
        role = 'BUYER'; setActiveTab('dashboard');
      } else {
        role = 'SUPPLIER'; setActiveTab('dashboard');
      }
      login(role);
      onNavigate('dashboard');
    }, 1000);
  };

  const categoriesConfig = {
    BUYER_COMPANY: {
      title: 'Buyer Company Account',
      sub: 'For pharma distributors, hospitals, wholesalers & procurement teams',
      icon: Building2, color: '#3B82F6', defaultEmail: 'buyer@apexpharma.com'
    },
    MANUFACTURER_COMPANY: {
      title: 'Manufacturer Company',
      sub: 'For CDSCO & WHO-GMP certified formulators responding to RFQs',
      icon: Factory, color: '#14B8A6', defaultEmail: 'supplier@sunbiolabs.com'
    },
    FG_STAFF: {
      title: 'FactoryGrid Staff',
      sub: 'Internal employees only (Compliance, Accounts, Sales, Admin)',
      icon: ShieldCheck, color: '#8B5CF6', defaultEmail: 'staff@factorygrid.com'
    }
  };

  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  const features = [
    { icon: Bot,       label: 'AI RFQ Matching',              desc: 'Automated multi-manufacturer sourcing' },
    { icon: ShieldCheck, label: 'Verified WHO-GMP Manufacturers', desc: 'CDSCO Form 20B/21B license validated' },
    { icon: Truck,     label: 'Cold Chain Monitoring',         desc: '2°C–8°C IoT shipment tracking' },
    { icon: BarChart3, label: 'Enterprise Procurement',        desc: 'Unified workflow & analytics' },
  ];

  const catKeys = Object.keys(categoriesConfig) as CategoryType[];
  const activeCfg = categoriesConfig[activeCategory];

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: '100%', height: 44,
    padding: '0 14px 0 40px',
    background: 'rgba(255,255,255,0.04)',
    border: focused ? '1px solid rgba(59,130,246,0.7)' : '1px solid rgba(255,255,255,0.09)',
    borderRadius: 10, fontSize: 13.5, color: '#F8FAFC', outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
  });

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      background: '#0B0F19',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      overflowX: 'hidden',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    }}>
      <LoginBgCanvas />

      {/* ── LEFT PANEL ── */}
      <div style={{ flex: isMobile ? 'none' : '0 0 45%', position: 'relative', zIndex: 1, padding: isMobile ? '24px 20px 20px' : '44px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.06)', borderBottom: isMobile ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: isMobile ? 16 : 0 }} onClick={() => onNavigate('landing')}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#14F1D9 0%,#3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(20,241,217,0.25)' }}>
            <LogoMark size={20} color="#0F172A" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>FactoryGrid</div>
            <div style={{ fontSize: 9.5, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Enterprise Procurement</div>
          </div>
        </motion.div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} style={{ maxWidth: 460 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#14F1D9', background: 'rgba(20,241,217,0.08)', border: '1px solid rgba(20,241,217,0.2)', padding: '4px 12px', borderRadius: 999, marginBottom: isMobile ? 14 : 22, letterSpacing: '0.04em' }}>
            <Sparkles size={11} /> CDSCO &amp; WHO-GMP Verified Portal
          </div>
          <h1 style={{ fontSize: isMobile ? 24 : 36, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: isMobile ? 10 : 16, color: '#F8FAFC' }}>
            Enterprise {isMobile ? '' : <br />}
            <span style={{ background: 'linear-gradient(90deg,#14F1D9,#3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pharmaceutical</span> {isMobile ? '' : <br />}
            Procurement Workspace
          </h1>
          <p style={{ fontSize: isMobile ? 12.5 : 13.5, color: '#64748B', lineHeight: 1.55, marginBottom: isMobile ? 10 : 24, maxWidth: 390 }}>
            Streamline multi-manufacturer RFQ sourcing, automated quote matrices, and cold-chain IoT shipment tracking.
          </p>
          {!isMobile && <div style={{ marginBottom: 24 }}><EnterpriseIsoIllustration /></div>}
          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(20,241,217,0.10)', border: '1px solid rgba(20,241,217,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} style={{ color: '#14F1D9' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9' }}>{f.label}</div>
                      <div style={{ fontSize: 10.5, color: '#475569' }}>{f.desc}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {!isMobile && <div style={{ fontSize: 10.5, color: '#334155' }}>© 2026 FactoryGrid Technologies Inc. · ISO 9001:2015 · CDSCO Audit Ready</div>}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: isMobile ? '1' : '0 0 55%', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px 14px 40px' : '36px 32px', overflowY: 'auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} style={{ width: '100%', maxWidth: 420 }}>

          {/* Compact Glass Card */}
          <div style={{ background: 'rgba(10,17,30,0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: isMobile ? 16 : 20, padding: isMobile ? '22px 16px' : '30px 28px', boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset' }}>

            {/* Card Header */}
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,rgba(59,130,246,0.25),rgba(20,241,217,0.15))', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 0 20px rgba(59,130,246,0.2)' }}>
                <Lock size={19} style={{ color: '#3B82F6' }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: 4 }}>Enterprise Workspace Login</div>
              <div style={{ fontSize: 12, color: '#475569' }}>Secure access for verified organizations</div>
            </div>

            {/* Segmented Entity Selector */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
              {catKeys.map(cat => {
                const cfg = categoriesConfig[cat];
                const Icon = cfg.icon;
                const isActive = activeCategory === cat;
                return (
                  <button key={cat} type="button"
                    onClick={() => { setActiveCategory(cat); setEmail(cfg.defaultEmail); setIsRegistering(false); setWizardStep(1); }}
                    style={{ border: 'none', borderRadius: 7, padding: '8px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent', color: isActive ? '#fff' : '#475569', transition: 'all 0.2s', outline: isActive ? `1px solid ${cfg.color}55` : 'none', boxShadow: isActive ? `0 0 16px ${cfg.color}22` : 'none' }}>
                    <Icon size={15} style={{ color: isActive ? cfg.color : '#475569' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.2 }}>
                      {cat === 'BUYER_COMPANY' ? 'Buyer' : cat === 'MANUFACTURER_COMPANY' ? 'Manufacturer' : 'FG Staff'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Category Banner */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px', marginBottom: 18, borderLeft: `3px solid ${activeCfg.color}` }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#F1F5F9' }}>{activeCfg.title}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{activeCfg.sub}</div>
            </div>

            {/* Staff blocked notice */}
            {activeCategory === 'FG_STAFF' && isRegistering && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 14, marginBottom: 16, textAlign: 'center' }}>
                <AlertCircle size={18} style={{ color: '#EF4444', margin: '0 auto 6px', display: 'block' }} />
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#F87171' }}>Public Registration Blocked</div>
                <div style={{ fontSize: 11.5, color: '#FCA5A5', marginTop: 3, lineHeight: 1.4 }}>
                  FactoryGrid Staff accounts cannot be self-registered. They are provisioned internally by Platform Administrators.
                </div>
                <button onClick={() => setIsRegistering(false)}
                  style={{ marginTop: 10, background: '#EF4444', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                  Return to Staff Login
                </button>
              </div>
            )}

            {/* LOGIN FORM OR 2FA VERIFICATION STEP */}
            {step2FA === 'TOTP' ? (
              <form onSubmit={handleVerify2FASubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <ShieldCheck size={26} style={{ color: '#3B82F6', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FFF' }}>Two-Factor Authentication Required</div>
                    <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>Enter the 6-digit verification code from your authenticator app.</div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>6-Digit Authenticator Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={totpCodeInput}
                    onChange={e => setTotpCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="000 000"
                    style={{ width: '100%', height: 44, textAlign: 'center', fontSize: 20, fontWeight: 900, letterSpacing: '0.25em', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.5)', borderRadius: 10, color: '#FFF', fontFamily: 'monospace' }}
                  />
                </div>

                {otpLoginError && (
                  <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
                    {otpLoginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying2FA || totpCodeInput.length !== 6}
                  style={{ width: '100%', height: 44, background: isVerifying2FA ? 'rgba(59,130,246,0.5)' : '#2563EB', color: '#FFF', fontSize: 13.5, fontWeight: 800, border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {isVerifying2FA ? <RefreshCw size={14} className="spin" /> : <ShieldCheck size={16} />}
                  {isVerifying2FA ? 'Verifying...' : 'Verify & Sign In →'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setStep2FA('NONE')}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 11.5, cursor: 'pointer', fontWeight: 600 }}
                  >
                    ← Back to Password
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep2FA('RECOVERY_CODE'); setOtpLoginError(null); setRecoveryCodeInput(''); }}
                    style={{ background: 'none', border: 'none', color: '#06B6D4', fontSize: 11.5, cursor: 'pointer', fontWeight: 700 }}
                  >
                    Use a recovery code
                  </button>
                </div>
              </form>
            ) : step2FA === 'RECOVERY_CODE' ? (
              <form onSubmit={handleVerifyRecoveryCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 10, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Key size={26} style={{ color: '#14B8A6', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FFF' }}>Use 2FA Recovery Code</div>
                    <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>Enter one of your 8-character unused recovery codes.</div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Recovery Code (e.g. 8F92-K102)</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={recoveryCodeInput}
                    onChange={e => setRecoveryCodeInput(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX"
                    style={{ width: '100%', height: 44, textAlign: 'center', fontSize: 16, fontWeight: 800, letterSpacing: '0.15em', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(20,184,166,0.5)', borderRadius: 10, color: '#FFF', fontFamily: 'monospace' }}
                  />
                </div>

                {otpLoginError && (
                  <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
                    {otpLoginError}
                  </div>
                )}

                <button
                  type="submit"
                  style={{ width: '100%', height: 44, background: '#0D9488', color: '#FFF', fontSize: 13.5, fontWeight: 800, border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Key size={16} /> Verify Recovery Code & Sign In →
                </button>

                <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => { setStep2FA('TOTP'); setOtpLoginError(null); }}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 11.5, cursor: 'pointer', fontWeight: 600 }}
                  >
                    ← Back to Authenticator App Code
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Staff Role */}
                {activeCategory === 'FG_STAFF' && (
                  <div>
                    <label style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Select Staff Role</label>
                    <select
                      value={staffRole}
                      onChange={e => {
                        setStaffRole(e.target.value as any);
                        setRoleValidationError(null);
                      }}
                      style={{
                        ...inputStyle(false),
                        padding: '0 14px',
                        cursor: 'pointer',
                        color: staffRole ? '#F8FAFC' : '#94A3B8',
                        borderColor: roleValidationError ? '#EF4444' : 'rgba(255, 255, 255, 0.12)'
                      }}
                    >
                      <option value="" disabled style={{ background: '#0F172A', color: '#94A3B8' }}>Select Staff Role</option>
                      <option value="ADMIN" style={{ background: '#0F172A', color: '#F8FAFC' }}>Admin</option>
                      <option value="COMPLIANCE_OFFICER" style={{ background: '#0F172A', color: '#F8FAFC' }}>Compliance Officer</option>
                    </select>
                    {roleValidationError && (
                      <div style={{ color: '#FCA5A5', fontSize: 11.5, fontWeight: 700, marginTop: 4 }}>
                        {roleValidationError}
                      </div>
                    )}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Corporate Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: emailFocused ? '#3B82F6' : '#374151', transition: 'color 0.2s', pointerEvents: 'none' }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)}
                      required placeholder="name@company.com" style={inputStyle(emailFocused)} />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Password</label>
                    <button type="button" onClick={() => alert('Password reset link has been dispatched to your corporate email.')}
                      style={{ background: 'none', border: 'none', color: '#06B6D4', fontSize: 11, cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                      Forgot Password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: passwordFocused ? '#3B82F6' : '#374151', transition: 'color 0.2s', pointerEvents: 'none' }} />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)} onBlur={() => setPasswordFocused(false)}
                      required placeholder="••••••••••••" style={{ ...inputStyle(passwordFocused), paddingRight: 40 }} />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.01, boxShadow: '0 0 28px rgba(59,130,246,0.4)' }}
                  whileTap={{ scale: 0.99 }}
                  style={{ width: '100%', height: 44, background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg,#3B82F6 0%,#06B6D4 100%)', color: '#fff', fontSize: 13.5, fontWeight: 700, border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2, boxShadow: '0 0 20px rgba(59,130,246,0.25)', letterSpacing: '-0.01em' }}>
                  {loading ? 'Authenticating…' : <> Sign In to Workspace <ArrowRight size={14} /></>}
                </motion.button>

                {/* SSO Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                  <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                </div>

                {/* SSO Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[{ label: 'Continue with Microsoft', icon: '⊞' }, { label: 'Continue with Google Workspace', icon: 'G' }].map((sso, i) => (
                    <button key={i} type="button" onClick={handleLoginSubmit}
                      style={{ width: '100%', height: 44, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, color: '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.18)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'; }}>
                      <span style={{ fontSize: 15, lineHeight: 1 }}>{sso.icon}</span>{sso.label}
                    </button>
                  ))}
                </div>

                {/* Registration CTA Section BELOW Sign In & SSO Options */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 14, paddingTop: 14, textAlign: 'center' }}>
                  {activeCategory === 'MANUFACTURER_COMPANY' ? (
                    <>
                      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginBottom: 4 }}>
                        New Manufacturer?
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('mfg-register')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#14B8A6',
                          fontSize: 13.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '4px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'color 0.2s',
                          borderRadius: 6
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#2DD4BF')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#14B8A6')}
                      >
                        Register your Manufacturing Company →
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginBottom: 4 }}>
                        New to FactoryGrid?
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('buyer-register')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#3B82F6',
                          fontSize: 13.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '4px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'color 0.2s',
                          borderRadius: 6
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#60A5FA')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#3B82F6')}
                      >
                        Create a new Buyer Account →
                      </button>
                    </>
                  )}
                </div>

                {/* Secondary Actions */}
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 16, fontSize: 11.5 }}>
                  <button type="button" onClick={() => setIsAccessModalOpen(true)}
                    style={{ background: 'none', border: 'none', color: '#06B6D4', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                    Request Demo
                  </button>
                  <span style={{ color: '#334155' }}>|</span>
                  <button type="button" onClick={() => setIsAccessModalOpen(true)}
                    style={{ background: 'none', border: 'none', color: '#06B6D4', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                    Contact Sales
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>

      <EnterpriseAccessRequestModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        defaultType={activeCategory === 'MANUFACTURER_COMPANY' ? 'MANUFACTURER' : 'BUYER'}
      />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};


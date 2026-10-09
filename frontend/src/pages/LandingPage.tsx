import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ShieldCheck, FileText, CheckCircle2, Factory,
  Building2, Truck, Receipt, Layers, RefreshCw, Clock,
  BarChart3, Globe, Zap, Bot, Lock, Star, MapPin, ChevronRight,
  ChevronDown, Check, Package, Users, TrendingUp, Award
} from 'lucide-react';
import { EnterpriseAccessRequestModal } from '../components/common/EnterpriseAccessRequestModal';
import { ContactSalesModal } from '../components/common/ContactSalesModal';
import { useApp } from '../context/AppContext';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

/* ─────────────────────────────────────────────────────────
   ANIMATED FULL-PAGE BLUEPRINT CANVAS — 3D PARTICLES & GLOWS
   • 120 3D drifting micro-particles with twinkling halos
   • Volumetric ambient lighting orbs (teal, cyan, blue, violet)
   • Blueprint engineering grid with glowing intersection nodes
   • Vignette depth mask
───────────────────────────────────────────────────────── */
function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const t         = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    type Particle3D = { x: number; y: number; vx: number; vy: number; r: number; a: number; maxA: number; phase: number };
    const NUM_PARTICLES = 120;
    const particles: Particle3D[] = Array.from({ length: NUM_PARTICLES }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      vx:    (Math.random() - 0.5) * 0.16,
      vy:    (Math.random() - 0.5) * 0.16,
      r:     Math.random() * 1.5 + 0.4,
      a:     0,
      maxA:  Math.random() * 0.55 + 0.12,
      phase: Math.random() * Math.PI * 2,
    }));

    type GlowOrb = { ax: number; ay: number; r: number; cr: number; cg: number; cb: number; speed: number; phase: number };
    const orbs: GlowOrb[] = [
      { ax: 0.15, ay: 0.10, r: 0.55, cr: 16,  cg: 185, cb: 129, speed: 0.00018, phase: 0 },
      { ax: 0.85, ay: 0.25, r: 0.50, cr: 58,  cg: 184, cb: 255, speed: 0.00014, phase: 1.8 },
      { ax: 0.50, ay: 0.72, r: 0.48, cr: 16,  cg: 185, cb: 129, speed: 0.00012, phase: 3.6 },
      { ax: 0.20, ay: 0.65, r: 0.40, cr: 58,  cg: 184, cb: 255, speed: 0.00022, phase: 0.9 },
      { ax: 0.75, ay: 0.80, r: 0.42, cr: 110, cg: 100, cb: 240, speed: 0.00016, phase: 5.0 },
    ];

    const draw = () => {
      t.current += 1;
      const T = t.current;

      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = '#07111D';
      ctx.fillRect(0, 0, W, H);

      // Fine Standard 14px Blueprint Sub-Grid (Ultra-Light)
      const GS = 14;
      const cols = Math.ceil(W / GS) + 1;
      const rows = Math.ceil(H / GS) + 1;
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= cols; c++) {
        const x = c * GS;
        const opacity = Math.max(0.008, 0.018 * (1 - (x / W) * 0.35));
        ctx.strokeStyle = `rgba(34, 216, 255, ${opacity.toFixed(4)})`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        const y = r * GS;
        ctx.strokeStyle = 'rgba(34, 216, 255, 0.012)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Major Blueprint Grid Line Every 56px (4 * 14px)
      const MAJOR_GS = 56;
      const mainCols = Math.ceil(W / MAJOR_GS) + 1;
      const mainRows = Math.ceil(H / MAJOR_GS) + 1;
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(24, 213, 165, 0.025)';
      for (let c = 0; c <= mainCols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * MAJOR_GS, 0);
        ctx.lineTo(c * MAJOR_GS, H);
        ctx.stroke();
      }
      for (let r = 0; r <= mainRows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * MAJOR_GS);
        ctx.lineTo(W, r * MAJOR_GS);
        ctx.stroke();
      }

      // Tiny Intersection Dots
      for (let c = 0; c <= mainCols; c++) {
        for (let r = 0; r <= mainRows; r++) {
          const px = c * MAJOR_GS;
          const py = r * MAJOR_GS;
          ctx.beginPath();
          ctx.arc(px, py, 0.8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(24, 213, 165, 0.18)';
          ctx.fill();
        }
      }

      // Volumetric Ambient Glow Orbs
      orbs.forEach(b => {
        const cx = (b.ax + Math.sin(T * b.speed + b.phase) * 0.08) * W;
        const cy = (b.ay + Math.cos(T * b.speed * 0.8 + b.phase) * 0.08) * H;
        const rad = Math.min(W, H) * b.r;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grad.addColorStop(0, `rgba(${b.cr},${b.cg},${b.cb},0.12)`);
        grad.addColorStop(0.5, `rgba(${b.cr},${b.cg},${b.cb},0.035)`);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });

      // 3D Moving Floating Particles
      particles.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = W;
        if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H;
        if (s.y > H) s.y = 0;

        s.a = (Math.sin(T * 0.02 + s.phase) * 0.5 + 0.5) * s.maxA;

        const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
        halo.addColorStop(0, `rgba(24,213,165,${(s.a * 0.5).toFixed(3)})`);
        halo.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,255,245,${(s.a * 1.1).toFixed(3)})`;
        ctx.fill();
      });

      // Vignette Mask
      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.9);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(7,17,29,0.55)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 1: HERO — ISOMETRIC PROCUREMENT UNIVERSE
   Mouse parallax + floating 3D nodes + animated paths
───────────────────────────────────────────────────────── */
function HeroIsometricIllustration() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveIdx(p => (p + 1) % 7), 2800);
    return () => clearInterval(t);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 24;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 16;
    setMouse({ x, y });
  }, []);

  const nodes = [
    { label: 'Buyer Office',     sub: 'Procurement Desk',   icon: Building2,   c: '#18D5A5', x: '6%',  y: '10%' },
    { label: 'FactoryGrid',      sub: 'Smart Platform',      icon: Zap,         c: '#3AB8FF', x: '42%', y: '5%'  },
    { label: 'Manufacturers',    sub: '450+ WHO-GMP Units',  icon: Factory,     c: '#18D5A5', x: '78%', y: '22%' },
    { label: 'Compliance Hub',   sub: 'CDSCO Verified',      icon: ShieldCheck, c: '#FBBF24', x: '72%', y: '62%' },
    { label: 'Warehouse',        sub: 'Cold Storage Vault',  icon: Package,     c: '#3AB8FF', x: '38%', y: '76%' },
    { label: 'Logistics',        sub: '2°C–8°C Cold Fleet',  icon: Truck,       c: '#18D5A5', x: '8%',  y: '56%' },
    { label: 'Delivery',         sub: 'GRN Confirmation',    icon: CheckCircle2,c: '#A78BFA', x: '60%', y: '88%' },
  ];

  return (
    <div
      ref={stageRef}
      onMouseMove={handleMouseMove}
      style={{ width: '100%', aspectRatio: '1 / 0.85', position: 'relative', cursor: 'crosshair' }}
    >
      <motion.div
        animate={{ rotateX: 10 + mouse.y * 0.3, rotateY: -8 + mouse.x * 0.3 }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        style={{
          width: '100%', height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* SVG Connection Paths */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
          viewBox="0 0 500 420"
          preserveAspectRatio="none"
        >
          {/* Static base paths */}
          {[
            ['30 50', '210 25'], ['210 25', '390 93'], ['390 93', '360 260'],
            ['360 260', '190 320'], ['190 320', '40 235'], ['40 235', '300 370'],
          ].map(([from, to], i) => (
            <line key={i}
              x1={from.split(' ')[0]} y1={from.split(' ')[1]}
              x2={to.split(' ')[0]}   y2={to.split(' ')[1]}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1.5"
            />
          ))}

          {/* Animated glowing paths */}
          <path d="M 30 50 Q 120 15 210 25 Q 300 35 390 93 Q 430 176 360 260 Q 275 344 190 320 Q 115 296 40 235"
            fill="none"
            stroke="rgba(24,213,165,0.18)"
            strokeWidth="2"
          />
          <path d="M 30 50 Q 120 15 210 25 Q 300 35 390 93 Q 430 176 360 260 Q 275 344 190 320 Q 115 296 40 235"
            fill="none"
            stroke="#18D5A5"
            strokeWidth="2"
            strokeDasharray="8 14"
            style={{ animation: 'dashMove 3s linear infinite' }}
          />
          <path d="M 210 25 L 390 93 L 360 260 L 300 370"
            fill="none"
            stroke="#3AB8FF"
            strokeWidth="1.5"
            strokeDasharray="6 18"
            style={{ animation: 'dashMove 4s linear infinite reverse' }}
          />
        </svg>

        {/* Floating Nodes */}
        {nodes.map((node, idx) => {
          const Icon = node.icon;
          const isActive = activeIdx === idx;
          return (
            <motion.div
              key={node.label}
              animate={{ y: isActive ? -8 : 0, scale: isActive ? 1.05 : 1 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
              style={{
                position: 'absolute',
                top: node.y, left: node.x,
                minWidth: 148,
                background: isActive ? 'rgba(11,25,41,0.98)' : 'rgba(11,25,41,0.82)',
                border: `1px solid ${isActive ? node.c + '60' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 14,
                padding: '11px 15px',
                backdropFilter: 'blur(20px)',
                boxShadow: isActive ? `0 16px 40px rgba(0,0,0,0.7), 0 0 24px ${node.c}30` : '0 8px 24px rgba(0,0,0,0.5)',
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: `${node.c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} style={{ color: node.c }} />
                </div>
                <div style={{ flex: 1 }} />
                <span className="fg-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: node.c, display: 'inline-block' }} />
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{node.label}</div>
              <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 1 }}>{node.sub}</div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 2: WHAT IS FACTORYGRID — Isometric Flow
───────────────────────────────────────────────────────── */
function ProcurementFlow() {
  const stages = [
    { label: 'Buyer',            icon: Building2,    c: '#18D5A5' },
    { label: 'Creates RFQ',      icon: FileText,     c: '#3AB8FF' },
    { label: 'FactoryGrid',      icon: Zap,          c: '#18D5A5' },
    { label: 'Manufacturers',    icon: Factory,      c: '#3AB8FF' },
    { label: 'Receive Quotes',   icon: Receipt,      c: '#FBBF24' },
    { label: 'Compare',          icon: BarChart3,    c: '#18D5A5' },
    { label: 'Place Order',      icon: CheckCircle2, c: '#3AB8FF' },
    { label: 'Manufacturing',    icon: RefreshCw,    c: '#18D5A5' },
    { label: 'Dispatch',         icon: Truck,        c: '#3AB8FF' },
    { label: 'Delivery',         icon: Package,      c: '#18D5A5' },
  ];

  return (
    <div style={{ position: 'relative', padding: '8px 0 24px' }}>
      {/* Horizontal flow SVG */}
      <svg style={{ position: 'absolute', top: 32, left: 0, width: '100%', height: 2, overflow: 'visible' }}>
        <line x1="5%" y1="1" x2="95%" y2="1" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
        <line x1="5%" y1="1" x2="95%" y2="1" stroke="#18D5A5" strokeWidth="2"
          strokeDasharray="6 14"
          style={{ animation: 'dashMove 4s linear infinite' }}
        />
      </svg>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8, position: 'relative' }}>
        {stages.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
            >
              <div style={{
                width: 56, height: 56,
                borderRadius: '50%',
                background: `${s.c}14`,
                border: `1.5px solid ${s.c}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 20px ${s.c}20`,
                position: 'relative', zIndex: 1,
              }}>
                <Icon size={20} style={{ color: s.c }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', lineHeight: 1.3, maxWidth: 70 }}>{s.label}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 3: WHY FACTORYGRID — 3 Premium Visual Blocks
───────────────────────────────────────────────────────── */
function WhyBlock({ title, sub, desc, visual, c }: any) {
  return (
    <motion.div
      className="fg-glass"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35 }}
      style={{ padding: 40, height: '100%' }}
    >
      {/* Unique visual top */}
      <div style={{
        height: 180,
        borderRadius: 14,
        marginBottom: 28,
        background: `linear-gradient(135deg, ${c}12, ${c}05)`,
        border: `1px solid ${c}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {visual}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at bottom, rgba(7,17,29,0.4), transparent)' }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c, marginBottom: 10 }}>
        {sub}
      </div>
      <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em' }}>{title}</h3>
      <p className="fg-body">{desc}</p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 5: SMART RFQ ENGINE — Center AI visualization
───────────────────────────────────────────────────────── */
function RFQEngineViz() {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => (p + 1) % 3), 1400);
    return () => clearInterval(t);
  }, []);

  const manufacturers = [
    { name: 'SunBio LifeSciences',     price: '₹0.85/tab', tag: 'Best Match',  c: '#18D5A5', best: true },
    { name: 'Cipla Partner Labs',      price: '₹0.89/tab', tag: 'WHO-GMP',     c: '#3AB8FF', best: false },
    { name: 'Torrent Partner Plant',   price: '₹0.92/tab', tag: 'ISO 9001',    c: '#94A3B8', best: false },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', gap: 24, alignItems: 'center' }}>
      {/* Left: RFQ */}
      <div className="fg-glass" style={{ padding: 28 }}>
        <div className="fg-pill" style={{ marginBottom: 14, fontSize: 10 }}>Buyer RFQ</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Paracetamol IP 500mg</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { l: 'Qty',       v: '500,000 tabs' },
            { l: 'Standard', v: 'IP / USP' },
            { l: 'License',  v: 'Form 20B' },
            { l: 'Delivery', v: '2°C–8°C' },
          ].map(r => (
            <div key={r.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>{r.l}</div>
              <div style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{r.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Center: AI Engine */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px rgba(24,213,165,0.3)',
              '0 0 45px rgba(24,213,165,0.65)',
              '0 0 20px rgba(24,213,165,0.3)',
            ]
          }}
          transition={{ duration: 2.8, repeat: Infinity }}
          style={{
            width: 110, height: 110,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0d2d2a, #0e2134)',
            border: '2px solid rgba(24,213,165,0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <Bot size={26} style={{ color: '#18D5A5' }} />
          <div style={{ fontSize: 9, fontWeight: 800, color: '#18D5A5', letterSpacing: '0.1em' }}>AI ENGINE</div>
        </motion.div>
        {/* Animated arrows */}
        {[0,1,2].map(i => (
          <motion.div
            key={i}
            animate={{ opacity: pulse === i ? 1 : 0.2, x: pulse === i ? 6 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ color: '#18D5A5', fontSize: 18, lineHeight: 1 }}
          >
            →
          </motion.div>
        ))}
      </div>

      {/* Right: Manufacturers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {manufacturers.map((m, i) => (
          <motion.div
            key={m.name}
            animate={{ borderColor: m.best ? '#18D5A5' : 'rgba(255,255,255,0.07)' }}
            className="fg-glass"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: m.best ? '0 0 0 1px rgba(24,213,165,0.2), 0 8px 32px rgba(0,0,0,0.5)' : undefined,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{m.name}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{m.price}</div>
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 999,
              background: `${m.c}15`,
              color: m.c,
              border: `1px solid ${m.c}30`,
            }}>
              {m.tag}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 8: COMPLIANCE ORBIT
───────────────────────────────────────────────────────── */
function ComplianceOrbit() {
  const certs = [
    { label: 'WHO-GMP',    desc: 'Form 28D',   c: '#18D5A5', angle: 0 },
    { label: 'ISO 9001',   desc: 'QMS Cert',   c: '#3AB8FF', angle: 60 },
    { label: 'US-FDA',     desc: 'Export Lic', c: '#FBBF24', angle: 120 },
    { label: 'CDSCO',      desc: 'DL 20B/21B', c: '#A78BFA', angle: 180 },
    { label: 'Drug Lic',   desc: 'Central',    c: '#18D5A5', angle: 240 },
    { label: 'GSTIN',      desc: 'GST Audit',  c: '#3AB8FF', angle: 300 },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 60, flexWrap: 'wrap' }}>
      {/* Orbit visual */}
      <div style={{ position: 'relative', width: 380, height: 380, flexShrink: 0, margin: '0 auto' }}>
        {/* Orbit rings */}
        {[165, 125].map(r => (
          <div key={r} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: r * 2, height: r * 2,
            marginLeft: -r, marginTop: -r,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.06)',
          }} />
        ))}

        {/* Center Hub */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: '50%', left: '50%', width: 4, height: 4, marginLeft: -2, marginTop: -2 }}
        />
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 100, height: 100,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(24,213,165,0.15), rgba(58,184,255,0.08))',
          border: '1.5px solid rgba(24,213,165,0.35)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(24,213,165,0.25)',
        }}>
          <ShieldCheck size={22} style={{ color: '#18D5A5' }} />
          <div style={{ fontSize: 9, fontWeight: 700, color: '#18D5A5', marginTop: 4 }}>VERIFIED</div>
        </div>

        {/* Orbiting badges */}
        {certs.map((cert, idx) => {
          const radians = (cert.angle * Math.PI) / 180;
          const r = idx % 2 === 0 ? 165 : 125;
          const x = Math.cos(radians) * r;
          const y = Math.sin(radians) * r;
          return (
            <motion.div
              key={cert.label}
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: idx % 2 === 0 ? 30 : 22,
                repeat: Infinity,
                ease: 'linear',
                direction: idx % 2 === 0 ? 'normal' : 'reverse',
              }}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: 0, height: 0,
                transformOrigin: '0 0',
              }}
            >
              <motion.div
                animate={{ rotate: [0, -360] }}
                transition={{
                  duration: idx % 2 === 0 ? 30 : 22,
                  repeat: Infinity,
                  ease: 'linear',
                  direction: idx % 2 === 0 ? 'normal' : 'reverse',
                }}
                style={{
                  position: 'absolute',
                  left: x - 36, top: y - 36,
                  width: 72, height: 72,
                  borderRadius: '50%',
                  background: 'rgba(11,25,41,0.95)',
                  border: `1px solid ${cert.c}35`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, textAlign: 'center',
                  backdropFilter: 'blur(12px)',
                  cursor: 'default',
                }}
              >
                <div style={{ color: cert.c, fontSize: 10, fontWeight: 800 }}>{cert.label}</div>
                <div style={{ color: '#64748B', fontSize: 8, marginTop: 2 }}>{cert.desc}</div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Right copy */}
      <div style={{ flex: 1, minWidth: 260 }}>
        <div className="fg-pill" style={{ marginBottom: 16 }}>Regulatory Compliance</div>
        <h3 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 14, letterSpacing: '-0.025em' }}>
          Every manufacturer pre-screened against 12-point regulatory audit
        </h3>
        <p className="fg-body" style={{ marginBottom: 20 }}>
          FactoryGrid verifies each manufacturing partner against CDSCO Drug License Form 20B/21B, WHO-GMP certifications, ISO 9001:2015, and GSTIN compliance before onboarding.
        </p>
        {[
          'Drug License Form 20B & 21B verified',
          'WHO-GMP physical facility audit',
          'HPLC & CoA quality clearance',
          'GSTIN and tax compliance check',
        ].map(item => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(24,213,165,0.12)', border: '1px solid rgba(24,213,165,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={10} style={{ color: '#18D5A5' }} />
            </div>
            <span style={{ fontSize: 14, color: '#94A3B8' }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 7: INDIA MAP — Hover tooltips
───────────────────────────────────────────────────────── */
const HUB_DATA = [
  { city: 'Hyderabad',  state: 'Telangana',      units: 120, cap: '45M Tabs/mo', lead: '7 Days',  cert: 'WHO-GMP & US-FDA',   cat: 'APIs, Formulations',      cx: 270, cy: 290 },
  { city: 'Ahmedabad',  state: 'Gujarat',         units: 95,  cap: '38M Tabs/mo', lead: '10 Days', cert: 'WHO-GMP',             cat: 'Injectables, Syrups',     cx: 175, cy: 245 },
  { city: 'Mumbai',     state: 'Maharashtra',     units: 80,  cap: '30M Tabs/mo', lead: '6 Days',  cert: 'EU-GMP',              cat: 'Oral Solids, Softgels',   cx: 185, cy: 295 },
  { city: 'Goa',        state: 'Goa',             units: 45,  cap: '18M Tabs/mo', lead: '5 Days',  cert: 'WHO-GMP',             cat: 'Export Formulations',     cx: 200, cy: 330 },
  { city: 'Baddi',      state: 'Himachal Pradesh',units: 110, cap: '50M Tabs/mo', lead: '8 Days',  cert: 'CDSCO',               cat: 'Tablets, Capsules',       cx: 210, cy: 140 },
  { city: 'Pune',       state: 'Maharashtra',     units: 60,  cap: '25M Doses/mo',lead: '5 Days',  cert: 'ISO 9001',            cat: 'Biologics, Vaccines',     cx: 210, cy: 305 },
];

function IndiaMapSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
      {/* SVG India Map Silhouette */}
      <div style={{ position: 'relative' }}>
        <svg viewBox="0 0 480 540" style={{ width: '100%', maxWidth: 460 }}>
          {/* India outline simplified */}
          <path
            d="M200 60 L235 50 L265 58 L295 75 L310 105 L320 145 L330 185 L325 220 L340 255 L355 290 L360 330 L345 365 L320 390 L295 410 L275 430 L255 450 L245 470 L235 460 L225 440 L205 420 L185 400 L168 375 L155 345 L145 310 L140 270 L145 235 L150 200 L145 165 L148 130 L160 100 L175 78 Z"
            fill="rgba(15,32,48,0.8)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1.5"
          />
          {/* Connection lines between hubs */}
          {HUB_DATA.map((hub, i) =>
            HUB_DATA.slice(i + 1).map((hub2, j) => {
              const dist = Math.hypot(hub.cx - hub2.cx, hub.cy - hub2.cy);
              if (dist > 180) return null;
              return (
                <line key={`${i}-${j}`}
                  x1={hub.cx} y1={hub.cy}
                  x2={hub2.cx} y2={hub2.cy}
                  stroke="rgba(24,213,165,0.12)"
                  strokeWidth="1"
                  strokeDasharray="4 8"
                  style={{ animation: 'dashMove 5s linear infinite' }}
                />
              );
            })
          )}
          {/* Hub dots */}
          {HUB_DATA.map((hub, idx) => (
            <g key={hub.city} onMouseEnter={() => setHovered(idx)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
              {/* Outer pulse ring */}
              <circle cx={hub.cx} cy={hub.cy} r={hovered === idx ? 18 : 12}
                fill={`rgba(24,213,165,${hovered === idx ? 0.15 : 0.07})`}
                stroke={hovered === idx ? '#18D5A5' : 'rgba(24,213,165,0.3)'}
                strokeWidth="1"
                style={{ transition: 'all 0.3s ease' }}
              />
              <circle cx={hub.cx} cy={hub.cy} r={5}
                fill={hovered === idx ? '#18D5A5' : 'rgba(24,213,165,0.6)'}
                style={{ transition: 'all 0.3s ease' }}
              />
              {/* City label */}
              <text x={hub.cx + 14} y={hub.cy + 4}
                fontSize="10" fill={hovered === idx ? '#fff' : '#94A3B8'}
                fontFamily="Inter, system-ui" fontWeight={hovered === idx ? '700' : '500'}
                style={{ transition: 'all 0.2s', userSelect: 'none' }}
              >
                {hub.city}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Hub detail panel */}
      <div>
        <AnimatePresence mode="wait">
          {hovered !== null ? (
            <motion.div
              key={hovered}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="fg-glass fg-glass-glow"
              style={{ padding: 28 }}
            >
              <div className="fg-pill" style={{ marginBottom: 14 }}>Manufacturing Hub</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', marginBottom: 4 }}>
                {HUB_DATA[hovered].city}
              </div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>{HUB_DATA[hovered].state}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { l: 'Registered Plants', v: `${HUB_DATA[hovered].units} Units` },
                  { l: 'Monthly Capacity',  v: HUB_DATA[hovered].cap },
                  { l: 'Delivery Schedule SLA', v: HUB_DATA[hovered].lead },
                  { l: 'Product Category',  v: HUB_DATA[hovered].cat },
                ].map(r => (
                  <div key={r.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginBottom: 3 }}>{r.l}</div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{r.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {HUB_DATA[hovered].cert.split(', ').concat(['Drug Lic']).map(c => (
                  <span key={c} className="chip chip-green" style={{ fontSize: 10 }}>{c}</span>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: '40px 0' }}
            >
              <div style={{ fontSize: 15, color: '#94A3B8', marginBottom: 28 }}>
                Hover over any city to see manufacturing capacity, certifications and delivery schedules.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: '450+', sub: 'Verified Plants' },
                  { label: '6',    sub: 'Major Hubs' },
                  { label: 'WHO',  sub: 'GMP Certified' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 10px' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#18D5A5', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 6: QUOTE COMPARISON PANEL
───────────────────────────────────────────────────────── */
const COMPARISON_DATA = [
  { mfg: 'SunBio LifeSciences',   price: '₹0.85/tab', moq: '5,00,000',  lead: '7 Days',  gmp: true,  iso: true,  fda: false, delivery: '2–8°C Vault', best: true  },
  { mfg: 'Cipla Partner Labs',    price: '₹0.89/tab', moq: '2,50,000',  lead: '10 Days', gmp: true,  iso: true,  fda: true,  delivery: 'Cold Chain',  best: false },
  { mfg: 'Torrent Partner Plant', price: '₹0.92/tab', moq: '1,00,000',  lead: '12 Days', gmp: true,  iso: false, fda: false, delivery: 'Standard',    best: false },
];

function QuoteComparisonPanel() {
  const headers = ['Manufacturer', 'Ex-Factory Price', 'MOQ', 'Delivery Schedule', 'WHO-GMP', 'ISO', 'FDA', 'Delivery', ''];

  return (
    <div className="fg-glass" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Live Quote Comparison</div>
        <div className="chip chip-green" style={{ fontSize: 10 }}>Auto-ranked by value</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_DATA.map((row, i) => (
            <motion.tr
              key={row.mfg}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: row.best ? 'rgba(24,213,165,0.05)' : undefined,
                borderLeft: row.best ? '3px solid #18D5A5' : '3px solid transparent',
              }}
            >
              <td style={{ padding: '16px 20px', color: row.best ? '#18D5A5' : '#fff', fontWeight: row.best ? 700 : 500 }}>{row.mfg}</td>
              <td style={{ padding: '16px 20px', color: '#fff', fontWeight: 700 }}>{row.price}</td>
              <td style={{ padding: '16px 20px', color: '#94A3B8' }}>{row.moq}</td>
              <td style={{ padding: '16px 20px', color: '#94A3B8' }}>{row.lead}</td>
              <td style={{ padding: '16px 20px' }}>{row.gmp ? <Check size={14} style={{ color: '#18D5A5' }} /> : <span style={{ color: '#64748B', fontSize: 18 }}>–</span>}</td>
              <td style={{ padding: '16px 20px' }}>{row.iso ? <Check size={14} style={{ color: '#18D5A5' }} /> : <span style={{ color: '#64748B', fontSize: 18 }}>–</span>}</td>
              <td style={{ padding: '16px 20px' }}>{row.fda ? <Check size={14} style={{ color: '#18D5A5' }} /> : <span style={{ color: '#64748B', fontSize: 18 }}>–</span>}</td>
              <td style={{ padding: '16px 20px', color: '#94A3B8' }}>{row.delivery}</td>
              <td style={{ padding: '16px 20px' }}>
                {row.best ? (
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#18D5A5', background: 'rgba(24,213,165,0.12)', border: '1px solid rgba(24,213,165,0.25)', padding: '4px 10px', borderRadius: 999 }}>
                    ★ Optimal
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: '#64748B' }}>Qualified</span>
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 4: INTERACTIVE TIMELINE
───────────────────────────────────────────────────────── */
const TIMELINE_STAGES = [
  { label: 'Create RFQ',       icon: FileText,     detail: 'Buyer creates multi-line RFQ with exact pharmacopeial specifications, target MOQ, and delivery SLA.' },
  { label: 'Mfg Matching',     icon: Bot,          detail: 'AI engine instantly distributes RFQ to 450+ pre-qualified WHO-GMP manufacturing units.' },
  { label: 'Quotations',       icon: Receipt,      detail: 'Sealed quotations arrive from matched manufacturers within 24–48 hours.' },
  { label: 'Compare',          icon: BarChart3,    detail: 'Side-by-side comparison matrix evaluates price, MOQ, delivery schedule, and certifications.' },
  { label: 'Approve',          icon: CheckCircle2, detail: 'Procurement executive approves optimal supplier and issues Master Purchase Order.' },
  { label: 'Production',       icon: RefreshCw,    detail: 'Live batch tracking: granulation, tableting, enteric coating, HPLC assay and CoA.' },
  { label: 'Dispatch',         icon: Truck,        detail: 'Cold-chain AWB issued with real-time temperature logs from 2°C–8°C fleet.' },
  { label: 'Delivery',         icon: Package,      detail: 'Digital Goods Received Note (GRN) signed and GST invoice auto-generated.' },
];

function ProcurementTimeline() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % TIMELINE_STAGES.length), 3000);
    return () => clearInterval(t);
  }, []);

  const progressPct = ((active + 1) / TIMELINE_STAGES.length) * 100;

  return (
    <div>
      {/* Step selector */}
      <div style={{ position: 'relative', display: 'flex', gap: 0, marginBottom: 40 }}>
        {/* Progress line */}
        <div style={{ position: 'absolute', top: 20, left: '3%', right: '3%', height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
          <motion.div
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #18D5A5, #3AB8FF)', borderRadius: 2, boxShadow: '0 0 12px rgba(24,213,165,0.5)' }}
          />
        </div>

        {TIMELINE_STAGES.map((s, idx) => {
          const Icon = s.icon;
          const done = idx < active;
          const isAct = idx === active;
          return (
            <div
              key={s.label}
              onClick={() => setActive(idx)}
              style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}
            >
              <motion.div
                animate={{
                  background: isAct ? 'rgba(24,213,165,0.15)' : done ? '#18D5A5' : 'rgba(255,255,255,0.04)',
                  borderColor: (isAct || done) ? '#18D5A5' : 'rgba(255,255,255,0.12)',
                  scale: isAct ? 1.15 : 1,
                }}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px',
                  position: 'relative', zIndex: 1,
                  cursor: 'pointer',
                  boxShadow: isAct ? '0 0 0 5px rgba(24,213,165,0.12), 0 0 20px rgba(24,213,165,0.3)' : undefined,
                }}
              >
                {done ? (
                  <Check size={14} style={{ color: '#07111D' }} />
                ) : (
                  <Icon size={14} style={{ color: isAct ? '#18D5A5' : '#64748B' }} />
                )}
              </motion.div>
              <div style={{ fontSize: 10.5, fontWeight: isAct ? 700 : 500, color: isAct ? '#fff' : '#64748B', lineHeight: 1.3 }}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="fg-glass fg-glass-glow"
          style={{ padding: 28, display: 'flex', gap: 20, alignItems: 'flex-start' }}
        >
          {(() => {
            const Icon = TIMELINE_STAGES[active].icon;
            return (
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(24,213,165,0.12)', border: '1px solid rgba(24,213,165,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} style={{ color: '#18D5A5' }} />
              </div>
            );
          })()}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#18D5A5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Stage {String(active + 1).padStart(2, '0')} / {TIMELINE_STAGES.length}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{TIMELINE_STAGES[active].label}</div>
            <p className="fg-body">{TIMELINE_STAGES[active].detail}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PLATFORM NAVIGATION SECTIONS METADATA
───────────────────────────────────────────────────────── */
const PLATFORM_SECTIONS = [
  {
    id: 'what-is-factorygrid',
    title: 'What is FactoryGrid?',
    description: 'One platform, entire procurement journey',
    icon: RefreshCw,
    color: '#18D5A5',
  },
  {
    id: 'why-factorygrid',
    title: 'Why FactoryGrid?',
    description: 'Built for pharmaceutical procurement',
    icon: Zap,
    color: '#3AB8FF',
  },
  {
    id: 'how-it-works',
    title: 'How It Works',
    description: 'From RFQ to delivery in 14 days',
    icon: Clock,
    color: '#F59E0B',
  },
  {
    id: 'ai-matching',
    title: 'AI Matching Engine',
    description: 'Smart RFQ Engine & parameter matching',
    icon: Bot,
    color: '#18D5A5',
  },
  {
    id: 'quote-comparison',
    title: 'Quote Comparison',
    description: 'Side-by-side commercial evaluation',
    icon: BarChart3,
    color: '#3AB8FF',
  },
  {
    id: 'manufacturer-network',
    title: 'Verified Manufacturer Network',
    description: '450+ verified units across India',
    icon: Globe,
    color: '#10B981',
  },
  {
    id: 'compliance-quality',
    title: 'Compliance & Quality',
    description: 'Regulatory assurance built in',
    icon: Lock,
    color: '#8B5CF6',
  },
  {
    id: 'testimonials',
    title: 'Testimonials',
    description: 'Trusted by procurement leaders',
    icon: Star,
    color: '#FBBF24',
  },
  {
    id: 'get-started',
    title: 'Ready To Modernize / Get Started',
    description: 'Start digital pharmaceutical procurement',
    icon: ArrowRight,
    color: '#18D5A5',
  },
];

/* ─────────────────────────────────────────────────────────
   MAIN LANDING PAGE
───────────────────────────────────────────────────────── */
export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { setCurrentRole, setActiveTab, isAuthenticated } = useApp();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isContactSalesModalOpen, setIsContactSalesModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPlatformMenuOpen, setIsPlatformMenuOpen] = useState(false);
  const platformMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (platformMenuRef.current && !platformMenuRef.current.contains(e.target as Node)) {
        setIsPlatformMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPlatformMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const scrollToSection = (id: string) => {
    setIsPlatformMenuOpen(false);
    setIsMobileMenuOpen(false);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNavClick = (item: string) => {
    setIsMobileMenuOpen(false);
    if (item === 'Platform') {
      setIsPlatformMenuOpen(prev => !prev);
    } else if (item === 'Manufacturers') {
      if (isAuthenticated) {
        setCurrentRole('BUYER');
        setActiveTab('manufacturers');
        onNavigate('dashboard', 'BUYER');
      } else {
        onNavigate('mfg-register');
      }
    } else if (item === 'Compliance') {
      if (isAuthenticated) {
        setCurrentRole('COMPLIANCE_OFFICER');
        setActiveTab('compliance');
        onNavigate('dashboard', 'COMPLIANCE_OFFICER');
      } else {
        onNavigate('login');
      }
    } else if (item === 'Pricing') {
      setIsContactSalesModalOpen(true);
    }
  };

  const handleStartSourcing = () => {
    setIsMobileMenuOpen(false);
    if (isAuthenticated) {
      setCurrentRole('BUYER');
      setActiveTab('rfqs');
      onNavigate('dashboard', 'BUYER');
    } else {
      onNavigate('buyer-register');
    }
  };

  const handleEnterPlatform = () => {
    setIsMobileMenuOpen(false);
    onNavigate('login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#07111D', color: '#fff', overflowX: 'hidden', position: 'relative' }}>

      {/* ── Animated Full-Page Blueprint Canvas & 3D Particles ── */}
      <BackgroundCanvas />

      {/* ─── NAVBAR ─────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(7,17,29,0.88)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <button
            onClick={() => onNavigate('landing')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div className="nav-logo-mark">FG</div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>FactoryGrid</span>
          </button>
          <nav className="fg-desktop-nav" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {/* Interactive Platform Dropdown / Mega-Menu */}
            <div
              ref={platformMenuRef}
              style={{ position: 'relative' }}
              onMouseEnter={() => setIsPlatformMenuOpen(true)}
              onMouseLeave={() => setIsPlatformMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsPlatformMenuOpen(prev => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: isPlatformMenuOpen ? 'rgba(34, 216, 255, 0.08)' : 'transparent',
                  border: isPlatformMenuOpen ? '1px solid rgba(34, 216, 255, 0.25)' : '1px solid transparent',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: isPlatformMenuOpen ? '#fff' : '#94A3B8',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  if (!isPlatformMenuOpen) {
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={e => {
                  if (!isPlatformMenuOpen) {
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
                aria-expanded={isPlatformMenuOpen}
                aria-haspopup="true"
                aria-label="Platform navigation menu"
              >
                <span>Platform</span>
                <ChevronDown
                  size={14}
                  style={{
                    color: isPlatformMenuOpen ? '#22D8FF' : '#94A3B8',
                    transform: isPlatformMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease, color 0.2s ease',
                  }}
                />
              </button>

              {/* Desktop Mega-Menu Dropdown */}
              <AnimatePresence>
                {isPlatformMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      width: 580,
                      background: 'rgba(9, 21, 37, 0.97)',
                      backdropFilter: 'blur(28px)',
                      border: '1px solid rgba(34, 216, 255, 0.18)',
                      borderRadius: 14,
                      boxShadow: '0 24px 50px -12px rgba(0, 0, 0, 0.75), 0 0 25px -4px rgba(34, 216, 255, 0.12)',
                      padding: 12,
                      zIndex: 150,
                    }}
                  >
                    {/* Subtle top indicator accent bar */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 24,
                      right: 24,
                      height: 1,
                      background: 'linear-gradient(90deg, transparent, rgba(34, 216, 255, 0.5), transparent)',
                    }} />

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 6,
                    }}>
                      {PLATFORM_SECTIONS.map((section) => {
                        const Icon = section.icon;
                        return (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => scrollToSection(section.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 12,
                              padding: '10px 12px',
                              borderRadius: 10,
                              background: 'transparent',
                              border: '1px solid transparent',
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              width: '100%',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(34, 216, 255, 0.07)';
                              e.currentTarget.style.borderColor = 'rgba(34, 216, 255, 0.22)';
                              e.currentTarget.style.transform = 'translateX(2px)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderColor = 'transparent';
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: `${section.color}15`,
                              border: `1px solid ${section.color}35`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: 1,
                            }}>
                              <Icon size={15} style={{ color: section.color }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: '#F1F5F9',
                                letterSpacing: '-0.01em',
                              }}>
                                {section.title}
                              </div>
                              <div style={{
                                fontSize: 11.5,
                                color: '#64748B',
                                marginTop: 2,
                                lineHeight: 1.35,
                                whiteSpace: 'normal',
                              }}>
                                {section.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>

        {/* Desktop Action Buttons */}
        <div className="fg-desktop-nav" style={{ display: 'flex', alignItems: 'center' }}>
          <button className="fg-btn-primary" style={{ padding: '10px 22px', fontSize: 14 }} onClick={handleEnterPlatform}>
            Enter Platform <ArrowRight size={15} />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="fg-mobile-hamburger"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 8, display: 'none' }}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* ── Mobile Slide-Out Drawer Menu ── */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'fixed', inset: 0, top: 64, zIndex: 99,
          background: 'rgba(7, 17, 29, 0.98)', backdropFilter: 'blur(24px)',
          padding: '20px 20px 32px', display: 'flex', flexDirection: 'column', gap: 16,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#3AB8FF',
              padding: '6px 0',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              Platform Navigation
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {PLATFORM_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      color: '#F8FAFC',
                      fontSize: 14,
                      fontWeight: 600,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: `${section.color}15`,
                      border: `1px solid ${section.color}35`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={14} style={{ color: section.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#F1F5F9' }}>{section.title}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{section.description}</div>
                    </div>
                    <ChevronRight size={14} style={{ color: '#475569', flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={() => { setIsMobileMenuOpen(false); handleEnterPlatform(); }} className="fg-btn-primary" style={{ width: '100%', height: 44, justifyContent: 'center' }}>
              Enter Workspace
            </button>
          </div>
        </div>
      )}

      {/* ─── SECTION 1: HERO ─────────────────────────────────────── */}
      <section style={{ padding: '168px 0 110px', position: 'relative', zIndex: 1 }}>
        <div className="fg-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            {/* Left */}
            <div>
              <div className="fg-pill" style={{ marginBottom: 24 }}>
                <ShieldCheck size={12} /> B2B Pharmaceutical Procurement
              </div>
              <h1 className="fg-hero-title" style={{ marginBottom: 22 }}>
                Connecting Pharmaceutical Buyers<br />
                <span className="fg-gradient-text">With Verified Manufacturers</span>
              </h1>
              <p className="fg-desc" style={{ marginBottom: 36, maxWidth: 480 }}>
                FactoryGrid is a smart B2B pharmaceutical procurement platform that helps buyers discover verified manufacturers, manage RFQs, compare quotations and track complete order fulfillment from one place.
              </p>
              
              {/* Trust signals */}
              <div style={{ display: 'flex', gap: 20, marginTop: 36, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  { v: '450+',  l: 'Verified Plants' },
                  { v: '14d',   l: 'Avg Cycle Time' },
                  { v: '99.8%', l: 'Quality Pass Rate' },
                ].map(s => (
                  <div key={s.v} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#18D5A5', letterSpacing: '-0.03em' }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Isometric Stage */}
            <HeroIsometricIllustration />
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: WHAT IS FACTORYGRID ─────────────────────── */}
      <section id="what-is-factorygrid" style={{ padding: '110px 0', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.012)', scrollMarginTop: 80 }}>
        <div className="fg-container">
          <div className="fg-section-header center">
            <div className="fg-pill" style={{ marginBottom: 16 }}><RefreshCw size={11} /> What is FactoryGrid?</div>
            <h2 className="fg-section-title" style={{ marginBottom: 12 }}>
              One platform, entire procurement journey
            </h2>
            <p className="fg-desc" style={{ maxWidth: 520, margin: '0 auto' }}>
              From intent to delivery — every step is digitized, tracked, and verified inside FactoryGrid.
            </p>
          </div>
          <ProcurementFlow />
        </div>
      </section>

      {/* ─── SECTION 3: WHY FACTORYGRID ─────────────────────────── */}
      <section id="why-factorygrid" style={{ padding: '110px 0', position: 'relative', zIndex: 1, scrollMarginTop: 80 }}>
        <div className="fg-container">
          <div className="fg-section-header center">
            <div className="fg-pill" style={{ marginBottom: 16 }}><Zap size={11} /> Why FactoryGrid</div>
            <h2 className="fg-section-title">Built for pharmaceutical procurement</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {/* Block 1: Faster Procurement */}
            <WhyBlock
              c="#18D5A5"
              sub="Faster Procurement"
              title="One RFQ. Multiple Manufacturers."
              desc="Send a single RFQ to 450+ pre-verified WHO-GMP manufacturing units simultaneously. Sealed bids arrive in 24–48 hours instead of 6 weeks."
              visual={
                <svg viewBox="0 0 240 120" style={{ width: '85%' }}>
                  {/* Single RFQ box */}
                  <rect x="10" y="40" width="60" height="36" rx="8" fill="rgba(24,213,165,0.12)" stroke="rgba(24,213,165,0.4)" strokeWidth="1.5"/>
                  <text x="40" y="61" textAnchor="middle" fontSize="9" fill="#18D5A5" fontWeight="700">RFQ</text>
                  {/* Lines to multiple */}
                  {[15, 50, 85].map((y, i) => (
                    <g key={i}>
                      <line x1="70" y1="58" x2="130" y2={y + 14} stroke="rgba(24,213,165,0.35)" strokeWidth="1.5" strokeDasharray="4 6" style={{ animation: `dashMove ${3 + i * 0.4}s linear infinite` }} />
                      <rect x="130" y={y} width="60" height="28" rx="6" fill="rgba(15,32,48,0.8)" stroke="rgba(24,213,165,0.25)" strokeWidth="1" />
                      <text x="160" y={y + 17} textAnchor="middle" fontSize="8" fill="#94A3B8">Mfg {i + 1}</text>
                    </g>
                  ))}
                  <text x="40" y="105" textAnchor="middle" fontSize="9" fill="#64748B">Buyer</text>
                </svg>
              }
            />

            {/* Block 2: Verified Manufacturers */}
            <WhyBlock
              c="#3AB8FF"
              sub="Verified Manufacturers"
              title="Pre-audited, certified facilities."
              desc="Every manufacturing partner is verified against Drug License Form 20B/21B, WHO-GMP, ISO 9001, and physical facility audit before appearing on the platform."
              visual={
                <svg viewBox="0 0 240 120" style={{ width: '85%' }}>
                  {/* Factory icon center */}
                  <rect x="85" y="30" width="70" height="55" rx="10" fill="rgba(58,184,255,0.1)" stroke="rgba(58,184,255,0.3)" strokeWidth="1.5"/>
                  <text x="120" y="60" textAnchor="middle" fontSize="9" fill="#3AB8FF" fontWeight="700">WHO-GMP</text>
                  <text x="120" y="72" textAnchor="middle" fontSize="8" fill="#94A3B8">Factory</text>
                  {/* Cert badges */}
                  {[
                    { x: 20,  y: 20,  t: 'ISO' },
                    { x: 185, y: 20,  t: 'FDA' },
                    { x: 20,  y: 75,  t: 'CDSCO' },
                    { x: 180, y: 75,  t: 'GMP' },
                  ].map(b => (
                    <g key={b.t}>
                      <circle cx={b.x + 16} cy={b.y + 13} r="15" fill="rgba(58,184,255,0.08)" stroke="rgba(58,184,255,0.3)" strokeWidth="1"/>
                      <text x={b.x + 16} y={b.y + 17} textAnchor="middle" fontSize="8" fill="#3AB8FF" fontWeight="700">{b.t}</text>
                    </g>
                  ))}
                </svg>
              }
            />

            {/* Block 3: Complete Visibility */}
            <WhyBlock
              c="#A78BFA"
              sub="Complete Visibility"
              title="Track every batch, every step."
              desc="Monitor production from granulation to HPLC assay clearance, cold-chain dispatch, and delivery GRN — all from one live dashboard."
              visual={
                <svg viewBox="0 0 240 120" style={{ width: '85%' }}>
                  {/* Vertical pipeline */}
                  <line x1="120" y1="10" x2="120" y2="110" stroke="rgba(167,139,250,0.25)" strokeWidth="2"/>
                  <line x1="120" y1="10" x2="120" y2="110" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5 8" style={{ animation: 'dashMove 3s linear infinite' }}/>
                  {['Batch Start', 'Tableting', 'QC HPLC', 'Dispatch', 'Delivered'].map((s, i) => (
                    <g key={s}>
                      <circle cx="120" cy={15 + i * 23} r="5" fill={i === 2 ? '#A78BFA' : 'rgba(167,139,250,0.3)'} stroke="rgba(167,139,250,0.5)" strokeWidth="1.5"/>
                      <text x="132" y={19 + i * 23} fontSize="9" fill={i === 2 ? '#fff' : '#94A3B8'}>{s}</text>
                    </g>
                  ))}
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: HOW IT WORKS — TIMELINE ─────────────────── */}
      <section id="how-it-works" style={{ padding: '110px 0', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.012)', scrollMarginTop: 80 }}>
        <div className="fg-container">
          <div className="fg-section-header center">
            <div className="fg-pill" style={{ marginBottom: 16 }}><Clock size={11} /> How It Works</div>
            <h2 className="fg-section-title">From RFQ to delivery in 14 days</h2>
          </div>
          <ProcurementTimeline />
        </div>
      </section>

      {/* ─── SECTION 5: SMART RFQ ENGINE ─────────────────────────── */}
      <section id="ai-matching" style={{ padding: '110px 0', position: 'relative', zIndex: 1, scrollMarginTop: 80 }}>
        <div className="fg-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div className="fg-pill" style={{ marginBottom: 16 }}><Bot size={11} /> AI Matching Engine</div>
              <h2 className="fg-section-title" style={{ marginBottom: 16 }}>Smart RFQ Engine</h2>
              <p className="fg-desc" style={{ marginBottom: 24 }}>
                One RFQ distributed intelligently to hundreds of WHO-GMP verified manufacturers. The AI engine surfaces the best-fit supplier automatically.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Simultaneous multi-manufacturer distribution',
                  'Pharmacopeial parameter matching',
                  'Automatic best-bid recommendation',
                  'Sealed confidential quoting',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(24,213,165,0.1)', border: '1px solid rgba(24,213,165,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={10} style={{ color: '#18D5A5' }} />
                    </div>
                    <span style={{ fontSize: 14, color: '#94A3B8' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <RFQEngineViz />
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: QUOTE COMPARISON ─────────────────────────── */}
      <section id="quote-comparison" style={{ padding: '110px 0', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.012)', scrollMarginTop: 80 }}>
        <div className="fg-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 64, alignItems: 'center' }}>
            <QuoteComparisonPanel />
            <div>
              <div className="fg-pill" style={{ marginBottom: 16 }}><BarChart3 size={11} /> Quote Comparison</div>
              <h2 className="fg-section-title" style={{ marginBottom: 16 }}>Side-by-side commercial evaluation</h2>
              <p className="fg-desc" style={{ marginBottom: 24 }}>
                Compare price, MOQ, delivery schedule, regulatory certifications and delivery protocols in a single unified panel. The best quotation is automatically highlighted.
              </p>
              {['Price per unit (ex-factory)', 'WHO-GMP & ISO certification status', 'Delivery schedule and delivery protocol', 'MOQ flexibility and payment terms'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(24,213,165,0.1)', border: '1px solid rgba(24,213,165,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={10} style={{ color: '#18D5A5' }} />
                  </div>
                  <span style={{ fontSize: 14, color: '#94A3B8' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: MANUFACTURER NETWORK MAP ─────────────────── */}
      <section id="manufacturer-network" style={{ padding: '110px 0', position: 'relative', zIndex: 1, scrollMarginTop: 80 }}>
        <div className="fg-container">
          <div className="fg-section-header center">
            <div className="fg-pill" style={{ marginBottom: 16 }}><Globe size={11} /> Manufacturer Network</div>
            <h2 className="fg-section-title">Verified Manufacturer Network</h2>
            <p className="fg-desc" style={{ maxWidth: 480, margin: '12px auto 0' }}>
              Hover over any location to explore manufacturing capacity, certifications, and available product categories.
            </p>
          </div>
          <IndiaMapSection />
        </div>
      </section>

      {/* ─── SECTION 8: COMPLIANCE & QUALITY ─────────────────────── */}
      <section id="compliance-quality" style={{ padding: '110px 0', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.012)', scrollMarginTop: 80 }}>
        <div className="fg-container">
          <div className="fg-section-header center">
            <div className="fg-pill" style={{ marginBottom: 16 }}><Lock size={11} /> Compliance & Quality</div>
            <h2 className="fg-section-title">Regulatory assurance built in</h2>
          </div>
          <ComplianceOrbit />
        </div>
      </section>

      {/* ─── SECTION 9: TESTIMONIALS ─────────────────────────────── */}
      <section id="testimonials" style={{ padding: '110px 0', position: 'relative', zIndex: 1, scrollMarginTop: 80 }}>
        <div className="fg-container">
          <div className="fg-section-header center">
            <div className="fg-pill" style={{ marginBottom: 16 }}><Star size={11} /> Testimonials</div>
            <h2 className="fg-section-title">Trusted by procurement leaders</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { quote: 'FactoryGrid cut our RFQ-to-order cycle time from 6 weeks to 14 days. The verified manufacturer network and automated comparison engine are genuinely world-class.', name: 'Dr. Rajesh Sharma', title: 'VP Sourcing', company: 'Apex Pharma', initials: 'RS', c: '#18D5A5' },
              { quote: 'The side-by-side quotation matrix and digital CoA verification have completely transformed our compliance audit process. A platform built by people who truly understand pharma.', name: 'Vikram Mehta', title: 'Head of Operations', company: 'SunBio LifeSciences', initials: 'VM', c: '#3AB8FF' },
              { quote: 'Live cold-chain batch tracking and automated GST invoicing eliminated an entire reconciliation step from our supply chain. Exceptional enterprise product experience.', name: 'Ananya Deshmukh', title: 'Supply Chain Director', company: 'Cipla Partner Labs', initials: 'AD', c: '#A78BFA' },
            ].map(t => (
              <motion.div
                key={t.name}
                className="fg-glass"
                whileHover={{ y: -5 }}
                style={{ padding: 32 }}
              >
                <div style={{ display: 'flex', gap: 3, marginBottom: 18 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="#FBBF24" color="#FBBF24" />
                  ))}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: '#94A3B8', marginBottom: 24 }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${t.c}18`, border: `1.5px solid ${t.c}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: t.c }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{t.title}, {t.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 10: CALL TO ACTION ───────────────────────────── */}
      <section id="get-started" style={{ padding: '120px 0', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', scrollMarginTop: 80 }}>
        {/* Animated CTA grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(24,213,165,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,213,165,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(24,213,165,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div className="fg-container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="fg-pill" style={{ marginBottom: 20, fontSize: 11 }}>Ready to get started?</div>
          <h2 className="fg-section-title" style={{ marginBottom: 18, maxWidth: 560, margin: '0 auto 18px' }}>
            Ready To Modernize Pharmaceutical Procurement?
          </h2>
          <p className="fg-desc" style={{ maxWidth: 440, margin: '0 auto 40px' }}>
            Join India's fastest-growing pharmaceutical procurement network. Digitize your entire sourcing workflow from day one.
          </p>
          
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#040C16', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="nav-logo-mark" style={{ width: 28, height: 28, fontSize: 11 }}>FG</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>FactoryGrid</span>
          </div>
          <div style={{ fontSize: 13, color: '#64748B' }}>
            © 2026 FactoryGrid Technologies Pvt. Ltd.&nbsp;&nbsp;|&nbsp;&nbsp;GSTIN: 07FGAAA9912Z1&nbsp;&nbsp;|&nbsp;&nbsp;Drug License: DL-2024-FG0001
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#64748B' }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" onClick={e => { e.preventDefault(); if (l === 'Contact') setIsContactSalesModalOpen(true); }} style={{ color: '#64748B', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Dedicated Enterprise Demo Request Modal ── */}
      <EnterpriseAccessRequestModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        defaultType="BUYER"
      />

      {/* ── Dedicated Contact Sales Consultation Modal ── */}
      <ContactSalesModal
        isOpen={isContactSalesModalOpen}
        onClose={() => setIsContactSalesModalOpen(false)}
      />
    </div>
  );
};

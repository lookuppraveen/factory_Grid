import React from 'react';

/* =========================================================
   FACTORYGRID — Shared Illustration Library
   All illustrations are inline SVG — zero dependencies.
   Categories:
     • PharmaFactoryIllustration  — Login left panel
     • Medicine thumbnails (by category)
     • Empty state illustrations
     • AI Orb component
     • Certificate / Document icons
   ========================================================= */

/* ── Pharma Factory Illustration (Login Left Panel) ──────── */
export const PharmaFactoryIllustration: React.FC = () => (
  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
    {/* Background base */}
    <rect width="400" height="300" fill="transparent"/>

    {/* Ground plane - isometric */}
    <ellipse cx="200" cy="240" rx="180" ry="40" fill="rgba(20,184,166,0.06)" />

    {/* ── Main Factory Building (center) ── */}
    {/* Front face */}
    <polygon points="130,200 270,200 270,130 130,130" fill="#1E293B" stroke="#334155" strokeWidth="1"/>
    {/* Top face */}
    <polygon points="130,130 200,100 270,130 200,160" fill="#0F172A" stroke="#334155" strokeWidth="1"/>
    {/* Right face */}
    <polygon points="270,130 270,200 310,180 310,110" fill="#162032" stroke="#334155" strokeWidth="1"/>

    {/* Factory windows - front */}
    {[0,1,2].map(i => (
      <g key={i}>
        <rect x={148 + i*40} y={148} width={22} height={30} rx={2} fill="#0284C7" opacity="0.7"/>
        <rect x={148 + i*40} y={148} width={22} height={14} rx={2} fill="#38BDF8" opacity="0.5"/>
        <line x1={159 + i*40} y1={148} x2={159 + i*40} y2={178} stroke="#0EA5E9" strokeWidth="0.5" opacity="0.6"/>
      </g>
    ))}

    {/* Factory chimney */}
    <rect x="215" y="95" width="14" height="45" rx="2" fill="#1E293B" stroke="#334155" strokeWidth="1"/>
    <rect x="212" y="90" width="20" height="8" rx="3" fill="#334155"/>
    {/* Smoke */}
    <circle cx="222" cy="78" r="6" fill="#334155" opacity="0.4"/>
    <circle cx="226" cy="64" r="5" fill="#334155" opacity="0.3"/>
    <circle cx="220" cy="52" r="4" fill="#334155" opacity="0.2"/>

    {/* Door */}
    <rect x="186" y="172" width="28" height="28" rx="2" fill="#14B8A6" opacity="0.4"/>
    <rect x="186" y="172" width="28" height="28" rx="2" stroke="#14B8A6" strokeWidth="1" fill="none"/>

    {/* ── Left Warehouse ── */}
    <polygon points="60,210 130,210 130,155 60,155" fill="#162032" stroke="#334155" strokeWidth="1"/>
    <polygon points="60,155 95,138 130,155 95,172" fill="#0F172A" stroke="#334155" strokeWidth="1"/>
    <polygon points="130,155 130,210 155,195 155,140" fill="#1A2840" stroke="#334155" strokeWidth="1"/>

    {/* Warehouse door */}
    <rect x="78" y="183" width="34" height="27" rx="1" fill="#0F766E" opacity="0.5"/>
    <line x1="95" y1="183" x2="95" y2="210" stroke="#14B8A6" strokeWidth="0.8" opacity="0.5"/>

    {/* ── Right Lab Building ── */}
    <polygon points="270,215 340,215 340,160 270,160" fill="#1A2536" stroke="#334155" strokeWidth="1"/>
    <polygon points="270,160 305,143 340,160 305,177" fill="#10192B" stroke="#334155" strokeWidth="1"/>
    {/* Lab windows */}
    {[0,1].map(i => (
      <rect key={i} x={282 + i*32} y={172} width={18} height={24} rx={2} fill="#6D28D9" opacity="0.5"/>
    ))}
    {/* Biohazard-style circle on lab */}
    <circle cx="305" cy="160" r="8" fill="none" stroke="#14B8A6" strokeWidth="1" opacity="0.4"/>
    <circle cx="305" cy="160" r="3" fill="#14B8A6" opacity="0.3"/>

    {/* ── Conveyor Belt / Production Line ── */}
    <rect x="150" y="212" width="100" height="6" rx="3" fill="#1E293B" stroke="#334155" strokeWidth="1"/>
    {[0,1,2,3,4].map(i => (
      <circle key={i} cx={158 + i*22} cy="215" r="4" fill="#0F766E"/>
    ))}

    {/* ── Delivery Truck ── */}
    <rect x="50" y="220" width="55" height="30" rx="3" fill="#1E3A5F" stroke="#334155" strokeWidth="1"/>
    <rect x="95" y="225" width="25" height="25" rx="2" fill="#162744" stroke="#334155" strokeWidth="1"/>
    <circle cx="65" cy="252" r="6" fill="#334155"/>
    <circle cx="65" cy="252" r="3" fill="#64748B"/>
    <circle cx="108" cy="252" r="6" fill="#334155"/>
    <circle cx="108" cy="252" r="3" fill="#64748B"/>
    {/* Truck window */}
    <rect x="98" y="228" width="19" height="12" rx="2" fill="#38BDF8" opacity="0.4"/>

    {/* ── Cargo boxes on truck ── */}
    {[0,1,2].map(i => (
      <g key={i}>
        <rect x={55 + i*14} y={210} width={12} height={10} rx={1} fill="#14B8A6" opacity="0.6"/>
        <line x1={55+i*14+6} y1={210} x2={55+i*14+6} y2={220} stroke="#0F766E" strokeWidth="0.5"/>
      </g>
    ))}

    {/* ── Network Connection Lines ── */}
    <line x1="155" y1="165" x2="95" y2="180" stroke="#14B8A6" strokeWidth="1" strokeDasharray="4 3" opacity="0.3"/>
    <line x1="245" y1="165" x2="305" y2="180" stroke="#14B8A6" strokeWidth="1" strokeDasharray="4 3" opacity="0.3"/>

    {/* ── Floating Data Points ── */}
    {[
      { x: 60, y: 100, label: 'WHO-GMP' },
      { x: 290, y: 95, label: 'ISO 9001' },
      { x: 175, y: 75, label: 'CDSCO' },
    ].map((d, i) => (
      <g key={i}>
        <rect x={d.x - 22} y={d.y - 10} width={44} height={16} rx={8} fill="rgba(20,184,166,0.15)" stroke="rgba(20,184,166,0.4)" strokeWidth="0.8"/>
        <text x={d.x} y={d.y + 2} textAnchor="middle" fontSize="7" fill="#14B8A6" fontWeight="600" fontFamily="monospace">{d.label}</text>
      </g>
    ))}

    {/* ── Teal accent glow blobs ── */}
    <circle cx="200" cy="150" r="90" fill="radial-gradient(circle, rgba(20,184,166,0.04) 0%, transparent 100%)" opacity="0.5"/>

    {/* ── Molecular dots decoration ── */}
    {[
      {x:355,y:60},{x:370,y:80},{x:380,y:55},{x:362,y:70}
    ].map((d,i) => <circle key={i} cx={d.x} cy={d.y} r={3} fill="#14B8A6" opacity="0.3"/>)}
    <line x1="355" y1="60" x2="370" y2="80" stroke="#14B8A6" strokeWidth="0.8" opacity="0.2"/>
    <line x1="370" y1="80" x2="380" y2="55" stroke="#14B8A6" strokeWidth="0.8" opacity="0.2"/>
    <line x1="355" y1="60" x2="380" y2="55" stroke="#14B8A6" strokeWidth="0.8" opacity="0.2"/>

    {[
      {x:20,y:130},{x:35,y:110},{x:28,y:145}
    ].map((d,i) => <circle key={i} cx={d.x} cy={d.y} r={2.5} fill="#3B82F6" opacity="0.25"/>)}
  </svg>
);

/* ── Medicine Thumbnails by Category ─────────────────────── */

// Capsule (Antibiotics)
export const CapsuleThumbnail: React.FC<{ color?: string }> = ({ color = '#2563EB' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill={`${color}12`}/>
    {/* Capsule body */}
    <ellipse cx="24" cy="24" rx="14" ry="8" fill="none" stroke={color} strokeWidth="1.5"/>
    <rect x="10" y="16" width="14" height="16" fill={`${color}30`}/>
    <rect x="24" y="16" width="14" height="16" fill={`${color}18`}/>
    <line x1="24" y1="16" x2="24" y2="32" stroke={color} strokeWidth="1.5"/>
    <ellipse cx="17" cy="24" rx="7" ry="8" fill={`${color}40`}/>
    <ellipse cx="31" cy="24" rx="7" ry="8" fill={`${color}20`}/>
  </svg>
);

// Tablet Strip (Analgesic)
export const TabletStripThumbnail: React.FC<{ color?: string }> = ({ color = '#0F766E' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill={`${color}12`}/>
    {/* Blister strip */}
    <rect x="8" y="14" width="32" height="20" rx="4" fill={`${color}18`} stroke={color} strokeWidth="1"/>
    {/* 4 tablet blisters */}
    {[0,1,2,3].map(i => (
      <g key={i}>
        <ellipse cx={13 + i*8} cy="24" rx="4" ry="5" fill={`${color}40`} stroke={color} strokeWidth="0.8"/>
        <ellipse cx={13 + i*8} cy="24" rx="2" ry="2.5" fill={color} opacity="0.5"/>
      </g>
    ))}
  </svg>
);

// Round Pill (Gastroenterology)
export const PillThumbnail: React.FC<{ color?: string }> = ({ color = '#16A34A' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill={`${color}12`}/>
    <circle cx="24" cy="24" r="12" fill={`${color}25`} stroke={color} strokeWidth="1.5"/>
    <circle cx="24" cy="24" r="8" fill={`${color}35`}/>
    <circle cx="24" cy="24" r="4" fill={color} opacity="0.5"/>
    {/* Score line */}
    <line x1="12" y1="24" x2="36" y2="24" stroke={color} strokeWidth="1" opacity="0.4"/>
  </svg>
);

// Injection Pen (Diabetology)
export const InjectionThumbnail: React.FC<{ color?: string }> = ({ color = '#F59E0B' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill={`${color}12`}/>
    {/* Syringe body */}
    <rect x="10" y="21" width="24" height="6" rx="3" fill={`${color}30`} stroke={color} strokeWidth="1.2"/>
    {/* Needle */}
    <rect x="34" y="23" width="8" height="2" rx="1" fill={color} opacity="0.7"/>
    {/* Plunger */}
    <rect x="7" y="19" width="5" height="10" rx="2" fill={color} opacity="0.5"/>
    <rect x="6" y="22" width="5" height="4" rx="1" fill={color}/>
    {/* Measurement lines */}
    {[0,1,2,3].map(i => (
      <line key={i} x1={15+i*5} y1={21} x2={15+i*5} y2={19} stroke={color} strokeWidth="0.8" opacity="0.5"/>
    ))}
    {/* Liquid fill */}
    <rect x="10" y="21" width="14" height="6" rx="3" fill={`${color}50`}/>
  </svg>
);

// Generic medicine box
export const MedicineBoxThumbnail: React.FC<{ color?: string; letter?: string }> = ({ color = '#6D28D9', letter = 'Rx' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill={`${color}12`}/>
    {/* Box */}
    <rect x="10" y="13" width="28" height="22" rx="3" fill={`${color}20`} stroke={color} strokeWidth="1.2"/>
    {/* Stripe */}
    <rect x="10" y="20" width="28" height="8" fill={`${color}30`}/>
    {/* Cross symbol */}
    <rect x="21" y="16" width="6" height="2" rx="1" fill={color} opacity="0.7"/>
    <rect x="23" y="14" width="2" height="6" rx="1" fill={color} opacity="0.7"/>
    {/* Label */}
    <text x="24" y="33" textAnchor="middle" fontSize="8" fill={color} fontWeight="800" fontFamily="monospace">{letter}</text>
  </svg>
);

export const getMedicineThumbnail = (category: string) => {
  switch (category) {
    case 'Antibiotics': return <CapsuleThumbnail color="#2563EB"/>;
    case 'Analgesic': return <TabletStripThumbnail color="#0F766E"/>;
    case 'Gastroenterology': return <PillThumbnail color="#16A34A"/>;
    case 'Diabetology': return <InjectionThumbnail color="#F59E0B"/>;
    case 'Cardiovascular': return <CapsuleThumbnail color="#DC2626"/>;
    case 'Neurology': return <PillThumbnail color="#6D28D9"/>;
    default: return <MedicineBoxThumbnail color="#0F766E"/>;
  }
};

/* ── Empty State Illustrations ───────────────────────────── */

export const EmptyRFQIllustration: React.FC = () => (
  <svg width="180" height="140" viewBox="0 0 180 140" fill="none">
    {/* Document stack */}
    <rect x="40" y="30" width="70" height="90" rx="6" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5"/>
    <rect x="50" y="20" width="70" height="90" rx="6" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5"/>
    <rect x="60" y="10" width="70" height="90" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5"/>
    {/* Lines on doc */}
    {[0,1,2,3].map(i => <rect key={i} x="72" y={26+i*12} width="46" height="4" rx="2" fill="#E2E8F0"/>)}
    {/* RFQ label */}
    <rect x="68" y="22" width="20" height="8" rx="2" fill="#DBEAFE"/>
    <text x="78" y="28" textAnchor="middle" fontSize="5" fill="#2563EB" fontWeight="700">RFQ</text>
    {/* Plus icon */}
    <circle cx="140" cy="100" r="18" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/>
    <line x1="133" y1="100" x2="147" y2="100" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
    <line x1="140" y1="93" x2="140" y2="107" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const EmptyOrdersIllustration: React.FC = () => (
  <svg width="180" height="140" viewBox="0 0 180 140" fill="none">
    {/* Warehouse shelves */}
    <rect x="20" y="50" width="140" height="80" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5"/>
    {/* Shelves */}
    {[0,1,2].map(i => (
      <g key={i}>
        <rect x="20" y={70 + i*20} width="140" height="3" fill="#E2E8F0"/>
        {/* Empty boxes outline */}
        {[0,1,2,3].map(j => (
          <rect key={j} x={28 + j*32} y={74+i*20} width={24} height={14} rx="2" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2"/>
        ))}
      </g>
    ))}
    {/* Forklift outline */}
    <rect x="70" y="25" width="40" height="28" rx="3" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5"/>
    <rect x="105" y="30" width="12" height="18" rx="2" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1"/>
    <circle cx="80" cy="55" r="5" fill="#CBD5E1"/>
    <circle cx="100" cy="55" r="5" fill="#CBD5E1"/>
  </svg>
);

export const EmptyComplianceIllustration: React.FC = () => (
  <svg width="180" height="140" viewBox="0 0 180 140" fill="none">
    {/* Shield */}
    <path d="M90 15 L140 35 L140 80 Q140 115 90 130 Q40 115 40 80 L40 35 Z" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="1.5"/>
    {/* Checkmark */}
    <path d="M68 75 L82 89 L112 59" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
    {/* Question mark */}
    <text x="90" y="82" textAnchor="middle" fontSize="28" fill="#CBD5E1" fontWeight="700">?</text>
    {/* Dots */}
    <circle cx="50" cy="40" r="3" fill="#BBF7D0"/>
    <circle cx="130" cy="40" r="3" fill="#BBF7D0"/>
    <circle cx="140" cy="120" r="2" fill="#BBF7D0"/>
  </svg>
);

export const EmptyAnalyticsIllustration: React.FC = () => (
  <svg width="180" height="140" viewBox="0 0 180 140" fill="none">
    {/* Chart area */}
    <rect x="20" y="20" width="140" height="90" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5"/>
    {/* Grid lines */}
    {[0,1,2,3].map(i => <line key={i} x1="30" y1={35+i*18} x2="150" y2={35+i*18} stroke="#E2E8F0" strokeWidth="1"/>)}
    {/* Empty bars */}
    {[0,1,2,3,4].map(i => (
      <rect key={i} x={40+i*22} y={40+i*10} width="14" height={60-i*10} rx="2" fill="none" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 2"/>
    ))}
    {/* No data label */}
    <text x="90" y="125" textAnchor="middle" fontSize="9" fill="#94A3B8" fontWeight="500">No data yet</text>
  </svg>
);

export const EmptyManufacturersIllustration: React.FC = () => (
  <svg width="180" height="140" viewBox="0 0 180 140" fill="none">
    {/* Factory outline */}
    <rect x="30" y="60" width="120" height="65" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5"/>
    {/* Roof */}
    <polygon points="30,60 90,30 150,60" fill="none" stroke="#E2E8F0" strokeWidth="1.5"/>
    {/* Windows */}
    {[0,1,2].map(i => (
      <rect key={i} x={46+i*34} y="74" width="18" height="22" rx="2" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 2"/>
    ))}
    {/* Chimney */}
    <rect x="88" y="35" width="10" height="28" rx="2" fill="none" stroke="#E2E8F0" strokeWidth="1.5"/>
    {/* Plus badge */}
    <circle cx="145" cy="45" r="14" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/>
    <line x1="139" y1="45" x2="151" y2="45" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
    <line x1="145" y1="39" x2="145" y2="51" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const EmptyCustomersIllustration: React.FC = () => (
  <svg width="180" height="140" viewBox="0 0 180 140" fill="none">
    {/* Person 1 */}
    <circle cx="70" cy="55" r="18" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1.5"/>
    <circle cx="70" cy="48" r="9" fill="#E2E8F0"/>
    <path d="M49 75 Q70 68 91 75" fill="none" stroke="#E2E8F0" strokeWidth="1.5"/>
    {/* Person 2 */}
    <circle cx="115" cy="55" r="18" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1.5"/>
    <circle cx="115" cy="48" r="9" fill="#E2E8F0"/>
    <path d="M94 75 Q115 68 136 75" fill="none" stroke="#E2E8F0" strokeWidth="1.5"/>
    {/* Add button */}
    <circle cx="90" cy="105" r="16" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/>
    <line x1="84" y1="105" x2="96" y2="105" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
    <line x1="90" y1="99" x2="90" y2="111" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const EmptyInvoicesIllustration: React.FC = () => (
  <svg width="180" height="140" viewBox="0 0 180 140" fill="none">
    <rect x="50" y="15" width="80" height="105" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5"/>
    <rect x="50" y="15" width="80" height="22" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5"/>
    <text x="90" y="30" textAnchor="middle" fontSize="8" fill="#94A3B8" fontWeight="700">INVOICE</text>
    {[0,1,2,3].map(i => <rect key={i} x="62" y={50+i*16} width={i===3?30:55} height="5" rx="2" fill="#F1F5F9"/>)}
    <rect x="62" y="105" width="56" height="8" rx="3" fill="#DBEAFE"/>
    <text x="90" y="112" textAnchor="middle" fontSize="6" fill="#2563EB" fontWeight="700">₹ 0.00 PENDING</text>
  </svg>
);

/* ── AI Orb Component ─────────────────────────────────────── */
export const AIOrbIcon: React.FC<{ size?: number; animated?: boolean }> = ({ size = 32, animated = true }) => (
  <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={animated ? { animation: 'ai-pulse 3s ease-in-out infinite' } : {}}>
      {/* Outer glow ring */}
      <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(20,184,166,0.2)" strokeWidth="1.5"/>
      <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(20,184,166,0.1)" strokeWidth="3"/>
      {/* Mid ring */}
      <circle cx="16" cy="16" r="10" fill="rgba(20,184,166,0.08)" stroke="rgba(20,184,166,0.4)" strokeWidth="1"/>
      {/* Inner orb */}
      <circle cx="16" cy="16" r="7" fill="rgba(15,118,110,0.3)"/>
      {/* Core */}
      <circle cx="16" cy="16" r="4" fill="#14B8A6"/>
      {/* Highlight */}
      <circle cx="14" cy="14" r="1.5" fill="rgba(255,255,255,0.6)"/>
      {/* Orbit dot */}
      <circle cx="16" cy="6" r="1.5" fill="#14B8A6" opacity="0.7"/>
    </svg>
  </div>
);

/* ── Certificate / Document Icon Variants ────────────────── */
export const WHOGMPBadge: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#ECFDF5"/>
    <path d="M24 8 L34 13 L34 28 Q34 38 24 42 Q14 38 14 28 L14 13 Z" fill="#D1FAE5" stroke="#16A34A" strokeWidth="1.5"/>
    <path d="M19 24 L22 27 L29 20" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="24" y="44" textAnchor="middle" fontSize="6" fill="#16A34A" fontWeight="700">WHO-GMP</text>
  </svg>
);

export const FDABadge: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#EFF6FF"/>
    <rect x="10" y="12" width="28" height="24" rx="3" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5"/>
    <text x="24" y="28" textAnchor="middle" fontSize="11" fill="#2563EB" fontWeight="800">FDA</text>
    <rect x="14" y="32" width="20" height="2" rx="1" fill="#BFDBFE"/>
    <text x="24" y="43" textAnchor="middle" fontSize="5.5" fill="#2563EB" fontWeight="600">APPROVED</text>
  </svg>
);

export const ISOBadge: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#F5F3FF"/>
    <circle cx="24" cy="22" r="12" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="1.5"/>
    <text x="24" y="26" textAnchor="middle" fontSize="8" fill="#7C3AED" fontWeight="800">ISO</text>
    <text x="24" y="43" textAnchor="middle" fontSize="6" fill="#7C3AED" fontWeight="600">9001:2015</text>
  </svg>
);

export const PDFDocumentIcon: React.FC<{ color?: string }> = ({ color = '#DC2626' }) => (
  <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
    <path d="M4 4 Q4 0 8 0 H27 L40 13 V44 Q40 48 36 48 H8 Q4 48 4 44 Z" fill="#FEF2F2"/>
    <path d="M26 0 L40 14 H30 Q26 14 26 10 Z" fill={`${color}30`} stroke={color} strokeWidth="0.5"/>
    <path d="M26 0 L26 10 Q26 14 30 14 H40" fill="none" stroke={color} strokeWidth="0.5"/>
    <text x="20" y="28" textAnchor="middle" fontSize="8" fill={color} fontWeight="800">PDF</text>
    {[0,1].map(i => <rect key={i} x="8" y={33+i*6} width="24" height="3" rx="1.5" fill={`${color}25`}/>)}
  </svg>
);

/* ── Factory Profile Avatar ───────────────────────────────── */
export const FactoryAvatar: React.FC<{ initials: string; color?: string; size?: number }> = ({
  initials, color = '#0F766E', size = 48
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill={`${color}15`} stroke={`${color}30`} strokeWidth="1"/>
    {/* Mini factory icon */}
    <rect x="8" y="22" width="32" height="18" rx="2" fill={`${color}25`}/>
    <polygon points="8,22 24,14 40,22" fill={`${color}35`}/>
    {/* Windows */}
    <rect x="13" y="27" width="6" height="8" rx="1" fill={color} opacity="0.5"/>
    <rect x="22" y="27" width="6" height="8" rx="1" fill={color} opacity="0.5"/>
    <rect x="31" y="27" width="6" height="8" rx="1" fill={color} opacity="0.5"/>
    {/* Chimney */}
    <rect x="27" y="15" width="4" height="10" rx="1" fill={`${color}50`}/>
    {/* Initials overlay */}
    <text x="24" y="26" textAnchor="middle" fontSize="6" fill={color} fontWeight="800" opacity="0.8">{initials}</text>
  </svg>
);

/* ── Order Stage Icons ────────────────────────────────────── */
export const OrderStageIcon: React.FC<{ stage: string; active: boolean; done: boolean }> = ({ stage, active, done }) => {
  const color = done ? '#16A34A' : active ? '#2563EB' : '#94A3B8';
  const bg = done ? '#F0FDF4' : active ? '#EFF6FF' : '#F8FAFC';

  const iconMap: Record<string, React.ReactNode> = {
    rfq: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="2" width="14" height="17" rx="2" fill="none" stroke={color} strokeWidth="1.5"/>
        {[0,1,2].map(i => <rect key={i} x="6" y={6+i*4} width="8" height="1.5" rx="0.75" fill={color} opacity="0.6"/>)}
        <circle cx="15" cy="5" r="4" fill={active||done ? color : '#E2E8F0'}/>
        <text x="15" y="7" textAnchor="middle" fontSize="4.5" fill="white" fontWeight="800">RFQ</text>
      </svg>
    ),
    quote: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="14" rx="2" fill="none" stroke={color} strokeWidth="1.5"/>
        <line x1="6" y1="8" x2="14" y2="8" stroke={color} strokeWidth="1" opacity="0.5"/>
        <line x1="6" y1="11" x2="10" y2="11" stroke={color} strokeWidth="1" opacity="0.5"/>
        <path d="M13 13 L16 10 L19 13" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    production: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="9" width="16" height="9" rx="1.5" fill="none" stroke={color} strokeWidth="1.5"/>
        <polygon points="2,9 10,5 18,9" fill="none" stroke={color} strokeWidth="1.5"/>
        <rect x="7" y="11" width="6" height="7" fill={color} opacity="0.3" rx="1"/>
        <rect x="9" y="4" width="3" height="6" rx="1" fill={color} opacity="0.4"/>
      </svg>
    ),
    packaging: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="7" width="14" height="11" rx="2" fill="none" stroke={color} strokeWidth="1.5"/>
        <path d="M3 10 L17 10" stroke={color} strokeWidth="1" opacity="0.5"/>
        <path d="M10 7 L10 4 M7 4 L13 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="6" y="12" width="8" height="4" rx="1" fill={color} opacity="0.25"/>
      </svg>
    ),
    coldchain: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="6" width="16" height="12" rx="2" fill="none" stroke={color} strokeWidth="1.5"/>
        <rect x="2" y="6" width="16" height="5" rx="2" fill={color} opacity="0.15"/>
        {/* Snowflake */}
        <line x1="10" y1="9" x2="10" y2="15" stroke={color} strokeWidth="1" opacity="0.7"/>
        <line x1="7" y1="12" x2="13" y2="12" stroke={color} strokeWidth="1" opacity="0.7"/>
        <line x1="7.5" y1="9.5" x2="12.5" y2="14.5" stroke={color} strokeWidth="0.8" opacity="0.5"/>
        <line x1="12.5" y1="9.5" x2="7.5" y2="14.5" stroke={color} strokeWidth="0.8" opacity="0.5"/>
        <text x="10" y="5.5" textAnchor="middle" fontSize="4" fill={color}>2–8°C</text>
      </svg>
    ),
    dispatch: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="1" y="9" width="13" height="8" rx="2" fill="none" stroke={color} strokeWidth="1.5"/>
        <path d="M14 11 L14 15 L19 13 Z" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx="4" cy="18" r="2" fill={color} opacity="0.6"/>
        <circle cx="10" cy="18" r="2" fill={color} opacity="0.6"/>
        <rect x="5" y="9" width="4" height="5" rx="1" fill={color} opacity="0.3"/>
      </svg>
    ),
    delivered: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" fill="none" stroke={color} strokeWidth="1.5"/>
        <path d="M6 10 L9 13 L14 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  };

  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: bg,
      border: `2px solid ${done ? '#16A34A' : active ? '#2563EB' : '#E2E8F0'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: active ? `0 0 0 4px ${color}20` : 'none',
      transition: 'all 0.2s ease',
      flexShrink: 0,
    }}>
      {iconMap[stage] || iconMap['rfq']}
    </div>
  );
};

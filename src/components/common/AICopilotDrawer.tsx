import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, Zap, ArrowRight, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { AIOrbIcon } from './Illustrations';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your AI Procurement Copilot. I analyze manufacturer capacity, WHO-GMP compliance, historical batch pricing, and delivery risk in real-time. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: queryText }]);
    if (!textToSend) setInput('');
    setIsThinking(true);

    setTimeout(() => {
      let reply = "Based on our marketplace intelligence across 450+ WHO-GMP manufacturers, SunBio LifeSciences offers the best cost-to-compliance score for Paracetamol 500mg (₹0.85/tab at 98.4% SLA rate). Would you like me to auto-generate an RFQ?";
      if (queryText.toLowerCase().includes('risk') || queryText.toLowerCase().includes('delay')) {
        reply = "Risk Analysis: Master Order MO-2026-1001 has a low risk score (12%). Sub-Order SO-02 is 100% completed and ready for AWB dispatch. No supply chain bottlenecks detected.";
      } else if (queryText.toLowerCase().includes('quote') || queryText.toLowerCase().includes('compare')) {
        reply = "Quote Comparison Summary: SunBio LifeSciences is 12% lower than Cipla Partner Labs for Paracetamol 500mg, but Cipla offers 5 days faster SLA delivery (Aug 15 vs Aug 20).";
      }
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      setIsThinking(false);
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(6, 11, 24, 0.6)', backdropFilter: 'blur(4px)' }}
        />

        {/* Drawer Window */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          style={{
            position: 'relative',
            zIndex: 10000,
            width: '100%',
            maxWidth: 440,
            height: '100vh',
            background: 'rgba(10, 18, 34, 0.96)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-20px 0 50px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AIOrbIcon size={36} />
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>AI Procurement Copilot</h3>
                <span style={{ fontSize: 11, color: '#34D399', fontWeight: 600 }}>● Active • Holographic Engine v3.2</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
              <X size={20} />
            </button>
          </div>

          {/* Prompt Presets */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: 8, overflowX: 'auto' }}>
            {[
              'Compare Quotes',
              'Predict Delays',
              'Find Manufacturers',
              'Optimize Cost',
            ].map(preset => (
              <button
                key={preset}
                onClick={() => handleSend(preset)}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 999,
                  padding: '5px 12px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Message Area */}
          <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  background: m.role === 'user' ? 'linear-gradient(135deg, #1D4ED8, #2563EB)' : 'rgba(255, 255, 255, 0.05)',
                  border: m.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '12px 16px',
                  fontSize: 13,
                  color: '#fff',
                  lineHeight: 1.6,
                }}
              >
                {m.text}
              </motion.div>
            ))}

            {isThinking && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', animation: 'ping-dot 1s infinite' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Analyzing marketplace data...</span>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <div style={{ padding: 16, borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(6, 11, 24, 0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '8px 12px' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask AI Copilot anything about RFQs or suppliers..."
                style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, color: '#fff', fontSize: 13, fontFamily: 'inherit' }}
              />
              <button
                onClick={() => handleSend()}
                style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

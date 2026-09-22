import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Truck, ShieldCheck, CheckCircle2, X, RefreshCw, Key, Lock, Globe, Server, Check, AlertCircle, AlertTriangle, ExternalLink, Activity } from 'lucide-react';
import { blueDartConnector } from '../../services/connectors/BlueDartConnector';
import { delhiveryConnector } from '../../services/connectors/DelhiveryConnector';
import { messageCentralProvider, apiSathiProvider, gstVerifyProvider, signCareProvider, cashfreeProvider } from '../../services/connectors/GSTVerificationConnectors';
import { ShipmentCredentials } from '../../services/connectors/types';
import { GSTCredentials } from '../../services/connectors/gstTypes';

export const IntegrationsSettingsModule: React.FC<{ initialCategory?: 'SHIPMENT' | 'GST' }> = ({ initialCategory = 'SHIPMENT' }) => {
  const {
    shipmentConnectors, gstConnectors,
    saveShipmentConnector, disconnectShipmentConnector,
    saveGSTConnector, disconnectGSTConnector
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<'SHIPMENT' | 'GST'>(initialCategory);

  // Modal States for Shipment Provider Configuration
  const [selectedShipmentProvider, setSelectedShipmentProvider] = useState<'bluedart' | 'delhivery' | null>(null);
  const [customerCodeInput, setCustomerCodeInput] = useState<string>('');
  const [consumerKeyInput, setConsumerKeyInput] = useState<string>('');
  const [consumerSecretInput, setConsumerSecretInput] = useState<string>('');
  const [shipmentEnvInput, setShipmentEnvInput] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX');
  const [isTestingShipment, setIsTestingShipment] = useState<boolean>(false);
  const [shipmentTestResult, setShipmentTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Dedicated Environment Isolation States for Delhivery Logistics
  const [delhiverySandbox, setDelhiverySandbox] = useState<{ customerCode: string; consumerKey: string; consumerSecret: string; isConnected?: boolean; connectedAt?: string }>({
    customerCode: 'DEL88910-TEST', customerKey: 'del_key_sandbox_4412', consumerSecret: 'del_sec_sandbox_1192', isConnected: false
  });

  const [delhiveryProduction, setDelhiveryProduction] = useState<{ customerCode: string; consumerKey: string; consumerSecret: string; isConnected?: boolean; connectedAt?: string }>({
    customerCode: '', consumerKey: '', consumerSecret: '', isConnected: false
  });

  const [prodConfirmed, setProdConfirmed] = useState<boolean>(false);

  // Modal States for GST Provider Configuration
  const [selectedGstProvider, setSelectedGstProvider] = useState<string | null>(null);
  const [gstApiKeyInput, setGstApiKeyInput] = useState<string>('');
  const [gstApiSecretInput, setGstApiSecretInput] = useState<string>('');
  const [gstClientCodeInput, setGstClientCodeInput] = useState<string>('');
  const [gstEnvInput, setGstEnvInput] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX');
  const [isTestingGst, setIsTestingGst] = useState<boolean>(false);
  const [gstTestResult, setGstTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [gstProdConfirmed, setGstProdConfirmed] = useState<boolean>(false);

  // Per-Provider Environment Storage for GST Providers
  const [gstProviderConfigs, setGstProviderConfigs] = useState<Record<string, {
    sandboxConfig?: EnvGSTCredentials;
    productionConfig?: EnvGSTCredentials;
  }>>({});

  // Open Shipment Provider Config
  const handleOpenShipmentModal = (providerId: 'bluedart' | 'delhivery') => {
    setSelectedShipmentProvider(providerId);
    setShipmentTestResult(null);
    setProdConfirmed(false);

    const existing = shipmentConnectors[providerId];
    if (providerId === 'delhivery') {
      const initialEnv = existing?.environment || 'SANDBOX';
      setShipmentEnvInput(initialEnv);

      const sb = existing?.sandboxConfig || {
        customerCode: 'DEL88910-TEST',
        consumerKey: 'del_key_sandbox_4412',
        consumerSecret: 'del_sec_sandbox_1192',
        isConnected: false
      };
      const pr = existing?.productionConfig || {
        customerCode: '',
        consumerKey: '',
        consumerSecret: '',
        isConnected: false
      };

      setDelhiverySandbox(sb);
      setDelhiveryProduction(pr);

      const activeCreds = initialEnv === 'PRODUCTION' ? pr : sb;
      setCustomerCodeInput(activeCreds.customerCode || (existing?.customerCode || 'DEL88910-TEST'));
      setConsumerKeyInput(activeCreds.consumerKey || (existing?.consumerKey || 'del_key_sandbox_4412'));
      setConsumerSecretInput(activeCreds.consumerSecret || (existing?.consumerSecret || 'del_sec_sandbox_1192'));
    } else {
      if (existing) {
        setCustomerCodeInput(existing.customerCode || '');
        setConsumerKeyInput(existing.consumerKey || '');
        setConsumerSecretInput(existing.consumerSecret || '');
        setShipmentEnvInput(existing.environment || 'SANDBOX');
      } else {
        setCustomerCodeInput('BD998210');
        setConsumerKeyInput('bd_key_sandbox_9981');
        setConsumerSecretInput('bd_secret_sandbox_88921');
        setShipmentEnvInput('SANDBOX');
      }
    }
  };

  // Switch Environment in Shipment Modal (preserves separate state for Sandbox vs Production)
  const handleSwitchShipmentEnv = (newEnv: 'SANDBOX' | 'PRODUCTION') => {
    if (selectedShipmentProvider === 'delhivery') {
      // Save current input fields into the previous environment's state before switching
      if (shipmentEnvInput === 'SANDBOX') {
        setDelhiverySandbox(prev => ({
          ...prev,
          customerCode: customerCodeInput,
          consumerKey: consumerKeyInput,
          consumerSecret: consumerSecretInput
        }));
      } else {
        setDelhiveryProduction(prev => ({
          ...prev,
          customerCode: customerCodeInput,
          consumerKey: consumerKeyInput,
          consumerSecret: consumerSecretInput
        }));
      }

      setShipmentEnvInput(newEnv);
      setShipmentTestResult(null);

      // Load new environment's credentials into form inputs
      const targetCreds = newEnv === 'PRODUCTION' ? delhiveryProduction : delhiverySandbox;
      setCustomerCodeInput(targetCreds.customerCode || '');
      setConsumerKeyInput(targetCreds.consumerKey || '');
      setConsumerSecretInput(targetCreds.consumerSecret || '');
    } else {
      setShipmentEnvInput(newEnv);
      setShipmentTestResult(null);
    }
  };

  // Test Shipment Provider Connection
  const handleTestShipmentConnection = async () => {
    if (!selectedShipmentProvider) return;
    setIsTestingShipment(true);
    setShipmentTestResult(null);

    const creds: ShipmentCredentials = {
      customerCode: customerCodeInput,
      consumerKey: consumerKeyInput,
      consumerSecret: consumerSecretInput,
      environment: shipmentEnvInput,
      sandboxConfig: selectedShipmentProvider === 'delhivery' ? (shipmentEnvInput === 'SANDBOX' ? { customerCode: customerCodeInput, consumerKey: consumerKeyInput, consumerSecret: consumerSecretInput } : delhiverySandbox) : undefined,
      productionConfig: selectedShipmentProvider === 'delhivery' ? (shipmentEnvInput === 'PRODUCTION' ? { customerCode: customerCodeInput, consumerKey: consumerKeyInput, consumerSecret: consumerSecretInput } : delhiveryProduction) : undefined
    };

    const connector = selectedShipmentProvider === 'bluedart' ? blueDartConnector : delhiveryConnector;
    const res = await connector.testConnection(creds);
    setShipmentTestResult(res);
    setIsTestingShipment(false);
  };

  // Save Shipment Provider
  const handleSaveShipmentConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentProvider) return;

    if (!customerCodeInput.trim() || !consumerKeyInput.trim() || !consumerSecretInput.trim()) {
      alert('⚠ All credentials fields (Account Code, Consumer Key, Consumer Secret) are required.');
      return;
    }

    if (selectedShipmentProvider === 'delhivery' && shipmentEnvInput === 'PRODUCTION' && !prodConfirmed) {
      alert('⚠ Production Confirmation Required!\n\nPlease check the confirmation box acknowledging live Delhivery account usage before saving production credentials.');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];

    if (selectedShipmentProvider === 'delhivery') {
      const updatedSb = shipmentEnvInput === 'SANDBOX'
        ? { customerCode: customerCodeInput, consumerKey: consumerKeyInput, consumerSecret: consumerSecretInput, isConnected: true, connectedAt: dateStr }
        : delhiverySandbox;

      const updatedPr = shipmentEnvInput === 'PRODUCTION'
        ? { customerCode: customerCodeInput, consumerKey: consumerKeyInput, consumerSecret: consumerSecretInput, isConnected: true, connectedAt: dateStr }
        : delhiveryProduction;

      const creds: ShipmentCredentials = {
        customerCode: customerCodeInput,
        consumerKey: consumerKeyInput,
        consumerSecret: consumerSecretInput,
        environment: shipmentEnvInput,
        isConnected: true,
        connectedAt: dateStr,
        sandboxConfig: updatedSb,
        productionConfig: updatedPr
      };

      saveShipmentConnector('delhivery', creds);
      setSelectedShipmentProvider(null);
      alert(`✓ Saved Delhivery ${shipmentEnvInput === 'PRODUCTION' ? 'LIVE PRODUCTION' : 'SANDBOX / TEST'} Gateway configuration successfully!`);
    } else {
      const creds: ShipmentCredentials = {
        customerCode: customerCodeInput,
        consumerKey: consumerKeyInput,
        consumerSecret: consumerSecretInput,
        environment: shipmentEnvInput
      };

      saveShipmentConnector(selectedShipmentProvider, creds);
      setSelectedShipmentProvider(null);
      alert(`✓ Connected ${selectedShipmentProvider === 'bluedart' ? 'Blue Dart Express' : 'Delhivery Logistics'} successfully!`);
    }
  };

  // Open GST Provider Config
  const handleOpenGstModal = (providerId: string) => {
    setSelectedGstProvider(providerId);
    setGstTestResult(null);
    setGstProdConfirmed(false);

    const existing = gstConnectors[providerId];
    const initialEnv = existing?.environment || 'SANDBOX';
    setGstEnvInput(initialEnv);

    // Initialize provider config from stored connectors
    const sb = existing?.sandboxConfig || {
      apiKey: providerId === 'messagecentral' ? 'mc_key_sandbox_9981' : (providerId === 'apisathi' ? 'sathi_key_sandbox_4412' : ''),
      apiSecret: providerId === 'messagecentral' ? 'mc_sec_sandbox_8892' : (providerId === 'apisathi' ? 'sathi_sec_sandbox_1192' : ''),
      clientCode: '',
      isConnected: false
    };

    const pr = existing?.productionConfig || {
      apiKey: '',
      apiSecret: '',
      clientCode: '',
      isConnected: false
    };

    setGstProviderConfigs(prev => ({
      ...prev,
      [providerId]: {
        sandboxConfig: sb,
        productionConfig: pr
      }
    }));

    const activeCreds = initialEnv === 'PRODUCTION' ? pr : sb;
    setGstApiKeyInput(activeCreds.apiKey || (existing?.apiKey || ''));
    setGstApiSecretInput(activeCreds.apiSecret || (existing?.apiSecret || ''));
    setGstClientCodeInput(activeCreds.clientCode || (existing?.clientCode || ''));
  };

  // Switch Environment in GST Modal (preserves separate state for Sandbox vs Production)
  const handleSwitchGstEnv = (newEnv: 'SANDBOX' | 'PRODUCTION') => {
    if (!selectedGstProvider) return;

    const currentConfigs = gstProviderConfigs[selectedGstProvider] || {};
    const sb = currentConfigs.sandboxConfig || { apiKey: '', apiSecret: '' };
    const pr = currentConfigs.productionConfig || { apiKey: '', apiSecret: '' };

    // Save inputs to previous environment before switching
    if (gstEnvInput === 'SANDBOX') {
      const updatedSb = { ...sb, apiKey: gstApiKeyInput, apiSecret: gstApiSecretInput, clientCode: gstClientCodeInput };
      setGstProviderConfigs(prev => ({
        ...prev,
        [selectedGstProvider]: { ...prev[selectedGstProvider], sandboxConfig: updatedSb }
      }));

      // Load Production
      setGstApiKeyInput(pr.apiKey || '');
      setGstApiSecretInput(pr.apiSecret || '');
      setGstClientCodeInput(pr.clientCode || '');
    } else {
      const updatedPr = { ...pr, apiKey: gstApiKeyInput, apiSecret: gstApiSecretInput, clientCode: gstClientCodeInput };
      setGstProviderConfigs(prev => ({
        ...prev,
        [selectedGstProvider]: { ...prev[selectedGstProvider], productionConfig: updatedPr }
      }));

      // Load Sandbox
      setGstApiKeyInput(sb.apiKey || '');
      setGstApiSecretInput(sb.apiSecret || '');
      setGstClientCodeInput(sb.clientCode || '');
    }

    setGstEnvInput(newEnv);
    setGstTestResult(null);
  };

  // Test GST Connection
  const handleTestGstConnection = async () => {
    if (!selectedGstProvider) return;
    setIsTestingGst(true);
    setGstTestResult(null);

    const currentConfigs = gstProviderConfigs[selectedGstProvider] || {};
    const activeSb = gstEnvInput === 'SANDBOX' ? { apiKey: gstApiKeyInput, apiSecret: gstApiSecretInput, clientCode: gstClientCodeInput } : currentConfigs.sandboxConfig;
    const activePr = gstEnvInput === 'PRODUCTION' ? { apiKey: gstApiKeyInput, apiSecret: gstApiSecretInput, clientCode: gstClientCodeInput } : currentConfigs.productionConfig;

    const creds: GSTCredentials = {
      apiKey: gstApiKeyInput,
      apiSecret: gstApiSecretInput,
      clientCode: gstClientCodeInput,
      environment: gstEnvInput,
      sandboxConfig: activeSb,
      productionConfig: activePr
    };

    let res = { success: false, message: 'Provider connector instance not found' };
    if (selectedGstProvider === 'messagecentral') res = await messageCentralProvider.testConnection(creds);
    else if (selectedGstProvider === 'apisathi') res = await apiSathiProvider.testConnection(creds);
    else if (selectedGstProvider === 'gstverify') res = await gstVerifyProvider.testConnection(creds);
    else if (selectedGstProvider === 'signcare') res = await signCareProvider.testConnection(creds);
    else if (selectedGstProvider === 'cashfree') res = await cashfreeProvider.testConnection(creds);

    setGstTestResult(res);
    setIsTestingGst(false);
  };

  // Save GST Provider
  const handleSaveGstConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGstProvider) return;

    if (!gstApiKeyInput.trim() || !gstApiSecretInput.trim()) {
      alert('⚠ API Key / Client ID and API Secret are required to save connector.');
      return;
    }

    if (gstEnvInput === 'PRODUCTION' && !gstProdConfirmed) {
      alert('⚠ Production Confirmation Required!\n\nPlease check the confirmation box acknowledging live production API usage before saving production credentials.');
      return;
    }

    const targetProv = gstProvidersList.find(p => p.id === selectedGstProvider);
    const dateStr = new Date().toISOString().split('T')[0];

    const currentConfigs = gstProviderConfigs[selectedGstProvider] || {};
    const updatedSb = gstEnvInput === 'SANDBOX'
      ? { apiKey: gstApiKeyInput, apiSecret: gstApiSecretInput, clientCode: gstClientCodeInput, isConnected: true, connectedAt: dateStr }
      : (currentConfigs.sandboxConfig || { apiKey: '', apiSecret: '' });

    const updatedPr = gstEnvInput === 'PRODUCTION'
      ? { apiKey: gstApiKeyInput, apiSecret: gstApiSecretInput, clientCode: gstClientCodeInput, isConnected: true, connectedAt: dateStr }
      : (currentConfigs.productionConfig || { apiKey: '', apiSecret: '' });

    const creds: GSTCredentials = {
      apiKey: gstApiKeyInput,
      apiSecret: gstApiSecretInput,
      clientCode: gstClientCodeInput,
      environment: gstEnvInput,
      isConnected: true,
      connectedAt: dateStr,
      sandboxConfig: updatedSb,
      productionConfig: updatedPr
    };

    saveGSTConnector(selectedGstProvider, creds);
    setSelectedGstProvider(null);
    alert(`✓ Saved ${targetProv?.name || 'GST Provider'} (${gstEnvInput === 'PRODUCTION' ? 'LIVE PRODUCTION' : 'SANDBOX / TEST'}) configuration successfully!`);
  };

  const shipmentProvidersList = [
    {
      id: 'bluedart' as const,
      name: 'Blue Dart Express',
      tagline: 'Pharma Cold-Chain & Air Express Delivery',
      desc: 'Official Blue Dart Express B2B Connector. Supports automatic AWB generation, pickup registration, location serviceability, and live shipment tracking.',
      icon: '🚛',
      capabilities: ['Air & Surface Express', 'Cold-Chain 2°C–8°C', 'Automated AWB Waybill', 'Live Tracking']
    },
    {
      id: 'delhivery' as const,
      name: 'Delhivery Logistics',
      tagline: 'Nationwide B2B Surface Logistics',
      desc: 'Delhivery Surface Logistics Connector for heavy pharma cargo and bulk sub-order fulfillment.',
      icon: '📦',
      capabilities: ['Surface Cargo B2B', 'Warehousing Fulfillment', 'Manifest Creation', 'AWB Dispatch']
    }
  ];

  const gstProvidersList = [
    { id: 'messagecentral', name: 'Message Central / eKYCNow', desc: 'Direct CDSCO & MCA corporate eKYC gateway for automated GSTIN & PAN cross-checks.', icon: '🛡' },
    { id: 'apisathi', name: 'API Sathi GST Verify', desc: 'Government licensed GST portal API verification engine for pharma distributors.', icon: '📜' },
    { id: 'gstverify', name: 'GSTVerify Direct API', desc: 'Real-time GST portal API for active status check and business address matching.', icon: '🔍' },
    { id: 'signcare', name: 'SignCare eKYC', desc: 'Aadhaar, PAN & GST digital verification platform for pharmaceutical buyers.', icon: '✍' },
    { id: 'cashfree', name: 'Cashfree Verification Suite', desc: 'Instant bank account, GSTIN & PAN verification suite for quick buyer onboarding.', icon: '💳' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* Top Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Server size={22} style={{ color: '#2563EB' }} /> API & Connector Integrations
          </h2>
          <p style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 0 0' }}>
            Manage external shipment couriers and GST business verification API services securely.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveCategory('SHIPMENT')}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', border: 'none',
              background: activeCategory === 'SHIPMENT' ? '#2563EB' : '#F1F5F9',
              color: activeCategory === 'SHIPMENT' ? '#FFF' : '#475569'
            }}
          >
            🚚 Shipment Providers ({Object.keys(shipmentConnectors).length})
          </button>
          <button
            onClick={() => setActiveCategory('GST')}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', border: 'none',
              background: activeCategory === 'GST' ? '#2563EB' : '#F1F5F9',
              color: activeCategory === 'GST' ? '#FFF' : '#475569'
            }}
          >
            🛡 GST / Verification ({Object.keys(gstConnectors).length})
          </button>
        </div>
      </div>

      {/* CATEGORY A: SHIPMENT PROVIDERS */}
      {activeCategory === 'SHIPMENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            A. Shipment & Logistics Connectors
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            {shipmentProvidersList.map(prov => {
              const conn = shipmentConnectors[prov.id];
              const isConnected = !!conn?.isConnected;

              return (
                <div key={prov.id} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: isConnected ? '#EFF6FF' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid #E2E8F0' }}>
                        {prov.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{prov.name}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{prov.tagline}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 800,
                        background: isConnected ? '#DCFCE7' : '#F1F5F9',
                        color: isConnected ? '#15803D' : '#64748B'
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isConnected ? '#16A34A' : '#94A3B8' }} />
                        {isConnected ? `${conn?.environment === 'PRODUCTION' ? 'Production' : 'Sandbox'}: Connected` : 'Not Connected'}
                      </span>
                      {prov.id === 'delhivery' && (conn?.sandboxConfig?.isConnected || conn?.productionConfig?.isConnected) && (
                        <div style={{ fontSize: 9.5, color: '#64748B', display: 'flex', gap: 6, fontWeight: 700 }}>
                          <span>SB: <strong style={{ color: conn?.sandboxConfig?.isConnected ? '#15803D' : '#94A3B8' }}>{conn?.sandboxConfig?.isConnected ? '✓ Active' : '⚪ Off'}</strong></span>
                          <span>PROD: <strong style={{ color: conn?.productionConfig?.isConnected ? '#B45309' : '#94A3B8' }}>{conn?.productionConfig?.isConnected ? '✓ Active' : '⚪ Off'}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: 11.5, color: '#475569', margin: 0, lineHeight: 1.5 }}>{prov.desc}</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {prov.capabilities.map((cap, idx) => (
                      <span key={idx} style={{ fontSize: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px 7px', borderRadius: 4, color: '#475569', fontWeight: 600 }}>
                        ✓ {cap}
                      </span>
                    ))}
                  </div>

                  {isConnected && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: 8, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div>Active Account: <strong>{conn.customerCode}</strong> ({conn.environment})</div>
                      <div>Connected On: <span style={{ color: '#64748B' }}>{conn.connectedAt}</span></div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                    {isConnected ? (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to disconnect ${prov.name}?`)) {
                            disconnectShipmentConnector(prov.id);
                          }
                        }}
                        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #FECDD3', background: '#FFF1F2', color: '#E11D48', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Disconnect
                      </button>
                    ) : <div />}
                    <button
                      onClick={() => handleOpenShipmentModal(prov.id)}
                      style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#FFF', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
                    >
                      {isConnected ? 'Configure Environments' : 'Connect Provider →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CATEGORY B: GST VERIFICATION PROVIDERS */}
      {activeCategory === 'GST' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            B. GST & Business Verification Providers
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {gstProvidersList.map(prov => {
              const conn = gstConnectors[prov.id];
              const isConnected = !!conn?.isConnected;

              return (
                <div key={prov.id} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 18, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: isConnected ? '#EFF6FF' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1px solid #E2E8F0' }}>
                        {prov.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{prov.name}</div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 800,
                          background: isConnected ? '#DCFCE7' : '#F1F5F9',
                          color: isConnected ? '#15803D' : '#64748B'
                        }}>
                          {isConnected ? `Connected (${conn?.environment})` : 'Not Connected'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: 11.5, color: '#475569', margin: 0, lineHeight: 1.4 }}>{prov.desc}</p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                    {isConnected && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to disconnect ${prov.name}?`)) {
                            disconnectGSTConnector(prov.id);
                          }
                        }}
                        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #FECDD3', background: '#FFF1F2', color: '#E11D48', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Disconnect
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenGstModal(prov.id)}
                      style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#FFF', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      {isConnected ? 'Configure API' : 'Connect GST →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: SHIPMENT PROVIDER CONFIGURATION */}
      {selectedShipmentProvider && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedShipmentProvider(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 22, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.3)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Truck size={22} style={{ color: '#2563EB' }} />
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Configure {selectedShipmentProvider === 'bluedart' ? 'Blue Dart Express' : 'Delhivery Logistics'}
                </h3>
              </div>
              <button onClick={() => setSelectedShipmentProvider(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveShipmentConnection} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Environment *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleSwitchShipmentEnv('SANDBOX')}
                    style={{
                      padding: '10px', borderRadius: 8,
                      border: shipmentEnvInput === 'SANDBOX' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      background: shipmentEnvInput === 'SANDBOX' ? '#EFF6FF' : '#FFF',
                      color: shipmentEnvInput === 'SANDBOX' ? '#1D4ED8' : '#475569',
                      fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                    }}
                  >
                    <span>🧪 Sandbox / Test API</span>
                    <span style={{ fontSize: 9.5, fontWeight: 600, color: '#64748B' }}>Isolated Staging Test Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchShipmentEnv('PRODUCTION')}
                    style={{
                      padding: '10px', borderRadius: 8,
                      border: shipmentEnvInput === 'PRODUCTION' ? '2px solid #D97706' : '1px solid #CBD5E1',
                      background: shipmentEnvInput === 'PRODUCTION' ? '#FEF3C7' : '#FFF',
                      color: shipmentEnvInput === 'PRODUCTION' ? '#B45309' : '#475569',
                      fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                    }}
                  >
                    <span>🚀 Live Production Gateway</span>
                    <span style={{ fontSize: 9.5, fontWeight: 600, color: '#64748B' }}>Live Account & Real Shipments</span>
                  </button>
                </div>
              </div>

              {/* Environment Indicator Banner */}
              {shipmentEnvInput === 'SANDBOX' ? (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 10, fontSize: 11.5, color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#2563EB', color: '#FFF', fontSize: 10 }}>SANDBOX / TEST MODE</span>
                    <span>Endpoint: <strong style={{ fontFamily: 'monospace' }}>{selectedShipmentProvider === 'delhivery' ? 'https://staging-express.delhivery.com' : 'https://sandbox-apigateway.bluedart.com'}</strong></span>
                  </div>
                  {selectedShipmentProvider === 'delhivery' && (
                    <span style={{ fontSize: 10, color: delhiverySandbox.isConnected ? '#15803D' : '#64748B', fontWeight: 700 }}>
                      {delhiverySandbox.isConnected ? '● Connected' : '⚪ Not Connected'}
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: 10, fontSize: 11.5, color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#D97706', color: '#FFF', fontSize: 10 }}>LIVE PRODUCTION</span>
                      <span>Endpoint: <strong style={{ fontFamily: 'monospace' }}>{selectedShipmentProvider === 'delhivery' ? 'https://track.delhivery.com' : 'https://apigateway.bluedart.com'}</strong></span>
                    </div>
                    {selectedShipmentProvider === 'delhivery' && (
                      <span style={{ fontSize: 10, color: delhiveryProduction.isConnected ? '#15803D' : '#64748B', fontWeight: 700 }}>
                        {delhiveryProduction.isConnected ? '● Connected' : '⚪ Not Connected'}
                      </span>
                    )}
                  </div>

                  <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 10, fontSize: 11.5, color: '#991B1B', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <AlertTriangle size={16} style={{ minWidth: 16, color: '#DC2626', marginTop: 1 }} />
                    <div>
                      <strong>⚠️ WARNING:</strong> Production mode uses the live {selectedShipmentProvider === 'delhivery' ? 'Delhivery' : 'Blue Dart'} account and may create real shipment transactions.
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  {selectedShipmentProvider === 'delhivery' ? 'Client / Business Account Code *' : 'Customer / Account Code *'}
                </label>
                <input
                  type="text"
                  required
                  value={customerCodeInput}
                  onChange={e => setCustomerCodeInput(e.target.value)}
                  placeholder={selectedShipmentProvider === 'delhivery' ? 'e.g. DEL88910-TEST' : 'e.g. BD998210'}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  {selectedShipmentProvider === 'delhivery' ? 'API Client Token / Authorization Key *' : 'Consumer Key / API Client ID *'}
                </label>
                <input
                  type="text"
                  required
                  value={consumerKeyInput}
                  onChange={e => setConsumerKeyInput(e.target.value)}
                  placeholder={selectedShipmentProvider === 'delhivery' ? 'e.g. del_key_sandbox_4412' : 'e.g. bd_key_live_...'}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  {selectedShipmentProvider === 'delhivery' ? 'Account Secret / Security Key *' : 'Consumer Secret / Private Key *'}
                </label>
                <input
                  type="password"
                  required
                  value={consumerSecretInput}
                  onChange={e => setConsumerSecretInput(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5 }}
                />
                <span style={{ fontSize: 10, color: '#64748B', display: 'block', marginTop: 3 }}>🔒 Secrets are stored securely and never logged or leaked to client code.</span>
              </div>

              {selectedShipmentProvider === 'delhivery' && shipmentEnvInput === 'PRODUCTION' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#0F172A', background: '#F8FAFC', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={prodConfirmed}
                    onChange={e => setProdConfirmed(e.target.checked)}
                  />
                  I confirm this is a live production Delhivery account and accept live transaction actions.
                </label>
              )}

              {shipmentTestResult && (
                <div style={{
                  padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: shipmentTestResult.success ? '#DCFCE7' : '#FEE2E2',
                  color: shipmentTestResult.success ? '#15803D' : '#991B1B',
                  border: shipmentTestResult.success ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                }}>
                  {shipmentTestResult.message}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={handleTestShipmentConnection}
                  disabled={isTestingShipment}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #94A3B8', background: '#F8FAFC', color: '#1E293B', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={13} className={isTestingShipment ? 'spin' : ''} />
                  {isTestingShipment ? 'Testing Gateway...' : `Test ${shipmentEnvInput} Connection`}
                </button>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setSelectedShipmentProvider(null)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: shipmentEnvInput === 'PRODUCTION' ? '#D97706' : '#2563EB', color: '#FFF', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Save & Connect →</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GST PROVIDER CONFIGURATION */}
      {selectedGstProvider && (() => {
        const targetProv = gstProvidersList.find(p => p.id === selectedGstProvider);
        const currentConfigs = gstProviderConfigs[selectedGstProvider] || {};
        const isSbConn = currentConfigs.sandboxConfig?.isConnected;
        const isPrConn = currentConfigs.productionConfig?.isConnected;

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedGstProvider(null)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 22, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.3)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={22} style={{ color: '#2563EB' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Configure {targetProv?.name || 'GST Verification Provider'}
                  </h3>
                </div>
                <button onClick={() => setSelectedGstProvider(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleSaveGstConnection} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Environment *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => handleSwitchGstEnv('SANDBOX')}
                      style={{
                        padding: '10px', borderRadius: 8,
                        border: gstEnvInput === 'SANDBOX' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                        background: gstEnvInput === 'SANDBOX' ? '#EFF6FF' : '#FFF',
                        color: gstEnvInput === 'SANDBOX' ? '#1D4ED8' : '#475569',
                        fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                      }}
                    >
                      <span>🧪 Sandbox / Test API</span>
                      <span style={{ fontSize: 9.5, fontWeight: 600, color: '#64748B' }}>Staging Verification Sandbox</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchGstEnv('PRODUCTION')}
                      style={{
                        padding: '10px', borderRadius: 8,
                        border: gstEnvInput === 'PRODUCTION' ? '2px solid #D97706' : '1px solid #CBD5E1',
                        background: gstEnvInput === 'PRODUCTION' ? '#FEF3C7' : '#FFF',
                        color: gstEnvInput === 'PRODUCTION' ? '#B45309' : '#475569',
                        fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                      }}
                    >
                      <span>🚀 Live Production Gateway</span>
                      <span style={{ fontSize: 9.5, fontWeight: 600, color: '#64748B' }}>Live Corporate eKYC API</span>
                    </button>
                  </div>
                </div>

                {/* Environment Indicator Banner */}
                {gstEnvInput === 'SANDBOX' ? (
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 10, fontSize: 11.5, color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#2563EB', color: '#FFF', fontSize: 10 }}>SANDBOX MODE</span>
                      <span>Staging Sandbox Gateway</span>
                    </div>
                    <span style={{ fontSize: 10, color: isSbConn ? '#15803D' : '#64748B', fontWeight: 700 }}>
                      {isSbConn ? '● Connected' : '⚪ Not Connected'}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: 10, fontSize: 11.5, color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#D97706', color: '#FFF', fontSize: 10 }}>LIVE PRODUCTION</span>
                        <span>Official eKYC Verification API</span>
                      </div>
                      <span style={{ fontSize: 10, color: isPrConn ? '#15803D' : '#64748B', fontWeight: 700 }}>
                        {isPrConn ? '● Connected' : '⚪ Not Connected'}
                      </span>
                    </div>

                    <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 10, fontSize: 11.5, color: '#991B1B', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <AlertTriangle size={16} style={{ minWidth: 16, color: '#DC2626', marginTop: 1 }} />
                      <div>
                        <strong>⚠️ WARNING:</strong> Live Production mode uses real business verification credits and APIs.
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>API Key / Client ID *</label>
                  <input
                    type="text"
                    required
                    value={gstApiKeyInput}
                    onChange={e => setGstApiKeyInput(e.target.value)}
                    placeholder="e.g. key_live_88921"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>API Secret / Client Secret *</label>
                  <input
                    type="password"
                    required
                    value={gstApiSecretInput}
                    onChange={e => setGstApiSecretInput(e.target.value)}
                    placeholder="••••••••••••••••••••"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5 }}
                  />
                  <span style={{ fontSize: 10, color: '#64748B', display: 'block', marginTop: 3 }}>🔒 Secrets are stored securely and never logged or leaked to client code.</span>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Client Code / Business ID (Optional)</label>
                  <input
                    type="text"
                    value={gstClientCodeInput}
                    onChange={e => setGstClientCodeInput(e.target.value)}
                    placeholder="e.g. ORG-PHARMA-101"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, fontFamily: 'monospace' }}
                  />
                </div>

                {gstEnvInput === 'PRODUCTION' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#0F172A', background: '#F8FAFC', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={gstProdConfirmed}
                      onChange={e => setGstProdConfirmed(e.target.checked)}
                    />
                    I confirm this is a live production API account and accept live transaction actions.
                  </label>
                )}

                {gstTestResult && (
                  <div style={{
                    padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: gstTestResult.success ? '#DCFCE7' : '#FEE2E2',
                    color: gstTestResult.success ? '#15803D' : '#991B1B',
                    border: gstTestResult.success ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                  }}>
                    {gstTestResult.message}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                  <button
                    type="button"
                    onClick={handleTestGstConnection}
                    disabled={isTestingGst}
                    style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #94A3B8', background: '#F8FAFC', color: '#1E293B', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <RefreshCw size={13} className={isTestingGst ? 'spin' : ''} />
                    {isTestingGst ? 'Testing Engine...' : `Test ${gstEnvInput} Connection`}
                  </button>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setSelectedGstProvider(null)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: gstEnvInput === 'PRODUCTION' ? '#D97706' : '#2563EB', color: '#FFF', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Save & Connect →</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

import { IntegrationsSettingsModule } from '../components/modules/IntegrationsSettingsModule';
import { BuyerSecuritySettingsModule } from '../components/modules/BuyerSecuritySettingsModule';
import { AdminRfqMonitor } from '../components/modules/AdminRfqMonitor';
import { AdminQuoteMonitor } from '../components/modules/AdminQuoteMonitor';
import { AdminOrderMonitor } from '../components/modules/AdminOrderMonitor';
import { AdminComplianceVerification } from '../components/modules/AdminComplianceVerification';
import { AdminManufacturerVerification } from '../components/modules/AdminManufacturerVerification';
import { AdminTrademarkVerification } from '../components/modules/AdminTrademarkVerification';
import { AdminBrandVerification } from '../components/modules/AdminBrandVerification';
import { AdminComplianceVerificationMonitor } from '../components/modules/AdminComplianceVerificationMonitor';
import { AdminManufacturerVerificationMonitor } from '../components/modules/AdminManufacturerVerificationMonitor';
import { AdminTrademarkVerificationMonitor } from '../components/modules/AdminTrademarkVerificationMonitor';
import { AdminBrandVerificationMonitor } from '../components/modules/AdminBrandVerificationMonitor';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Factory, Package, FileText, Tag, Award,
  ShoppingBag, Receipt, ShieldAlert, ShieldCheck, BarChart3, Bell, Settings,
  Search, ChevronDown, ChevronRight, Home, Menu, X, Sun, Moon, Sparkles, Command,
  ChevronLeft, PanelLeftClose, PanelLeftOpen, Pin, Clock, Star, LogOut, Cpu, Truck, Landmark, UserCheck, PieChart, FileCheck, Key, Activity, Layers, Percent, RotateCcw
} from 'lucide-react';
import { CategoryMasterModule } from '../components/modules/CategoryMasterModule';
import { MarginEngineModule } from '../components/modules/MarginEngineModule';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';

import { CommandPalette } from '../components/common/CommandPalette';
import { AICopilotDrawer } from '../components/common/AICopilotDrawer';
import { RoleSwitcherDropdown } from '../components/common/RoleSwitcherDropdown';
import { LogoMark } from '../components/common/LogoMark';

import { Dashboards } from '../components/modules/Dashboards';
import { CustomerModule } from '../components/modules/CustomerModule';
import { ManufacturerModule } from '../components/modules/ManufacturerModule';
import { ProductCatalogModule } from '../components/modules/ProductCatalogModule';
import { RFQModule } from '../components/modules/RFQModule';
import { QuoteModule } from '../components/modules/QuoteModule';
import { OrderModule } from '../components/modules/OrderModule';
import { InvoiceModule } from '../components/modules/InvoiceModule';
import { ComplianceModule } from '../components/modules/ComplianceModule';
import { AnalyticsModule } from '../components/modules/AnalyticsModule';
import { NotificationsModule } from '../components/modules/NotificationsModule';
import { SettingsModule } from '../components/modules/SettingsModule';
import { BuyerOnboardingWizard } from '../components/modules/BuyerOnboardingWizard';
import { ManufacturerOnboardingWizard } from '../components/modules/ManufacturerOnboardingWizard';
import { ShipmentModule } from '../components/modules/ShipmentModule';
import { BuyerOrderTrackingModule } from '../components/modules/BuyerOrderTrackingModule';
import { AccountsModule } from '../components/modules/AccountsModule';
import { ReportsModule } from '../components/modules/ReportsModule';
import { ManufacturerWorkspaceModule } from '../components/modules/ManufacturerWorkspaceModule';
import { SalesQualificationModule } from '../components/modules/SalesQualificationModule';
import { AdminApprovalModule } from '../components/modules/AdminApprovalModule';
import { BuyerWorkspaceModule } from '../components/modules/BuyerWorkspaceModule';
import { BuyerProductCatalogModule } from '../components/modules/BuyerProductCatalogModule';
import { ProductionExecutionModule } from '../components/modules/ProductionExecutionModule';
import { CustomerVerificationModule } from '../components/modules/CustomerVerificationModule';
import { ManufacturerVerificationModule } from '../components/modules/ManufacturerVerificationModule';
import { TrademarkVerificationModule } from '../components/modules/TrademarkVerificationModule';
import { BrandVerificationModule } from '../components/modules/BrandVerificationModule';
import { ManufacturerDashboardModule } from '../components/modules/ManufacturerDashboardModule';
import { ProfileModule } from '../components/modules/ProfileModule';
import { RaiseQaModal } from '../components/modules/RaiseQaModal';
import { FactoryBuddyCommunicationDesk } from '../components/modules/FactoryBuddyCommunicationDesk';
import { AccountMenuPopover } from '../components/common/AccountMenuPopover';
import { ManufacturerOrderHistoryModule } from '../components/modules/ManufacturerOrderHistoryModule';
import { ManufacturerSettingsModule } from '../components/modules/ManufacturerSettingsModule';

export interface ManufacturerNavGroup {
  key: string;
  label: string;
  defaultExpanded: boolean;
  items: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }>;
}

export const MANUFACTURER_NAV_GROUPS: ManufacturerNavGroup[] = [
  {
    key: 'FACTORYGRID',
    label: 'FACTORYGRID',
    defaultExpanded: true,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'products', label: 'My Product Catalog', icon: Package },
    ],
  },
  {
    key: 'PROCUREMENT',
    label: 'PROCUREMENT',
    defaultExpanded: true,
    items: [
      { id: 'rfqs', label: 'Assigned RFQs', icon: FileText, badge: 'rfq' },
      { id: 'quotes', label: 'Quote Submissions', icon: Tag },
    ],
  },
  {
    key: 'ORDERS',
    label: 'ORDERS',
    defaultExpanded: true,
    items: [
      { id: 'orders', label: 'Order Management', icon: ShoppingBag, badge: 'order' },
      { id: 'mfg-order-history', label: 'Order History', icon: Clock },
    ],
  },
  {
    key: 'FULFILLMENT',
    label: 'FULFILLMENT',
    defaultExpanded: true,
    items: [
      { id: 'production-planning', label: 'Production Planning', icon: Cpu },
      { id: 'shipments', label: 'Dispatch & Tracking', icon: Truck },
    ],
  },
  {
    key: 'FINANCE',
    label: 'FINANCE',
    defaultExpanded: true,
    items: [
      { id: 'invoices', label: 'Invoices & Payments', icon: Receipt },
    ],
  },
  {
    key: 'PROFILE',
    label: 'PROFILE',
    defaultExpanded: true,
    items: [
      { id: 'profile-personal', label: 'My Profile', icon: Users },
      { id: 'profile-organization', label: 'Organization Profile', icon: Factory },
      { id: 'profile-documents', label: 'Documents & Verification', icon: FileCheck },
    ],
  },
  {
    key: 'SETTINGS',
    label: 'SETTINGS',
    defaultExpanded: true,
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: 'notif' },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export interface BuyerNavGroup {
  key: string;
  label: string;
  defaultExpanded: boolean;
  items: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }>;
}

export const BUYER_NAV_GROUPS: BuyerNavGroup[] = [
  {
    key: 'FACTORYGRID',
    label: 'FACTORYGRID',
    defaultExpanded: true,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    key: 'PROCUREMENT',
    label: 'PROCUREMENT',
    defaultExpanded: true,
    items: [
      { id: 'manufacturers', label: 'Verified Manufacturers', icon: Factory },
      { id: 'buyer-catalog', label: 'Product Catalog', icon: Package },
      { id: 'rfqs', label: 'RFQ Center', icon: FileText, badge: 'rfq' },
      { id: 'quotes', label: 'Quote Comparison', icon: Tag },
    ],
  },
  {
    key: 'ORDERS',
    label: 'ORDERS',
    defaultExpanded: true,
    items: [
      { id: 'orders', label: 'Order Management', icon: ShoppingBag, badge: 'order' },
      { id: 'my-orders', label: 'Order History', icon: Clock },
    ],
  },
  {
    key: 'FULFILLMENT',
    label: 'FULFILLMENT',
    defaultExpanded: true,
    items: [
      { id: 'buyer-tracking', label: 'Live Order Tracking', icon: FileCheck },
    ],
  },
  {
    key: 'FINANCE',
    label: 'FINANCE',
    defaultExpanded: true,
    items: [
      { id: 'invoices', label: 'Invoices & Payments', icon: Receipt },
    ],
  },
  {
    key: 'PROFILE',
    label: 'PROFILE',
    defaultExpanded: true,
    items: [
      { id: 'profile-personal', label: 'My Profile', icon: Users },
      { id: 'profile-organization', label: 'Organization Profile', icon: Factory },
      { id: 'profile-documents', label: 'Documents & Verification', icon: FileCheck },
    ],
  },
  {
    key: 'SETTINGS',
    label: 'SETTINGS & SUPPORT',
    defaultExpanded: true,
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: 'notif' },
      { id: 'qa-support', label: 'Contact Factory Buddy', icon: FileCheck },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

const navGroups = [
  {
    label: 'MONITORING',
    items: [
      { id: 'dashboard', label: 'Monitoring Dashboard', icon: LayoutDashboard, roles: ['BUYER', 'COMPLIANCE_OFFICER', 'ADMIN', 'SALES_MANAGER', 'ACCOUNTS_MANAGER'] },
      { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3, roles: ['BUYER', 'ADMIN', 'SALES_MANAGER', 'ACCOUNTS_MANAGER', 'SUPPLIER'] },
    ],
  },
  {
    label: 'PROCUREMENT MONITORING',
    items: [
      { id: 'rfqs', label: 'RFQ Monitor', icon: FileText, badge: 'rfq', roles: ['BUYER', 'SALES_MANAGER', 'ADMIN'] },
      { id: 'quotes', label: 'Quote Monitor', icon: Tag, roles: ['BUYER', 'ADMIN'] },
      { id: 'orders', label: 'Master Orders & PO Monitor', icon: ShoppingBag, badge: 'order', roles: ['BUYER', 'ADMIN'] },
    ],
  },
  {
    label: 'CATALOG & MARGIN MANAGEMENT',
    items: [
      { id: 'category-master', label: 'Category Master', icon: Layers, roles: ['ADMIN'] },
      { id: 'margin-engine', label: 'Margin Engine', icon: Percent, roles: ['ADMIN'] },
      { id: 'products', label: 'Product Catalog Master', icon: Package, roles: ['ADMIN'] },
    ],
  },
  {
    label: 'COMPLIANCE & VERIFICATION',
    items: [
      { id: 'compliance-verification', label: 'Customer Verification', icon: UserCheck, badge: 'compliance', roles: ['COMPLIANCE_OFFICER', 'ADMIN'] },
      { id: 'manufacturer-verification', label: 'Manufacturer Verification', icon: Factory, roles: ['COMPLIANCE_OFFICER', 'ADMIN'] },
      { id: 'trademark-verification', label: 'Trademark Verification', icon: Award, roles: ['COMPLIANCE_OFFICER', 'ADMIN'] },
      { id: 'brand-verification', label: 'Brand Verification', icon: Tag, roles: ['COMPLIANCE_OFFICER', 'ADMIN'] },
    ],
  },
  {
    label: 'FINANCE MONITORING',
    items: [
      { id: 'invoices', label: 'Invoice Monitor', icon: Receipt, roles: ['BUYER', 'ACCOUNTS_MANAGER', 'ADMIN'] },
      { id: 'accounts', label: 'Payments & AR', icon: Landmark, roles: ['ACCOUNTS_MANAGER', 'ADMIN'] },
    ],
  },
  {
    label: 'SYSTEM ADMINISTRATION',
    items: [
      { id: 'reports', label: 'Audit Logs', icon: FileCheck, roles: ['ADMIN', 'SALES_MANAGER', 'ACCOUNTS_MANAGER'] },
      { id: 'admin-approval', label: 'System Health', icon: Activity, roles: ['ADMIN'] },
      { id: 'shipment-api', label: 'Shipment API', icon: Truck, roles: ['ADMIN'] },
      { id: 'settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
    ],
  },
];

const roleAvatarColors: Record<UserRole, string> = {
  BUYER: '#2563EB',
  SUPPLIER: '#0D9488',
  COMPLIANCE_OFFICER: '#D97706',
  ADMIN: '#4F46E5',
  SALES_MANAGER: '#059669',
  ACCOUNTS_MANAGER: '#B45309',
  FACTORY_BUDDY: '#0284C7',
};

// React Error Boundary Class Component for Workspace Safety
class WorkspaceErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WorkspaceErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 32, margin: '20px auto', maxWidth: 600, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={24} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Something went wrong while loading this workspace.
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0, maxWidth: 450 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred in this module.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
          >
            Reload Workspace
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onNavigate }) => {
  const { currentRole, setCurrentRole, activeTab, setActiveTab, complianceCases, rfqs, orders, notifications, isCreateRfqDrawerOpen, customerVerifications, logout, userProfile, orgProfile, openProfileTab, manufacturers, activeBuyerAccount, setActiveBuyerAccount, resetDemoState } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [cmdOpen, setCmdOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const savedRole = localStorage.getItem('fg_role') as UserRole;
      const activeRole = savedRole || currentRole;

      if ((path === '/compliance' || path.startsWith('/compliance')) && currentRole !== 'COMPLIANCE_OFFICER') {
        setCurrentRole('COMPLIANCE_OFFICER');
      } else if ((path === '/sales' || path.startsWith('/sales')) && currentRole !== 'SALES_MANAGER') {
        setCurrentRole('SALES_MANAGER');
      } else if ((path === '/accounts' || path.startsWith('/accounts')) && currentRole !== 'ACCOUNTS_MANAGER') {
        setCurrentRole('ACCOUNTS_MANAGER');
      } else if ((path === '/admin' || path.startsWith('/admin')) && currentRole !== 'ADMIN') {
        setCurrentRole('ADMIN');
      } else if ((path === '/supplier' || path.startsWith('/supplier')) && currentRole !== 'SUPPLIER') {
        setCurrentRole('SUPPLIER');
      } else if ((path === '/buyer' || path.startsWith('/buyer')) && currentRole !== 'BUYER') {
        if (!['COMPLIANCE_OFFICER', 'SALES_MANAGER', 'ACCOUNTS_MANAGER', 'ADMIN', 'SUPPLIER'].includes(activeRole)) {
          setCurrentRole('BUYER');
        }
      }

      if (path.includes('category-master') || path.includes('subcategories')) {
        setActiveTab('category-master');
      }
      if (path === '/buyer/product-catalog' || path.startsWith('/buyer/product-catalog') ||
          path === '/buyer/catalog' || path.startsWith('/buyer/catalog')) {
        setCurrentRole('BUYER');
        setActiveTab('buyer-catalog');
      }
    }
  }, []);

  const pendingCompliance = (complianceCases || []).filter(c => c && c.status === 'UNDER_REVIEW').length;
  const pendingCustomerVerifications = (customerVerifications || []).filter(c => c && (c.verificationStatus === 'Under Review' || c.verificationStatus === 'Pending')).length;
  const activeRfqs = (rfqs || []).filter(r => r && (r.status === 'PRICING_IN_PROGRESS' || r.status === 'Pricing In Progress' || r.status === 'SUBMITTED')).length;
  const activeOrders = (orders || []).filter(o => o && (o.status === 'IN_PRODUCTION' || o.status === 'OPEN' || o.status === 'APPROVED')).length;
  const unreadNotifs = (notifications || []).filter(n => n && !n.read).length;

  const getBadgeCount = (badge: string | undefined) => {
    if (badge === 'rfq') return activeRfqs;
    if (badge === 'compliance') return pendingCompliance;
    if (badge === 'customer-verification') return pendingCustomerVerifications;
    if (badge === 'order') {
      if (currentRole === 'SUPPLIER' || currentRole === 'MANUFACTURER') {
        const myMfgId = (manufacturers && manufacturers[0]?.id) || 'm1';
        let subOrdersCount = 0;

        (orders || []).forEach(mo => {
          if (mo.subOrders && mo.subOrders.length > 0) {
            mo.subOrders.forEach(so => {
              const isMyMfg = so.manufacturerId === myMfgId || (so as any).mfgId === myMfgId || (so.manufacturerName && so.manufacturerName.toLowerCase().includes('sunbio')) || ((so as any).mfgName && (so as any).mfgName.toLowerCase().includes('sunbio'));
              const isClosed = so.status === 'DELIVERED' || so.status === 'CLOSED' || (so as any).status === 'Rejected';
              if (isMyMfg && !isClosed) {
                subOrdersCount++;
              }
            });
          }
        });

        return subOrdersCount > 0 ? subOrdersCount : 2;
      }
      return activeOrders;
    }
    if (badge === 'notif') return unreadNotifs;
    return 0;
  };

  // Manufacturer Section Group Expansion State
  const [mfgGroupExpanded, setMfgGroupExpanded] = useState<Record<string, boolean>>({
    FACTORYGRID: true,
    PROCUREMENT: true,
    ORDERS: true,
    FULFILLMENT: true,
    FINANCE: true,
    PROFILE: true,
    SETTINGS: true,
  });

  // Auto-expand mfg group containing activeTab if currently collapsed
  useEffect(() => {
    if (currentRole === 'SUPPLIER' && activeTab) {
      // 'profile' tab maps to the PROFILE group (profile-* items call openProfileTab which sets activeTab='profile')
      const effectiveId = activeTab === 'profile' ? 'profile-personal' : activeTab;
      const parentGroup = MANUFACTURER_NAV_GROUPS.find(group =>
        group.items.some(item => item.id === effectiveId || item.id === activeTab)
      );
      if (parentGroup && !mfgGroupExpanded[parentGroup.key]) {
        setMfgGroupExpanded(prev => ({
          ...prev,
          [parentGroup.key]: true
        }));
      }
    }
  }, [activeTab, currentRole]);

  const toggleMfgGroup = (groupKey: string) => {
    setMfgGroupExpanded(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Buyer Section Group Expansion State
  const [buyerGroupExpanded, setBuyerGroupExpanded] = useState<Record<string, boolean>>({
    FACTORYGRID: true,
    PROCUREMENT: true,
    ORDERS: true,
    FULFILLMENT: true,
    FINANCE: true,
    PROFILE: true,
    SETTINGS: true,
  });

  // Auto-redirect Buyer away from old 'shipments' tab to 'buyer-tracking'
  useEffect(() => {
    if (currentRole === 'BUYER' && activeTab === 'shipments') {
      setActiveTab('buyer-tracking');
    }
    // Product Catalog belongs to Manufacturer only — redirect Buyer away
    if (currentRole === 'BUYER' && activeTab === 'products') {
      setActiveTab('dashboard');
    }
  }, [activeTab, currentRole, setActiveTab]);

  // Auto-expand buyer group containing activeTab if currently collapsed
  useEffect(() => {
    if (currentRole === 'BUYER' && activeTab) {
      const parentGroup = BUYER_NAV_GROUPS.find(group =>
        group.items.some(item => item.id === activeTab)
      );
      if (parentGroup && !buyerGroupExpanded[parentGroup.key]) {
        setBuyerGroupExpanded(prev => ({
          ...prev,
          [parentGroup.key]: true
        }));
      }
    }
  }, [activeTab, currentRole]);

  const toggleBuyerGroup = (groupKey: string) => {
    setBuyerGroupExpanded(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Track which profile sub-item was last clicked for active-state highlighting
  const [lastProfileItem, setLastProfileItem] = useState<string>('profile-personal');

  // Compute whether a nav item should be highlighted as active
  const isNavItemActive = (itemId: string): boolean => {
    if (itemId === 'profile-personal' || itemId === 'profile-organization' || itemId === 'profile-documents') {
      return activeTab === 'profile' && lastProfileItem === itemId;
    }
    return activeTab === itemId;
  };

  const handleTabClick = (tabId: string) => {
    // Profile sub-items: route to ProfileModule with the correct sub-tab
    if (tabId === 'profile-personal') {
      setLastProfileItem('profile-personal');
      openProfileTab('personal');
    } else if (tabId === 'profile-organization') {
      setLastProfileItem('profile-organization');
      openProfileTab('organization');
    } else if (tabId === 'profile-documents') {
      setLastProfileItem('profile-documents');
      openProfileTab('documents');
    } else {
      setActiveTab(tabId);
      if (tabId === 'category-master') {
        if (typeof window !== 'undefined' && window.location.pathname !== '/admin/category-master') {
          window.history.pushState({}, '', '/admin/category-master');
        }
      } else if (tabId === 'buyer-catalog' || tabId === 'buyer-product-catalog') {
        if (typeof window !== 'undefined' && window.location.pathname !== '/buyer/product-catalog') {
          window.history.pushState({}, '', '/buyer/product-catalog');
        }
      }
    }
    if (isMobile) setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return currentRole === 'BUYER' ? <BuyerWorkspaceModule /> : currentRole === 'SUPPLIER' ? <ManufacturerDashboardModule /> : currentRole === 'COMPLIANCE_OFFICER' ? <CustomerVerificationModule /> : <Dashboards />;
      case 'profile':
      case 'profile-personal':
      case 'profile-organization':
      case 'profile-documents': return <ProfileModule />;
      case 'buyer-workspace': return <BuyerWorkspaceModule />;
      case 'buyer-catalog':
      case 'buyer-product-catalog': return <BuyerProductCatalogModule onNavigateTab={handleTabClick} />;
      case 'buyer-onboarding': return <BuyerOnboardingWizard />;
      case 'mfg-onboarding': return <ManufacturerOnboardingWizard />;
      case 'mfg-workspace': return <ManufacturerWorkspaceModule />;
      case 'production-planning': return <ProductionExecutionModule onNavigateTab={handleTabClick} />;
      case 'sales-qualification': return <SalesQualificationModule />;
      case 'customers': return <CustomerModule />;
      case 'manufacturers': return <ManufacturerModule />;
      case 'category-master': return <CategoryMasterModule />;
      case 'margin-engine': return <MarginEngineModule />;
      case 'products': return <ProductCatalogModule />;
      case 'rfqs': return currentRole === 'ADMIN' ? <AdminRfqMonitor /> : <RFQModule />;
      case 'quotes': return currentRole === 'ADMIN' ? <AdminQuoteMonitor /> : <QuoteModule />;
      case 'orders': return currentRole === 'ADMIN' ? <AdminOrderMonitor /> : <OrderModule />;
      case 'sub-orders': return <OrderModule />;
      case 'mfg-order-history': return <ManufacturerOrderHistoryModule onNavigateTab={handleTabClick} />;
      case 'my-orders': return <BuyerOrderTrackingModule initialViewMode="ORDERS_LIST" />;
      case 'shipments': return currentRole === 'BUYER' ? <BuyerOrderTrackingModule initialViewMode="TRACKING_DETAIL" /> : <ShipmentModule onNavigateTab={handleTabClick} />;
      case 'goods-received': return currentRole === 'SUPPLIER' ? <ShipmentModule onNavigateTab={handleTabClick} /> : <BuyerOrderTrackingModule initialViewMode="ORDERS_LIST" />;
      case 'buyer-tracking': return <BuyerOrderTrackingModule initialViewMode="TRACKING_DETAIL" />;
      case 'invoices': return <InvoiceModule />;
      case 'accounts': return <AccountsModule />;
      case 'compliance-verification':
      case 'customer-verification': return <CustomerVerificationModule />;
      case 'manufacturer-verification': return <ManufacturerVerificationModule />;
      case 'trademark-verification': return <TrademarkVerificationModule />;
      case 'brand-verification': return <BrandVerificationModule />;
      case 'compliance': return <ComplianceModule />;
      case 'reports': return <ReportsModule />;
      case 'analytics': return <AnalyticsModule />;
      case 'notifications': return <NotificationsModule />;
      case 'settings':
        if (currentRole === 'SUPPLIER') {
          return <ManufacturerSettingsModule />;
        }
        if (currentRole === 'BUYER') {
          return <ProfileModule />;
        }
        return <SettingsModule />;
      case 'admin-approval': return <AdminApprovalModule />;
      case 'shipment-api': return <IntegrationsSettingsModule initialCategory="GST" />;
      case 'qa-support':
      case 'support':
        return <FactoryBuddyCommunicationDesk />;
      default: return <Dashboards />;
    }
  };

  // AI Copilot Chat State
  const [copilotMessages, setCopilotMessages] = useState<Array<{ id: string; sender: 'user' | 'assistant'; text: string; time: string }>>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your FactoryGrid AI Copilot. I can analyze RFQ risks, check WHO-GMP compliance, calculate procurement savings, and draft formulation specs. How can I assist your team today?',
      time: 'Just now'
    }
  ]);
  const [copilotInput, setCopilotInput] = useState<string>('');
  const [isCopilotThinking, setIsCopilotThinking] = useState<boolean>(false);

  const getAIResponseText = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('rfq') || q.includes('bid') || q.includes('risk')) {
      return "📊 **Sealed RFQ Risk Analysis:**\n\n- **Pricing Spread:** Lowest bid is ₹1,420/kg (SunBio Labs), 12% below market average.\n- **Delivery SLA:** 14-day SLA with 2°C–8°C cold-chain IoT telemetry monitoring.\n- **WHO-GMP Status:** 100% verified CDSCO license (ML-HP-2024-001).\n- **Recommendation:** Proceed to award split allocation to SunBio Labs & CiplaFormulations for supply chain redundancy.";
    } else if (q.includes('compliance') || q.includes('regulatory') || q.includes('drug')) {
      return "🛡️ **Regulatory Compliance Audit Report:**\n\n- **CDSCO Manufacturing License:** Valid thru Nov 2028 (SunBio Labs Unit II).\n- **WHO-GMP Certification:** Active (Certificate No: WHO-GMP-2025-8891).\n- **Batch Quality (COA):** 100% pharmacopeial compliance across active batches.\n- **Compliance Risk Level:** **LOW** (No critical inspection observations found).";
    } else if (q.includes('saving') || q.includes('calculate') || q.includes('cost') || q.includes('price')) {
      return "💰 **Procurement Savings Optimization:**\n\n- **Single-Supplier Baseline:** ₹28,50,000 for full volume.\n- **Dual-Plant Allocation Cost:** ₹25,20,000 via optimized volume splitting.\n- **Net Cost Reduction:** **₹3,30,000 (11.5% Savings)**\n- **GST Impact:** 18% Input Tax Credit (ITC) claimable on inter-state dispatch.";
    } else if (q.includes('draft') || q.includes('spec') || q.includes('formulation')) {
      return "📑 **Draft Formulation Specification (IP/BP/USP):**\n\n- **Active Pharmaceutical Ingredient (API):** Paracetamol IP 500mg\n- **Excipients:** Starch IP, Microcrystalline Cellulose USP, Magnesium Stearate BP\n- **Dosage Form:** Uncoated Tablets\n- **Packaging:** 10 x 10 Blister Pack (Alu-PVC)\n- **Shelf Life:** 36 Months from Manufacturing";
    }
    return `🤖 **FactoryGrid B2B Copilot Insights for:** *"${query}"*\n\nBased on real-time platform data across 2,840 verified pharmaceutical manufacturers:\n\n1. **Supplier Availability:** 4 active WHO-GMP manufacturing units ready for immediate production.\n2. **Lead Time:** 10-14 business days with cold-chain tracking.\n3. **Compliance Status:** All matched suppliers hold active CDSCO licenses.\n\nLet me know if you would like me to generate a detailed quote breakdown or RFQ draft!`;
  };

  const handleSendCopilotQuery = (userQueryText?: string) => {
    const textToSend = (userQueryText || copilotInput).trim();
    if (!textToSend) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCopilotMessages(prev => [...prev, userMsg]);
    if (!userQueryText) setCopilotInput('');
    setIsCopilotThinking(true);

    setTimeout(() => {
      const responseText = getAIResponseText(textToSend);
      const aiMsg = {
        id: 'msg-ai-' + Date.now(),
        sender: 'assistant' as const,
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setCopilotMessages(prev => [...prev, aiMsg]);
      setIsCopilotThinking(false);
    }, 600);
  };

  return (
    <div style={{
      display: isMobile ? 'flex' : 'grid',
      flexDirection: isMobile ? 'column' : undefined,
      gridTemplateColumns: isMobile ? undefined : (sidebarCollapsed ? '72px 1fr' : '260px 1fr'),
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-app)',
      transition: 'grid-template-columns 200ms ease'
    }}>
      {/* Command Palette Modal */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} onSelectAction={tab => handleTabClick(tab)} />

      {/* AI Copilot Side Drawer */}
      <AICopilotDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      {/* Mobile Backdrop Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 998,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)'
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside style={{
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        transition: 'transform 250ms ease, width 200ms ease',
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        zIndex: isMobile ? 999 : 1,
        width: isMobile ? '280px' : undefined,
        transform: isMobile ? (mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        boxShadow: isMobile && mobileMenuOpen ? '8px 0 24px rgba(0,0,0,0.3)' : 'none'
      }}>
        {/* Sidebar Brand Header */}
        <div style={{ padding: (sidebarCollapsed && !isMobile) ? '16px 12px' : '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => onNavigate('landing')}>
            <div style={{ padding: 4, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LogoMark size={24} color="#FFFFFF" />
            </div>
            {(!sidebarCollapsed || isMobile) && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>FactoryGrid</div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>Enterprise B2B</div>
              </div>
            )}
          </div>
          {isMobile ? (
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
            >
              <X size={20} />
            </button>
          ) : (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 4 }}
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          )}
        </div>

        {/* Sidebar Navigation Items */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {currentRole === 'SUPPLIER' ? (
            MANUFACTURER_NAV_GROUPS.map(group => {
              const isExpanded = mfgGroupExpanded[group.key] ?? group.defaultExpanded;
              const hasActiveChild = group.items.some(item => isNavItemActive(item.id));
              const hasPendingBadge = group.items.some(item => getBadgeCount(item.badge) > 0);

              return (
                <div key={group.key} style={{ marginBottom: 12 }}>
                  {/* Section Group Header */}
                  {(!sidebarCollapsed || isMobile) ? (
                    <div
                      onClick={() => toggleMfgGroup(group.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '6px 12px',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: hasActiveChild ? '#14B8A6' : 'rgba(255,255,255,0.45)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        borderRadius: 4,
                        transition: 'all 120ms ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
                      onMouseLeave={e => e.currentTarget.style.color = hasActiveChild ? '#14B8A6' : 'rgba(255,255,255,0.45)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{group.label}</span>
                        {!isExpanded && hasPendingBadge && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#14B8A6' }} />
                        )}
                      </div>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  ) : (
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
                  )}

                  {/* Group Nav Items (shown when group is expanded OR sidebar is in collapsed icon mode) */}
                  {(isExpanded || (sidebarCollapsed && !isMobile)) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                      {group.items.map(item => {
                        const Icon = item.icon;
                        const count = getBadgeCount(item.badge);
                        const isActive = isNavItemActive(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            title={(sidebarCollapsed && !isMobile) ? item.label : undefined}
                            style={{
                              border: 'none',
                              width: '100%',
                              background: isActive ? 'rgba(20, 184, 166, 0.12)' : 'transparent',
                              borderLeft: isActive ? '3px solid #14B8A6' : '3px solid transparent',
                              color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                              fontWeight: isActive ? 700 : 500,
                              fontSize: 13,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: (sidebarCollapsed && !isMobile) ? '10px' : '8px 12px 8px 16px',
                              justify: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
                              borderRadius: '0 6px 6px 0',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 120ms ease',
                              position: 'relative'
                            }}
                            onMouseEnter={e => {
                              if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={e => {
                              if (!isActive) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <Icon size={16} style={{ flexShrink: 0, color: isActive ? '#14B8A6' : 'rgba(255,255,255,0.5)' }} />
                            {(!sidebarCollapsed || isMobile) && <span style={{ flex: 1 }}>{item.label}</span>}
                            {count > 0 && (
                              <span style={{
                                fontSize: 10, fontWeight: 800,
                                color: '#FFFFFF', background: '#14B8A6',
                                padding: '1px 6px', borderRadius: 999,
                                position: (sidebarCollapsed && !isMobile) ? 'absolute' : 'static',
                                top: (sidebarCollapsed && !isMobile) ? 4 : undefined,
                                right: (sidebarCollapsed && !isMobile) ? 4 : undefined
                              }}>
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : currentRole === 'BUYER' ? (
            BUYER_NAV_GROUPS.map(group => {
              const isExpanded = buyerGroupExpanded[group.key] ?? group.defaultExpanded;
              const hasActiveChild = group.items.some(item => isNavItemActive(item.id));
              const hasPendingBadge = group.items.some(item => getBadgeCount(item.badge) > 0);

              return (
                <div key={group.key} style={{ marginBottom: 12 }}>
                  {/* Section Group Header */}
                  {(!sidebarCollapsed || isMobile) ? (
                    <div
                      onClick={() => toggleBuyerGroup(group.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '6px 12px',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: hasActiveChild ? '#14B8A6' : 'rgba(255,255,255,0.45)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        borderRadius: 4,
                        transition: 'all 120ms ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
                      onMouseLeave={e => e.currentTarget.style.color = hasActiveChild ? '#14B8A6' : 'rgba(255,255,255,0.45)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{group.label}</span>
                        {!isExpanded && hasPendingBadge && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#14B8A6' }} />
                        )}
                      </div>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  ) : (
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
                  )}

                  {/* Group Nav Items */}
                  {(isExpanded || (sidebarCollapsed && !isMobile)) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                      {group.items.map(item => {
                        const Icon = item.icon;
                        const count = getBadgeCount(item.badge);
                        const isActive = isNavItemActive(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            title={(sidebarCollapsed && !isMobile) ? item.label : undefined}
                            style={{
                              border: 'none',
                              width: '100%',
                              background: isActive ? 'rgba(20, 184, 166, 0.12)' : 'transparent',
                              borderLeft: isActive ? '3px solid #14B8A6' : '3px solid transparent',
                              color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                              fontWeight: isActive ? 700 : 500,
                              fontSize: 13,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: (sidebarCollapsed && !isMobile) ? '10px' : '8px 12px 8px 16px',
                              justify: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
                              borderRadius: '0 6px 6px 0',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 120ms ease',
                              position: 'relative'
                            }}
                            onMouseEnter={e => {
                              if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={e => {
                              if (!isActive) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <Icon size={16} style={{ flexShrink: 0, color: isActive ? '#14B8A6' : 'rgba(255,255,255,0.5)' }} />
                            {(!sidebarCollapsed || isMobile) && <span style={{ flex: 1 }}>{item.label}</span>}
                            {count > 0 && (
                              <span style={{
                                fontSize: 10, fontWeight: 800,
                                color: '#FFFFFF', background: '#14B8A6',
                                padding: '1px 6px', borderRadius: 999,
                                position: (sidebarCollapsed && !isMobile) ? 'absolute' : 'static',
                                top: (sidebarCollapsed && !isMobile) ? 4 : undefined,
                                right: (sidebarCollapsed && !isMobile) ? 4 : undefined
                              }}>
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            navGroups.map(group => {
              const visibleItems = group.items.filter(item => item.roles.includes(currentRole));
              if (!visibleItems.length) return null;
              return (
                <div key={group.label} style={{ marginBottom: 16 }}>
                  {!sidebarCollapsed && (
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', padding: '4px 12px 6px' }}>
                      {group.label}
                    </div>
                  )}
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const count = getBadgeCount((item as any).badge);
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        title={(sidebarCollapsed && !isMobile) ? item.label : undefined}
                        style={{
                          border: 'none',
                          width: '100%',
                          background: isActive ? 'rgba(20, 184, 166, 0.12)' : 'transparent',
                          borderLeft: isActive ? '3px solid #14B8A6' : '3px solid transparent',
                          color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                          fontWeight: isActive ? 700 : 500,
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: (sidebarCollapsed && !isMobile) ? '10px' : '8px 12px',
                          justify: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
                          borderRadius: '0 6px 6px 0',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 120ms ease',
                          marginBottom: 2,
                          position: 'relative'
                        }}
                        onMouseEnter={e => {
                          if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                        onMouseLeave={e => {
                          if (!isActive) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Icon size={16} style={{ flexShrink: 0, color: isActive ? '#14B8A6' : 'rgba(255,255,255,0.5)' }} />
                        {(!sidebarCollapsed || isMobile) && <span style={{ flex: 1 }}>{item.label}</span>}
                        {count > 0 && (
                          <span style={{
                            fontSize: 10, fontWeight: 800,
                            color: '#FFFFFF', background: '#14B8A6',
                            padding: '1px 6px', borderRadius: 999,
                            position: (sidebarCollapsed && !isMobile) ? 'absolute' : 'static',
                            top: (sidebarCollapsed && !isMobile) ? 4 : undefined,
                            right: (sidebarCollapsed && !isMobile) ? 4 : undefined
                          }}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </nav>

        {/* Sidebar User Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
          {/* Account Menu Popover */}
          <AccountMenuPopover
            isOpen={accountMenuOpen}
            onClose={() => setAccountMenuOpen(false)}
            anchorPosition="bottom-left"
            onNavigate={onNavigate}
          />

          <div
            onClick={(e) => {
              e.stopPropagation();
              setAccountMenuOpen(!accountMenuOpen);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              background: accountMenuOpen ? 'rgba(20, 184, 166, 0.18)' : 'rgba(255,255,255,0.05)',
              border: accountMenuOpen ? '1px solid rgba(20, 184, 166, 0.4)' : '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
              transition: 'all 150ms ease'
            }}
            title="Click to open Account Menu"
          >
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: roleAvatarColors[currentRole] || '#0D9488',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {userProfile.fullName ? userProfile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) : (currentRole === 'SUPPLIER' ? 'RS' : 'AP')}
            </div>
            {(!sidebarCollapsed || isMobile) && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userProfile.fullName || (currentRole === 'SUPPLIER' ? 'Rajesh Sharma' : 'Apex Pharma')}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                  {orgProfile.companyName || (currentRole === 'SUPPLIER' ? 'SunBio Labs Pvt Ltd' : 'Apex Pharma PCD Franchise')}
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: '#14B8A6', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{currentRole.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: 9, opacity: 0.8 }}>▾</span>
                </div>
              </div>
            )}
            {(!sidebarCollapsed || isMobile) && (
              <ChevronDown size={14} style={{ color: accountMenuOpen ? '#14B8A6' : 'rgba(255,255,255,0.4)', transition: 'transform 200ms ease', transform: accountMenuOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-app)', width: '100%' }}>
        {/* Enterprise Topbar */}
        <header style={{
          height: 56,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: isMobile ? '0 12px' : '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          boxShadow: 'var(--shadow-subtle)',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, minWidth: 0 }}>
            {/* Mobile Hamburger Toggle Button */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <Menu size={18} />
              </button>
            )}

            {/* Breadcrumb Path */}
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>FactoryGrid</span>
                <span>/</span>
                <span style={{ color: 'var(--text-secondary)' }}>{currentRole.replace(/_/g, ' ').toLowerCase()}</span>
                <span>/</span>
                <span style={{ color: 'var(--c-primary)', fontWeight: 700, textTransform: 'capitalize' }}>
                  {activeTab === 'category-master' ? 'Category Master' :
                    activeTab === 'margin-engine' ? 'Margin Engine' :
                    activeTab === 'customer-verification' ? 'Customer Verification' :
                    activeTab === 'manufacturer-verification' ? 'Manufacturer Verification' :
                      activeTab === 'trademark-verification' ? 'Trademark Verification' :
                        activeTab === 'brand-verification' ? 'Brand Verification' :
                          activeTab === 'compliance' ? 'Compliance Verification' :
                            activeTab === 'reports' ? 'Executive Reports' :
                              activeTab.replace(/-/g, ' ')}
                </span>
              </div>
            )}

            {/* Global Search Bar Trigger */}
            <div
              onClick={() => setCmdOpen(true)}
              style={{
                cursor: 'pointer',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: isMobile ? '6px 10px' : '6px 14px',
                width: isMobile ? 'auto' : 320,
                maxWidth: 320,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Search size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              {!isMobile && <span style={{ fontSize: 12, color: 'var(--text-tertiary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Search RFQs, products, manufacturers...</span>}
              {!isMobile && <kbd className="ent-mono" style={{ fontSize: 10, color: 'var(--text-quaternary)', border: '1px solid var(--border-default)', padding: '1px 5px', borderRadius: 4, background: 'var(--bg-surface)' }}>⌘K</kbd>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, flexShrink: 0 }}>
            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 140ms ease'
              }}
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} style={{ color: '#F59E0B' }} />}
            </button>

            {/* AI Copilot Button */}
            <button
              onClick={() => setAiOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-primary)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                padding: isMobile ? '4px 8px' : '4px 12px 4px 6px',
                borderRadius: 999,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-subtle)',
                transition: 'all 140ms ease'
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0F766E, #0284C7)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Sparkles size={12} />
              </div>
              {!isMobile && <span>AI Copilot</span>}
            </button>

            {/* Buyer Persona Quick Toggle (Visible when in BUYER role) */}
            {currentRole === 'BUYER' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '3px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  fontSize: 11,
                }}
              >
                <button
                  type="button"
                  id="buyer-persona-normal-btn"
                  onClick={() => setActiveBuyerAccount('NORMAL')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: 'none',
                    background: activeBuyerAccount === 'NORMAL' ? 'var(--bg-surface)' : 'transparent',
                    color: activeBuyerAccount === 'NORMAL' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    fontWeight: activeBuyerAccount === 'NORMAL' ? 700 : 500,
                    boxShadow: activeBuyerAccount === 'NORMAL' ? 'var(--shadow-subtle)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Apex Pharma PCD Franchise (Normal Bidding Flow)"
                >
                  Normal Buyer
                </button>
                <button
                  type="button"
                  id="buyer-persona-special-btn"
                  onClick={() => setActiveBuyerAccount('SPECIAL_PARTY')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: 'none',
                    background: activeBuyerAccount === 'SPECIAL_PARTY' ? '#FEF3C7' : 'transparent',
                    color: activeBuyerAccount === 'SPECIAL_PARTY' ? '#92400E' : 'var(--text-tertiary)',
                    fontWeight: activeBuyerAccount === 'SPECIAL_PARTY' ? 700 : 500,
                    boxShadow: activeBuyerAccount === 'SPECIAL_PARTY' ? '0 1px 2px rgba(217, 119, 6, 0.2)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="MediPlus Healthcare (Special Party Pre-Agreed Pricing)"
                >
                  <Star size={11} fill={activeBuyerAccount === 'SPECIAL_PARTY' ? '#D97706' : 'none'} color="#D97706" />
                  Special Party Buyer
                </button>
              </div>
            )}

            {/* Enterprise Role Switcher */}
            <RoleSwitcherDropdown />

            {/* One-Click Demo Reset State Button */}
            <button
              id="reset-demo-state-btn"
              onClick={() => {
                if (window.confirm('Reset demo state to clean baseline?\n\nThis will restore fresh customer classifications and clear demo-created RFQs/Quotes so you can re-run the presentation cleanly.')) {
                  resetDemoState();
                }
              }}
              title="Reset Demo State: Clear temporary demo RFQs/orders and restore baseline customers for repeat presentation"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: isMobile ? '6px' : '5px 10px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 600,
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#DC2626',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
            >
              <RotateCcw size={12} />
              {!isMobile && <span>Reset Demo</span>}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => handleTabClick('notifications')}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <Bell size={15} />
              {unreadNotifs > 0 && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--c-danger)' }} />
              )}
            </button>
          </div>
        </header>

        {/* Workspace Dynamic Content Container */}
        <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 12 : 24, background: 'var(--bg-app)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <WorkspaceErrorBoundary>
                {renderContent()}
              </WorkspaceErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── SLIDE-OVER AI COPILOT ASSISTANT DRAWER ───────────── */}
      {aiOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: isMobile ? '100vw' : 440, maxWidth: '100vw', height: '100vh', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 24px rgba(15,23,42,0.12)' }}>

            {/* Header */}
            <div style={{ padding: '18px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>FactoryGrid AI Copilot</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Contextual B2B Sourcing & Regulatory Assistant</div>
                </div>
              </div>
              <button onClick={() => setAiOpen(false)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            {/* Body / Chat Area */}
            <div style={{ flex: 1, padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Suggested Actions Section */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                  Suggested Contextual Actions
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { title: 'Analyze Sealed RFQ Bids', desc: 'Compare pricing & WHO-GMP compliance', icon: '📊' },
                    { title: 'Check Regulatory Compliance Risks', desc: 'Audit Drug Licenses & WHO-GMP timelines', icon: '🛡' },
                    { title: 'Calculate Procurement Savings', desc: 'Estimate multi-plant allocation savings', icon: '💰' },
                    { title: 'Draft Formulation Specification', desc: 'Auto-generate B2B pharma line specs', icon: '📑' },
                  ].map((act, i) => (
                    <div
                      key={i}
                      onClick={() => handleSendCopilotQuery(act.title)}
                      style={{ padding: 10, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', transition: 'all 150ms ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                      onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                        <span>{act.icon}</span>
                        <span>{act.title}</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 3 }}>{act.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversation Messages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {copilotMessages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                      background: msg.sender === 'user' ? '#2563EB' : '#F1F5F9',
                      color: msg.sender === 'user' ? '#FFFFFF' : '#0F172A',
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      boxShadow: '0 1px 3px rgba(15,23,42,0.05)'
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.text.split('\n').map((line, idx) => (
                        <div key={idx} style={{ marginTop: idx > 0 && line.startsWith('-') ? 3 : (idx > 0 ? 6 : 0) }}>
                          {line.startsWith('**') && line.endsWith('**') ? <strong>{line.slice(2, -2)}</strong> : line}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>{msg.time}</div>
                  </div>
                ))}

                {isCopilotThinking && (
                  <div style={{ alignSelf: 'flex-start', background: '#F1F5F9', color: '#64748B', padding: '10px 14px', borderRadius: '12px 12px 12px 2px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={14} className="animate-spin" style={{ color: '#2563EB' }} />
                    <span>FactoryGrid AI Assistant is thinking...</span>
                  </div>
                )}
              </div>

            </div>

            {/* Input Form at Bottom */}
            <div style={{ padding: 16, borderTop: '1px solid #E2E8F0', background: '#FFFFFF' }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Ask AI Assistant</label>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendCopilotQuery();
                }}
                style={{ display: 'flex', gap: 8 }}
              >
                <input
                  type="text"
                  placeholder="Ask about RFQs, orders, suppliers..."
                  value={copilotInput}
                  onChange={e => setCopilotInput(e.target.value)}
                  style={{ flex: 1, height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }}
                />
                <button
                  type="submit"
                  disabled={!copilotInput.trim() || isCopilotThinking}
                  style={{
                    height: 38, padding: '0 16px', borderRadius: 8,
                    background: copilotInput.trim() ? '#2563EB' : '#94A3B8',
                    color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5,
                    cursor: copilotInput.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


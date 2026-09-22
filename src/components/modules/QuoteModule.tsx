import React from 'react';
import { useApp } from '../../context/AppContext';
import { ManufacturerQuoteSubmissionsModule } from './ManufacturerQuoteSubmissionsModule';
import { BuyerQuoteComparisonModule } from './BuyerQuoteComparisonModule';
import { AdminQuoteMonitor } from './AdminQuoteMonitor';

export const QuoteModule: React.FC = () => {
  const { currentRole } = useApp();

  if (currentRole === 'SUPPLIER') {
    return <ManufacturerQuoteSubmissionsModule />;
  }

  if (currentRole === 'ADMIN') {
    return <AdminQuoteMonitor />;
  }

  return <BuyerQuoteComparisonModule />;
};

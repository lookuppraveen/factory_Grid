import React from 'react';
import { useApp } from '../../context/AppContext';
import { MasterOrderSplittingModule } from './MasterOrderSplittingModule';
import { ManufacturerSubOrderModule } from './ManufacturerSubOrderModule';

export const OrderModule: React.FC = () => {
  const { currentRole } = useApp();

  if (currentRole === 'SUPPLIER') {
    return <ManufacturerSubOrderModule />;
  }

  return <MasterOrderSplittingModule />;
};

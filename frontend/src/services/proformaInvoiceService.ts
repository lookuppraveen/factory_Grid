export interface ProformaInvoiceRecord {
  id?: string;
  poNumber: string;
  subOrderCode: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy?: string;
}

const STORAGE_KEY = 'factorygrid_proforma_invoices_v1';
const UNIFIED_KEY = 'factorygrid_unified_suborders_v12';

// Extracts core unique order identifiers e.g. "5228-01", "1001-01", "5001-02"
export const normalizeCoreKey = (str?: string): string => {
  if (!str) return '';
  let clean = str.trim().toUpperCase();
  // Repeatedly strip standard prefixes: PO-, SO-, MO-, 2026-, PO-SO-
  while (/^(PO-|SO-|MO-|2026-|PO_SO_|PO_|SO_|MO_)/i.test(clean)) {
    clean = clean.replace(/^(PO-|SO-|MO-|2026-|PO_SO_|PO_|SO_|MO_)/i, '');
  }
  // Match end pattern like "5228-01" or "1001-01"
  const endMatch = clean.match(/(\d{3,5}-\d{1,3})$/);
  if (endMatch) return endMatch[1];

  // Match any remaining "XXXX-YY" pattern
  const anyMatch = clean.match(/(\d{3,5}-\d{1,3})/);
  if (anyMatch) return anyMatch[1];

  return clean.replace(/[^A-Z0-9-]/g, '');
};

// Generates all alias keys for an identifier
export const getAliasKeys = (poNumber?: string, subOrderCode?: string): string[] => {
  const keys = new Set<string>();
  const addVariants = (raw?: string) => {
    if (!raw) return;
    const clean = raw.trim();
    if (!clean) return;
    keys.add(clean);
    keys.add(clean.toUpperCase());
    keys.add(clean.toLowerCase());

    const core = normalizeCoreKey(clean);
    if (core) {
      keys.add(core);
      keys.add(`SO-${core}`);
      keys.add(`PO-${core}`);
      keys.add(`PO-SO-${core}`);
      keys.add(`PO-2026-${core}`);
      keys.add(`SO-2026-${core}`);
      keys.add(`PO-SO-2026-${core}`);
      keys.add(`so-${core.toLowerCase()}`);
      keys.add(`po-${core.toLowerCase()}`);
      keys.add(`po-so-${core.toLowerCase()}`);
      keys.add(`so-2026-${core.toLowerCase()}`);
      keys.add(`po-2026-${core.toLowerCase()}`);
      keys.add(`po-so-2026-${core.toLowerCase()}`);
    }
  };

  addVariants(poNumber);
  addVariants(subOrderCode);
  return Array.from(keys).filter(Boolean);
};

export const getAllProformaInvoices = (): Record<string, ProformaInvoiceRecord> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Error reading proforma invoices from storage:', e);
    return {};
  }
};

export const getProformaInvoice = (poNumber?: string, subOrderCode?: string): ProformaInvoiceRecord | null => {
  if (!poNumber && !subOrderCode) return null;

  const aliases = getAliasKeys(poNumber, subOrderCode);
  const store = getAllProformaInvoices();

  // 1. Direct check in proforma invoices storage
  for (const alias of aliases) {
    if (store[alias]) {
      return store[alias];
    }
  }

  // 2. Check in unified sub-orders storage
  try {
    const rawUnified = localStorage.getItem(UNIFIED_KEY);
    if (rawUnified) {
      const unifiedStore = JSON.parse(rawUnified);
      for (const alias of aliases) {
        if (unifiedStore[alias]?.proformaInvoice) {
          return unifiedStore[alias].proformaInvoice;
        }
      }
      // Also check keys in unified store by normalization
      for (const key of Object.keys(unifiedStore)) {
        const uCore = normalizeCoreKey(key);
        for (const alias of aliases) {
          if (normalizeCoreKey(alias) === uCore && unifiedStore[key]?.proformaInvoice) {
            return unifiedStore[key].proformaInvoice;
          }
        }
      }
    }
  } catch (e) {
    console.error('Error reading unified sub-orders storage:', e);
  }

  return null;
};

// Generates an official sample/demo Proforma Invoice document for instant Buyer preview
export const generateSampleProformaInvoice = (poNumber?: string, subOrderCode?: string): ProformaInvoiceRecord => {
  const pCode = poNumber || 'PO-2026-1001-01';
  const sCode = subOrderCode || 'SO-1001-01';
  const core = normalizeCoreKey(pCode) || normalizeCoreKey(sCode) || '1001-01';
  const fileName = `Proforma_Invoice_${pCode}.pdf`;

  const isCipla = core.endsWith('02') || (sCode || '').includes('02');
  const mfgName = isCipla ? 'Cipla Partner Formulations Ltd.' : 'SunBio LifeSciences Ltd.';
  const mfgGst = isCipla ? '27AAACL1234F1Z8' : '02SUNBI0001A1Z8';
  const mfgAddress = isCipla ? 'MIDC Industrial Area, Kurkumbh, Pune, Maharashtra - 413802' : 'Industrial Area, Phase II, Solan, HP - 173205';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>PROFORMA INVOICE - ${pCode}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; color: #0F172A; background: #FFFFFF; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0F766E; padding-bottom: 18px; margin-bottom: 20px; }
          .badge { display: inline-block; background: #CCFBF1; color: #0F766E; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 6px; }
          .title { font-size: 22px; font-weight: 800; color: #0F766E; margin: 0; }
          .subtitle { font-size: 12px; color: #64748B; margin-top: 3px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; font-size: 12px; background: #F8FAFC; padding: 14px; border-radius: 8px; border: 1px solid #E2E8F0; }
          .grid-item strong { color: #0F172A; }
          .table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
          .table th { background: #F1F5F9; padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; border-bottom: 1px solid #E2E8F0; }
          .table td { padding: 9px 12px; border-bottom: 1px solid #F1F5F9; }
          .total-box { margin-top: 20px; background: #F0FDFA; border: 1px solid #99F6E4; border-radius: 8px; padding: 14px; display: flex; justify-content: space-between; align-items: center; }
          .footer-note { margin-top: 24px; font-size: 11px; color: #64748B; border-top: 1px dashed #CBD5E1; padding-top: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="badge">Commercial B2B Document</div>
            <h1 class="title">PROFORMA INVOICE</h1>
            <div class="subtitle">Invoice Ref: <strong>PI-${core}</strong> · PO Reference: <strong>${pCode}</strong></div>
          </div>
          <div style="text-align: right; font-size: 12px;">
            <strong style="color: #0F766E; font-size: 14px;">${mfgName}</strong><br/>
            <span>GSTIN: ${mfgGst}</span><br/>
            <span>${mfgAddress}</span>
          </div>
        </div>

        <div class="grid">
          <div>
            <div><strong>Billed To:</strong> Apex Pharma PCD Franchise (Buyer)</div>
            <div><strong>Buyer GSTIN:</strong> 36APXPH0001A1Z5</div>
            <div><strong>Billing Address:</strong> Barakhamba Road, Connaught Place, New Delhi - 110001</div>
          </div>
          <div>
            <div><strong>Purchase Order:</strong> ${pCode}</div>
            <div><strong>Sub-Order Ref:</strong> ${sCode}</div>
            <div><strong>Invoice Date:</strong> 25 Aug 2026</div>
            <div><strong>Payment Terms:</strong> Net 30 Days / Escrow Settlement</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Product Line Description</th>
              <th>Quantity</th>
              <th>Unit Rate</th>
              <th>Tax (GST 12%)</th>
              <th style="text-align: right;">Total Line Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Paracetamol 500mg Tablets</strong> (Alu-Alu Blister Pack)</td>
              <td>10,000 Units</td>
              <td>₹9.66</td>
              <td>₹11,592</td>
              <td style="text-align: right; font-weight: 700;">₹1,08,192.00</td>
            </tr>
            <tr>
              <td><strong>Azithromycin 500mg Tablets</strong> (Strip Pack 3x10)</td>
              <td>2,000 Units</td>
              <td>₹15.00</td>
              <td>₹3,600</td>
              <td style="text-align: right; font-weight: 700;">₹33,600.00</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #0F766E; text-transform: uppercase;">Grand Total Proforma Invoice Value</div>
            <div style="font-size: 11px; color: #64748B;">Inclusive of all applicable IGST / SGST taxes</div>
          </div>
          <div style="font-size: 20px; font-weight: 800; color: #0F766E; font-family: monospace;">₹1,41,792.00</div>
        </div>

        <div class="footer-note">
          Official B2B computer-generated Proforma Invoice issued via FactoryGrid B2B Manufacturing Platform.
        </div>
      </body>
    </html>
  `;

  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

  return {
    id: `sample-pi-${core}`,
    poNumber: pCode,
    subOrderCode: sCode,
    fileName,
    fileType: 'PDF Document (.pdf)',
    fileSize: '1.24 MB',
    fileUrl: dataUrl,
    uploadedAt: '25 Aug 2026, 11:30 AM',
    uploadedBy: `${mfgName} (Supplier)`
  };
};

export const saveProformaInvoice = (record: ProformaInvoiceRecord): void => {
  try {
    const store = getAllProformaInvoices();
    const aliases = getAliasKeys(record.poNumber, record.subOrderCode);

    aliases.forEach(key => {
      store[key] = record;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

    // Also update unified sub-orders storage
    try {
      const rawUnified = localStorage.getItem(UNIFIED_KEY);
      const unifiedStore = rawUnified ? JSON.parse(rawUnified) : {};
      aliases.forEach(key => {
        if (unifiedStore[key]) {
          unifiedStore[key].proformaInvoice = record;
        }
      });
      // Ensure target subOrderCode entry exists with the invoice
      if (record.subOrderCode) {
        if (!unifiedStore[record.subOrderCode]) {
          unifiedStore[record.subOrderCode] = {};
        }
        unifiedStore[record.subOrderCode].proformaInvoice = record;
      }
      localStorage.setItem(UNIFIED_KEY, JSON.stringify(unifiedStore));
    } catch (e) {
      console.error('Error updating unified storage with proforma invoice:', e);
    }

    // Trigger cross-component reactive updates
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('proforma-invoice-updated', { detail: record }));
  } catch (e) {
    console.error('Error saving proforma invoice to storage:', e);
  }
};

export const deleteProformaInvoice = (poNumber?: string, subOrderCode?: string): void => {
  try {
    const store = getAllProformaInvoices();
    const aliases = getAliasKeys(poNumber, subOrderCode);

    aliases.forEach(key => {
      delete store[key];
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

    try {
      const rawUnified = localStorage.getItem(UNIFIED_KEY);
      if (rawUnified) {
        const unifiedStore = JSON.parse(rawUnified);
        aliases.forEach(key => {
          if (unifiedStore[key]?.proformaInvoice) {
            delete unifiedStore[key].proformaInvoice;
          }
        });
        localStorage.setItem(UNIFIED_KEY, JSON.stringify(unifiedStore));
      }
    } catch {
      // Ignored
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('proforma-invoice-updated', { detail: null }));
  } catch (e) {
    console.error('Error deleting proforma invoice from storage:', e);
  }
};

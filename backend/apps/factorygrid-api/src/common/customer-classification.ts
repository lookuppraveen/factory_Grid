export const CUSTOMER_CLASSIFICATIONS = ['RETAIL', 'B2B', 'B2B_SPECIAL'] as const;
export type CustomerClassificationValue = (typeof CUSTOMER_CLASSIFICATIONS)[number];

export function isValidCustomerClassification(value?: string | null): value is CustomerClassificationValue {
  if (!value) return false;
  return (CUSTOMER_CLASSIFICATIONS as readonly string[]).includes(value.trim().toUpperCase());
}

export function normalizeCustomerClassification(value?: string | null): CustomerClassificationValue {
  const upper = (value || '').trim().toUpperCase();
  if (upper === 'B2B_SPECIAL' || upper === 'SPECIAL_PARTY') return 'B2B_SPECIAL';
  if (upper === 'RETAIL') return 'RETAIL';
  return 'B2B';
}

export function isB2bSpecialClassification(value?: string | null): boolean {
  return normalizeCustomerClassification(value) === 'B2B_SPECIAL';
}

export function formatCustomerClassificationLabel(value?: string | null): string {
  const normalized = normalizeCustomerClassification(value);
  if (normalized === 'B2B_SPECIAL') return 'B2B Special';
  if (normalized === 'RETAIL') return 'Retail';
  return 'B2B';
}

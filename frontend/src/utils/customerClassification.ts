export type CustomerClassification = 'RETAIL' | 'B2B' | 'B2B_SPECIAL';

export const CUSTOMER_CLASSIFICATION_OPTIONS: Array<{ value: CustomerClassification; label: string }> = [
  { value: 'RETAIL', label: 'Retail' },
  { value: 'B2B', label: 'B2B' },
  { value: 'B2B_SPECIAL', label: 'B2B Special' },
];

export function normalizeCustomerClassification(value?: string | null): CustomerClassification {
  const upper = (value || '').trim().toUpperCase();
  if (upper === 'B2B_SPECIAL' || upper === 'SPECIAL_PARTY') return 'B2B_SPECIAL';
  if (upper === 'RETAIL') return 'RETAIL';
  return 'B2B';
}

export function isB2bSpecial(value?: string | null): boolean {
  return normalizeCustomerClassification(value) === 'B2B_SPECIAL';
}

export function getCustomerClassificationLabel(value?: string | null): string {
  const normalized = normalizeCustomerClassification(value);
  if (normalized === 'B2B_SPECIAL') return 'B2B Special';
  if (normalized === 'RETAIL') return 'Retail';
  return 'B2B';
}

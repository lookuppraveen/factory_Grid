/**
 * AI Compliance Analysis Service (Demo Mode)
 * Provides frontend demo AI compliance analysis for client demonstration.
 * 
 * Supports:
 * 1. PAN Card
 * 2. GST Certificate
 * 3. Drug License
 * 4. Incorporation Certificate
 * 
 * IMPORTANT: Demo result — actual document AI/OCR verification will be connected
 * in the production implementation. Final compliance decision must be made by the authorized reviewer.
 */

export interface AICheckItem {
  label: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
}

export interface AIComplianceFinding {
  documentName: string;
  documentType: string;
  overallAssessment: 'PASS' | 'REVIEW_REQUIRED' | 'INCOMPLETE';
  extractedInfo: {
    companyName: string;
    documentNumber: string;
    issueDate: string;
    expiryDate: string;
    issuingAuthority: string;
    address?: string;
  };
  checks: AICheckItem[];
  potentialIssues: string[];
  confidence: 'High' | 'Medium' | 'Low';
  advisoryNotice: string;
  analyzedAt: string;
  isDemoAnalysis: boolean;
  aiProvider?: string;
}

export interface TargetOrgContext {
  name: string;
  gstin?: string;
  licenseNumber?: string;
  address?: string;
}

/**
 * Perform Frontend Demo AI Compliance Analysis
 */
export const analyzeComplianceDocument = async (
  docName: string,
  docType: string,
  targetOrg?: TargetOrgContext
): Promise<AIComplianceFinding> => {
  // Realistic processing latency for AI vision/OCR extraction pipeline feel
  await new Promise((resolve) => setTimeout(resolve, 500));

  const nameUpper = (docName || '').toUpperCase();
  const typeUpper = (docType || '').toUpperCase();
  const orgName = targetOrg?.name || 'SunBio LifeSciences Ltd';
  const orgGst = targetOrg?.gstin || '02AAACS1234F1Z9';
  const orgLic = targetOrg?.licenseNumber || 'ML-HP-2024-001';

  // 1. PAN CARD DEMO ANALYSIS
  if (typeUpper.includes('PAN') || nameUpper.includes('PAN')) {
    return {
      documentName: docName,
      documentType: 'PAN Card',
      overallAssessment: 'PASS',
      extractedInfo: {
        companyName: orgName,
        documentNumber: 'AAACP1234K',
        issueDate: '2018-03-15',
        expiryDate: 'N/A (Permanent)',
        issuingAuthority: 'Income Tax Department, Govt of India'
      },
      checks: [
        { label: 'PAN number', status: 'PASS', message: 'PAN number detected & format verified.' },
        { label: 'Name information', status: 'PASS', message: 'Entity name detected and matches profile.' },
        { label: 'Document readability', status: 'PASS', message: 'Document appears clear and readable.' },
        { label: 'Required information', status: 'PASS', message: 'Required statutory information appears present.' }
      ],
      potentialIssues: ['Document appears compliant based on the available demo information.'],
      confidence: 'High',
      advisoryNotice: 'Demo result — actual document AI/OCR verification will be connected in the production implementation.',
      analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDemoAnalysis: true,
      aiProvider: 'FactoryGrid Demo AI'
    };
  }

  // 2. GST CERTIFICATE DEMO ANALYSIS
  if (typeUpper.includes('GST') || nameUpper.includes('GST')) {
    return {
      documentName: docName,
      documentType: 'GST Certificate',
      overallAssessment: 'PASS',
      extractedInfo: {
        companyName: orgName,
        documentNumber: orgGst,
        issueDate: '2022-04-10',
        expiryDate: 'N/A (Active Registration)',
        issuingAuthority: 'Central Board of Indirect Taxes & Customs (CBIC)'
      },
      checks: [
        { label: 'GSTIN', status: 'PASS', message: `GSTIN detected (${orgGst}).` },
        { label: 'Legal entity information', status: 'PASS', message: 'Legal trade entity name detected.' },
        { label: 'Registration information', status: 'PASS', message: 'Registration details appear present.' },
        { label: 'Document readability', status: 'PASS', message: 'Document appears clear and readable.' }
      ],
      potentialIssues: ['No obvious compliance issue detected in this demo analysis.'],
      confidence: 'High',
      advisoryNotice: 'Demo result — actual document AI/OCR verification will be connected in the production implementation.',
      analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDemoAnalysis: true,
      aiProvider: 'FactoryGrid Demo AI'
    };
  }

  // 3. DRUG LICENSE DEMO ANALYSIS
  if (typeUpper.includes('DRUG') || nameUpper.includes('DRUG') || nameUpper.includes('LICENSE') || nameUpper.includes('20B')) {
    return {
      documentName: docName,
      documentType: 'Drug License',
      overallAssessment: 'PASS',
      extractedInfo: {
        companyName: orgName,
        documentNumber: orgLic,
        issueDate: '2021-10-15',
        expiryDate: '2028-12-31',
        issuingAuthority: 'State Drugs Control Administration / CDSCO'
      },
      checks: [
        { label: 'Drug license number', status: 'PASS', message: `License number detected (${orgLic}).` },
        { label: 'License information', status: 'PASS', message: 'Statutory Form 20B/21B details detected.' },
        { label: 'Validity information', status: 'PASS', message: 'Valid through 2028-12-31.' },
        { label: 'Document readability', status: 'PASS', message: 'Document appears clear and readable.' },
        { label: 'Required information', status: 'PASS', message: 'Required statutory information appears present.' }
      ],
      potentialIssues: ['No obvious compliance issue detected in this demo analysis.'],
      confidence: 'High',
      advisoryNotice: 'Demo result — actual document AI/OCR verification will be connected in the production implementation.',
      analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDemoAnalysis: true,
      aiProvider: 'FactoryGrid Demo AI'
    };
  }

  // 4. INCORPORATION CERTIFICATE & OTHER STATUTORY DOCUMENTS
  return {
    documentName: docName,
    documentType: docType || 'Incorporation Certificate',
    overallAssessment: 'PASS',
    extractedInfo: {
      companyName: orgName,
      documentNumber: 'U24231HP2018PTC034120',
      issueDate: '2018-05-12',
      expiryDate: 'N/A (Permanent Entity)',
      issuingAuthority: 'Ministry of Corporate Affairs (MCA)'
    },
    checks: [
      { label: 'Registration information', status: 'PASS', message: '21-digit CIN registration number detected.' },
      { label: 'Company information', status: 'PASS', message: 'Company legal entity title detected.' },
      { label: 'Certificate information', status: 'PASS', message: 'Certificate details appear present.' },
      { label: 'Document readability', status: 'PASS', message: 'Document appears clear and readable.' }
    ],
    potentialIssues: ['No obvious compliance issue detected in this demo analysis.'],
    confidence: 'High',
    advisoryNotice: 'Demo result — actual document AI/OCR verification will be connected in the production implementation.',
    analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isDemoAnalysis: true,
    aiProvider: 'FactoryGrid Demo AI'
  };
};

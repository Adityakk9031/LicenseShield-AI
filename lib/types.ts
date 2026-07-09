export interface PackageInput {
  name: string;
  version?: string;
  ecosystem: 'npm' | 'pypi';
}

export interface AuditRequest {
  packages: PackageInput[];
  projectLicense: string;
}

export interface RiskItem {
  package: string;
  type: 'LICENSE' | 'VULNERABILITY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  detail: string;
}

export interface AuditVerdict {
  status: 'APPROVED' | 'FLAGGED';
  risks: RiskItem[];
  suggestions: string[];
  capTransaction: CAPTransaction | null;
  aiAnalysis?: string;
}

export interface CAPTransaction {
  negotiationId: string;
  orderId: string;
  status: 'completed' | string;
  deliverableUrl: string | null;
  settledAt: string;
}

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
  settlementTxHash?: string | null;
  authModel?: 'ModelA_SaaS' | 'ModelB_Web3' | null;
  aiAnalysis?: string;
}

export interface Web3EscrowTransaction {
  auditId: string;
  txHash: string;
  status: 'completed' | string;
  settledAt: string;
}


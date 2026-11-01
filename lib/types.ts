export interface PackageInput {
  name: string;
  version?: string;
  ecosystem: 'npm' | 'pypi';
}

export interface AuditRequest {
  packages: PackageInput[];
  projectLicense: string;
}

export type RiskCategory =
  | 'LICENSE'
  | 'VULNERABILITY'
  | 'HALLUCINATION'
  | 'TYPOSQUATTING'
  | 'DEPRECATED';

export interface RiskItem {
  package: string;
  type: RiskCategory;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  detail: string;
  suggestedReplacement?: string;
}

export interface AutoCorrectionPlan {
  canAutoFix: boolean;
  blockedPackages: string[];
  replacements: Record<string, string>;
  remediationCommand: string | null;
  agentInstruction: string;
}

export interface AuditVerdict {
  status: 'APPROVED' | 'FLAGGED';
  risks: RiskItem[];
  suggestions: string[];
  autoCorrection?: AutoCorrectionPlan;
  settlementTxHash?: string | null;
  authModel?: 'ModelA_SaaS' | 'ModelB_Web3' | 'ModelB_EIP712_Vault' | null;
  aiAnalysis?: string;
}

export interface Web3EscrowTransaction {
  auditId: string;
  txHash: string;
  status: 'completed' | string;
  settledAt: string;
}

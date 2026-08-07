'use client';

import { useState } from 'react';

export interface AuditReportData {
  status: 'APPROVED' | 'FLAGGED';
  targetLicense: string;
  packagesScanned: number;
  flaggedCount: number;
  vulnerabilityCount: number;
  risks: Array<{
    name: string;
    version?: string;
    license: string;
    status: 'APPROVED' | 'FLAGGED';
    reason: string;
    vulnerabilities?: any[];
    suggestedAlternatives?: string[];
  }>;
  overallReason?: string;
  suggestedAlternatives?: string[];
  settlementTxHash?: string;
  billedVia?: string;
}

interface HeroAuditProps {
  onAuditComplete: (data: AuditReportData) => void;
}

const PRESETS = {
  highRisk: {
    label: '🔴 High-Risk / CVE Preset',
    license: 'MIT',
    deps: 'colors@1.4.1\nlodash@4.17.20\nexpress@4.17.1',
  },
  clean: {
    label: '🟢 Clean Production Preset',
    license: 'MIT',
    deps: 'chalk@5.3.0\ndotenv@16.0.0\nzod@3.22.0\nreact@18.2.0',
  },
  copyleft: {
    label: '🟡 Copyleft Conflict Preset',
    license: 'MIT',
    deps: 'gpl-3.0-module@1.0.0\nexpress@4.18.2\naxios@1.6.0',
  },
};

export default function HeroAudit({ onAuditComplete }: HeroAuditProps) {
  const [dependenciesText, setDependenciesText] = useState(PRESETS.highRisk.deps);
  const [targetLicense, setTargetLicense] = useState('MIT');
  const [authMode, setAuthMode] = useState<'apiKey' | 'escrow'>('apiKey');
  const [apiKeyInput, setApiKeyInput] = useState('ls_live_demo_key_998877');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleApplyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setDependenciesText(preset.deps);
    setTargetLicense(preset.license);
  };

  const handleRunAudit = async () => {
    setLoading(true);
    setErrorMsg(null);

    const rawLines = dependenciesText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));

    if (rawLines.length === 0) {
      setErrorMsg('Please enter at least one npm dependency package (e.g. colors@1.4.1).');
      setLoading(false);
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authMode === 'apiKey') {
        headers['Authorization'] = `Bearer ${apiKeyInput || 'ls_live_demo_key_998877'}`;
      } else {
        // Model B: Escrow mock/demo header ID
        headers['X-Audit-ID'] = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }

      const res = await fetch('/api/v1/audit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetLicense,
          dependencies: rawLines,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setErrorMsg(
            `Payment Required (402): ${data.message || 'Valid Web2 API key or Web3 $0.01 USDC escrow lock required.'}`
          );
        } else {
          setErrorMsg(data.error || data.message || `Audit request failed with status ${res.status}`);
        }
        setLoading(false);
        return;
      }

      // Format response data for presentation component
      const formattedReport: AuditReportData = {
        status: data.status || (data.verdict === 'APPROVED' ? 'APPROVED' : 'FLAGGED'),
        targetLicense: data.targetLicense || targetLicense,
        packagesScanned: data.packagesScanned || data.results?.length || rawLines.length,
        flaggedCount: data.flaggedCount || data.results?.filter((r: any) => r.status === 'FLAGGED').length || 0,
        vulnerabilityCount:
          data.vulnerabilityCount ||
          data.results?.reduce((acc: number, curr: any) => acc + (curr.vulnerabilities?.length || 0), 0) || 0,
        risks: data.results || data.risks || [],
        overallReason: data.reason || data.aiAnalysis || 'Automated compliance & vulnerability verification complete.',
        suggestedAlternatives: data.suggestedAlternatives || [],
        settlementTxHash: data.settlementTxHash,
        billedVia: data.billedVia || (authMode === 'apiKey' ? 'Model A (Web2 SaaS API Key)' : 'Model B (Web3 Base Sepolia Escrow)'),
      };

      onAuditComplete(formattedReport);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error executing audit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-tag">
          <span className="hero-tag-glow"></span>
          <span className="hero-tag-text">Gemini 2.5 / 3.5 Flash · Base Sepolia Escrow Engine</span>
        </div>

        <h1 className="hero-title">
          Autonomous License Compliance & <span className="title-gradient">CVE Security Audit</span>
        </h1>

        <p className="hero-description">
          Audit npm dependency trees for license compatibility conflicts and known vulnerabilities in real-time. 
          Powered by Gemini AI and settled via on-chain USDC smart contract escrow.
        </p>

        {/* Preset Selector */}
        <div className="preset-bar">
          <span className="preset-label">Quick Test Presets:</span>
          <div className="preset-buttons">
            <button type="button" onClick={() => handleApplyPreset('highRisk')} className="btn-preset btn-preset-danger">
              {PRESETS.highRisk.label}
            </button>
            <button type="button" onClick={() => handleApplyPreset('clean')} className="btn-preset btn-preset-success">
              {PRESETS.clean.label}
            </button>
            <button type="button" onClick={() => handleApplyPreset('copyleft')} className="btn-preset btn-preset-warning">
              {PRESETS.copyleft.label}
            </button>
          </div>
        </div>

        {/* Main Audit Console Card */}
        <div className="audit-card glass-card">
          <div className="audit-card-header">
            <div className="header-left">
              <span className="card-dot red"></span>
              <span className="card-dot yellow"></span>
              <span className="card-dot green"></span>
              <span className="card-title-text">Dependency Inspector</span>
            </div>

            <div className="header-right">
              <label htmlFor="target-license-select" className="license-label">Target License:</label>
              <select
                id="target-license-select"
                value={targetLicense}
                onChange={(e) => setTargetLicense(e.target.value)}
                className="license-select"
              >
                <option value="MIT">MIT (Permissive)</option>
                <option value="Apache-2.0">Apache-2.0 (Patent Grant)</option>
                <option value="BSD-3-Clause">BSD-3-Clause</option>
                <option value="GPL-3.0">GPL-3.0 (Copyleft)</option>
                <option value="AGPL-3.0">AGPL-3.0 (Network Copyleft)</option>
                <option value="Proprietary">Proprietary / Closed Source</option>
              </select>
            </div>
          </div>

          <div className="audit-card-body">
            <div className="input-block">
              <label htmlFor="dependencies-textarea" className="input-label">NPM Dependencies (one per line, e.g. package@version):</label>
              <textarea
                id="dependencies-textarea"
                value={dependenciesText}
                onChange={(e) => setDependenciesText(e.target.value)}
                rows={5}
                placeholder="colors@1.4.1&#10;lodash@4.17.20&#10;chalk@5.3.0"
                className="audit-textarea"
              />
            </div>

            {/* Auth Model Toggle Bar */}
            <div className="auth-model-section">
              <div className="model-toggle-group">
                <button
                  type="button"
                  onClick={() => setAuthMode('apiKey')}
                  className={`model-btn ${authMode === 'apiKey' ? 'active' : ''}`}
                >
                  Model A: Web2 SaaS API Key
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('escrow')}
                  className={`model-btn ${authMode === 'escrow' ? 'active' : ''}`}
                >
                  Model B: Web3 $0.01 USDC Escrow
                </button>
              </div>

              {authMode === 'apiKey' && (
                <div className="api-key-input-wrap">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Enter Bearer API key (e.g. ls_live_demo_key_998877)"
                    className="api-key-input"
                  />
                  <span className="key-hint">Demo key pre-filled</span>
                </div>
              )}

              {authMode === 'escrow' && (
                <div className="escrow-info-wrap">
                  <span className="escrow-icon">⛓️</span>
                  <span className="escrow-text">
                    Verifies $0.01 USDC locked on Base Sepolia contract (<code>0x036C...F7e</code>).
                  </span>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="error-banner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRunAudit}
              disabled={loading}
              className={`btn-run-audit ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Ingesting NPM & OSV data... Gemini AI Scanning...</span>
                </>
              ) : (
                <>
                  <span>Execute AI Security & Compliance Audit</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

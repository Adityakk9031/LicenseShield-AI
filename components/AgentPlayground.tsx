'use client';

import { useState } from 'react';

interface AgentScenario {
  id: string;
  name: string;
  agent: string;
  description: string;
  command: string;
  packages: string[];
  targetPolicy: string;
  tag: string;
  tagType: 'danger' | 'warning' | 'success';
}

const SCENARIOS: AgentScenario[] = [
  {
    id: 'copyleft',
    name: 'Copyleft Injection in SaaS',
    agent: 'Cursor Agent',
    description: 'Autonomous AI agent tries to install an AGPL copyleft dependency inside a commercial MIT codebase.',
    command: 'npm install agpl-3.0-module@1.0.0 colors@1.4.1 axios@1.6.0',
    packages: ['agpl-3.0-module@1.0.0', 'colors@1.4.1', 'axios@1.6.0'],
    targetPolicy: 'MIT',
    tag: '🚨 HIGH RISK',
    tagType: 'danger',
  },
  {
    id: 'cve',
    name: 'Vulnerable Supply Chain CVE',
    agent: 'Claude Code',
    description: 'AI code generator suggests legacy packages with known high-severity CVE remote-execution advisories.',
    command: 'npm install lodash@4.17.20 express@4.17.1 minimist@1.2.0',
    packages: ['lodash@4.17.20', 'express@4.17.1', 'minimist@1.2.0'],
    targetPolicy: 'Apache-2.0',
    tag: '⚠️ ACTIVE CVE',
    tagType: 'warning',
  },
  {
    id: 'clean',
    name: 'Permissive Enterprise Stack',
    agent: 'Gemini CLI',
    description: 'Fully verified safe permissive packages with patent protection and zero unpatched vulnerabilities.',
    command: 'npm install zod@3.22.0 chalk@5.3.0 dotenv@16.0.0',
    packages: ['zod@3.22.0', 'chalk@5.3.0', 'dotenv@16.0.0'],
    targetPolicy: 'MIT',
    tag: '✅ 100% CLEAN',
    tagType: 'success',
  },
];

const AGENTS = [
  { id: 'cursor', name: 'Cursor Agent', icon: '⚡' },
  { id: 'claude', name: 'Claude Code', icon: '🧠' },
  { id: 'gemini', name: 'Gemini CLI', icon: '✨' },
  { id: 'windsurf', name: 'Windsurf / Cline', icon: '🌊' },
];

export default function AgentPlayground() {
  const [selectedAgent, setSelectedAgent] = useState('Cursor Agent');
  const [selectedScenario, setSelectedScenario] = useState<AgentScenario>(SCENARIOS[0]);
  const [customCommand, setCustomCommand] = useState(SCENARIOS[0].command);
  const [targetPolicy, setTargetPolicy] = useState(SCENARIOS[0].targetPolicy);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[INIT] LicenseShield Agent Guardrail daemon listening on IPC socket hook...`,
    `[READY] Monitoring active AI coding sessions. Select a scenario or run a custom npm install command.`,
  ]);

  const handleSelectScenario = (scenario: AgentScenario) => {
    setSelectedScenario(scenario);
    setSelectedAgent(scenario.agent);
    setCustomCommand(scenario.command);
    setTargetPolicy(scenario.targetPolicy);
    setVerificationResult(null);
    setTerminalLogs([
      `[SWITCH] Loaded scenario: "${scenario.name}" (${scenario.agent})`,
      `[CONFIG] Target Compliance Policy: ${scenario.targetPolicy}`,
      `[PREPARE] Command staged: ${scenario.command}`,
      `[PROMPT] Click "Run Intercept Verification" to test real-time agent guardrails.`,
    ]);
  };

  const handleRunVerification = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    const initialLogs = [
      `[${new Date().toLocaleTimeString()}] 🚀 AI Agent "${selectedAgent}" triggered dependency installation...`,
      `[${new Date().toLocaleTimeString()}] ⚡ [INTERCEPT] LicenseShield proxy hooked package manager invocation.`,
      `[${new Date().toLocaleTimeString()}] 🔍 Querying NPM Registry and OSV.dev vulnerability database...`,
      `[${new Date().toLocaleTimeString()}] 🤖 Evaluating license tree graph against policy: ${targetPolicy}...`,
    ];

    setTerminalLogs(initialLogs);

    try {
      const res = await fetch('/api/v1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent,
          command: customCommand,
          targetPolicy,
        }),
      });

      const data = await res.json();
      setVerificationResult(data);

      const finishLogs = [...initialLogs];

      if (data.status === 'FAIL') {
        finishLogs.push(
          `[${new Date().toLocaleTimeString()}] 🛑 [BLOCKED] LicenseShield intercepted policy violation!`,
          `[${new Date().toLocaleTimeString()}] ❌ Score: ${data.score}/100 | Status: ${data.status}`,
          `[${new Date().toLocaleTimeString()}] 🔒 Cryptographic Proof: ${data.executionProof?.slice(0, 22)}...`,
          `[${new Date().toLocaleTimeString()}] 💡 ${data.explanation}`
        );
      } else if (data.status === 'WARN') {
        finishLogs.push(
          `[${new Date().toLocaleTimeString()}] ⚠️ [FLAGGED] Warnings detected in dependency graph.`,
          `[${new Date().toLocaleTimeString()}] 📊 Score: ${data.score}/100 | Status: ${data.status}`,
          `[${new Date().toLocaleTimeString()}] 🔒 Cryptographic Proof: ${data.executionProof?.slice(0, 22)}...`,
          `[${new Date().toLocaleTimeString()}] 💡 ${data.explanation}`
        );
      } else {
        finishLogs.push(
          `[${new Date().toLocaleTimeString()}] ✅ [APPROVED] All dependencies verified compliant & safe.`,
          `[${new Date().toLocaleTimeString()}] 🎉 Score: ${data.score}/100 | Latency: ${data.latencyMs || 42}ms`,
          `[${new Date().toLocaleTimeString()}] 🔒 Cryptographic Proof: ${data.executionProof?.slice(0, 22)}...`,
          `[${new Date().toLocaleTimeString()}] 🚀 Execution cleared for ${selectedAgent}.`
        );
      }

      setTerminalLogs(finishLogs);
    } catch {
      setTerminalLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ❌ Verification error. Check network connection.`,
      ]);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section id="agent-sandbox" style={{ maxWidth: 1180, margin: '0 auto', padding: '100px 24px', position: 'relative', zIndex: 10 }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div className="metric-card-tag" style={{ margin: '0 auto 14px' }}>
          CORE AGENT USP · LIVE INTERCEPTOR
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4.5vw, 54px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          AI Coding Agent <span className="hero-heading-gradient">Verification Sandbox</span>
        </h2>
        <p style={{ fontSize: 'clamp(15px, 1.8vw, 17px)', color: 'rgba(148, 163, 184, 0.85)', maxWidth: 680, margin: '16px auto 0', lineHeight: 1.6 }}>
          Watch LicenseShield act as an autonomous policy proxy in real-time. When AI coding agents generate code with unvetted packages, LicenseShield intercepts, scans, and verifies compliance before code merges.
        </p>
      </div>

      {/* Main Grid: Controls + Interactive Terminal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'stretch' }}>
        {/* Left Column: Preset Scenarios & Agent Select */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 12 }}>
              1. Select AI Coding Agent
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.name)}
                  type="button"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: selectedAgent === agent.name ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)' : 'rgba(8, 12, 22, 0.7)',
                    border: `1px solid ${selectedAgent === agent.name ? 'rgba(0, 242, 254, 0.5)' : 'rgba(255, 255, 255, 0.06)'}`,
                    color: selectedAgent === agent.name ? '#00F2FE' : '#94A3B8',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>{agent.icon}</span>
                  <span>{agent.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 12 }}>
              2. Test Pre-Configured Scenarios
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SCENARIOS.map((sc) => {
                const isSelected = selectedScenario.id === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => handleSelectScenario(sc)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 14,
                      background: isSelected ? 'rgba(0, 242, 254, 0.08)' : 'rgba(8, 12, 22, 0.6)',
                      border: `1px solid ${isSelected ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: isSelected ? '#fff' : '#CBD5E1' }}>
                        {sc.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: sc.tagType === 'danger' ? 'rgba(251, 113, 133, 0.15)' : sc.tagType === 'warning' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                          color: sc.tagType === 'danger' ? 'var(--rose)' : sc.tagType === 'warning' ? 'var(--amber)' : 'var(--emerald)',
                          border: `1px solid ${sc.tagType === 'danger' ? 'rgba(251, 113, 133, 0.3)' : sc.tagType === 'warning' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                        }}
                      >
                        {sc.tag}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                      {sc.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label htmlFor="agent-command-input" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                3. Intercepted Command
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Policy:</span>
                <select
                  value={targetPolicy}
                  onChange={(e) => setTargetPolicy(e.target.value)}
                  style={{
                    background: '#04060A',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#00F2FE',
                    borderRadius: 8,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                  }}
                >
                  <option value="MIT">MIT (Permissive)</option>
                  <option value="Apache-2.0">Apache-2.0</option>
                  <option value="Proprietary">Proprietary Commercial</option>
                </select>
              </div>
            </div>
            <input
              id="agent-command-input"
              type="text"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              placeholder="npm install <package>@<version>"
              style={{
                width: '100%',
                background: 'rgba(2, 4, 8, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '12px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: 12.5,
                color: '#00F2FE',
                outline: 'none',
              }}
            />
          </div>

          <button
            onClick={handleRunVerification}
            disabled={isVerifying}
            className="btn-primary-glow"
            type="button"
            style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: 14, marginTop: 'auto' }}
          >
            {isVerifying ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #000', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                <span>Intercepting &amp; Verifying {selectedAgent}...</span>
              </span>
            ) : (
              <>
                <span>⚡ Run Intercept Verification</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Live Streaming Terminal & Compliance Card */}
        <div
          style={{
            background: 'rgba(4, 8, 16, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 22,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Terminal Window Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', marginLeft: 8 }}>
                licenseshield-proxy-daemon · {selectedAgent.toLowerCase().replace(/\s+/g, '-')}
              </span>
            </div>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 20,
                background: 'rgba(0, 242, 254, 0.1)',
                color: '#00F2FE',
                border: '1px solid rgba(0, 242, 254, 0.25)',
              }}
            >
              IPC HOOK: ACTIVE
            </span>
          </div>

          {/* Terminal Log Console */}
          <div
            style={{
              flex: 1,
              minHeight: 220,
              maxHeight: 280,
              overflowY: 'auto',
              background: '#020408',
              borderRadius: 12,
              padding: 16,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              lineHeight: 1.6,
              color: '#CBD5E1',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              border: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            {terminalLogs.map((log, idx) => (
              <div
                key={idx}
                style={{
                  color: log.includes('BLOCKED') || log.includes('❌') || log.includes('🚨') ? '#F87171' : log.includes('APPROVED') || log.includes('✅') || log.includes('🎉') ? '#34D399' : log.includes('FLAGGED') || log.includes('⚠️') ? '#FBBF24' : log.includes('INTERCEPT') || log.includes('⚡') ? '#00F2FE' : '#94A3B8',
                }}
              >
                {log}
              </div>
            ))}
          </div>

          {/* Verification Verdict Banner */}
          {verificationResult && (
            <div
              style={{
                marginTop: 18,
                padding: 18,
                borderRadius: 16,
                background: verificationResult.status === 'FAIL' ? 'rgba(251, 113, 133, 0.08)' : verificationResult.status === 'WARN' ? 'rgba(251, 191, 36, 0.08)' : 'rgba(52, 211, 153, 0.08)',
                border: `1px solid ${verificationResult.status === 'FAIL' ? 'rgba(251, 113, 133, 0.35)' : verificationResult.status === 'WARN' ? 'rgba(251, 191, 36, 0.35)' : 'rgba(52, 211, 153, 0.35)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: 8,
                      background: verificationResult.status === 'FAIL' ? 'rgba(251, 113, 133, 0.2)' : verificationResult.status === 'WARN' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                      color: verificationResult.status === 'FAIL' ? 'var(--rose)' : verificationResult.status === 'WARN' ? 'var(--amber)' : 'var(--emerald)',
                    }}
                  >
                    VERDICT: {verificationResult.status}
                  </span>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
                    Compliance Score: {verificationResult.score}/100
                  </span>
                </div>

                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                  Latency: {verificationResult.latencyMs}ms
                </span>
              </div>

              <p style={{ fontSize: 12.5, color: 'rgba(226, 232, 240, 0.9)', lineHeight: 1.5, marginBottom: 8 }}>
                {verificationResult.explanation}
              </p>

              {verificationResult.recommendation && (
                <div style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', background: 'rgba(0, 242, 254, 0.06)', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(0, 242, 254, 0.15)' }}>
                  💡 Fix: {verificationResult.recommendation}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

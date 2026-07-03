"use client";

import { useState } from 'react';
import { PackageInput, AuditVerdict } from '@/lib/types';

export default function Home() {
  const [input, setInput] = useState('lodash@4.17.20\nreact@18.2.0');
  const [projectLicense, setProjectLicense] = useState('MIT License');
  const [verdict, setVerdict] = useState<AuditVerdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVerdict(null);

    const packages: PackageInput[] = input.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const lastAt = line.lastIndexOf('@');
        if (lastAt > 0) {
            return {
                name: line.substring(0, lastAt),
                version: line.substring(lastAt + 1),
                ecosystem: 'npm'
            };
        }
        return { name: line, ecosystem: 'npm' };
      });

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages, projectLicense }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data: AuditVerdict = await res.json();
      setVerdict(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run audit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left Column: Input Form */}
      <div className="xl:col-span-5 space-y-6">
        <section className="glass-panel p-8 rounded-xl glow-violet">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">New Security Audit</h1>
            <p className="text-on-surface-variant">Analyze package dependencies for compliance and critical vulnerabilities.</p>
          </div>
          <form className="space-y-6" onSubmit={handleAudit}>
            <div>
              <label className="block font-label-mono text-label-mono mb-2 text-on-surface-variant">Project License Type</label>
              <div className="relative">
                <select 
                  className="w-full bg-surface-container-lowest border border-white/10 rounded-lg p-4 appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                  value={projectLicense}
                  onChange={e => setProjectLicense(e.target.value)}
                >
                  <option value="MIT">MIT License</option>
                  <option value="APACHE-2.0">Apache 2.0</option>
                  <option value="GPL-3.0">GNU GPLv3</option>
                  <option value="BSD-3-Clause">BSD 3-Clause</option>
                  <option value="PROPRIETARY">Proprietary / Closed Source</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">expand_more</span>
              </div>
            </div>
            <div>
              <label className="block font-label-mono text-label-mono mb-2 text-on-surface-variant">Dependencies (Package@Version)</label>
              <textarea 
                className="w-full bg-surface-container-lowest border border-white/10 rounded-lg p-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface font-label-mono text-sm placeholder:text-on-surface-variant/30" 
                placeholder="lodash@4.17.21&#10;react@18.2.0" 
                rows={8}
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </div>
            <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-on-primary-fixed font-bold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">security</span>
              {loading ? 'RUNNING AUDIT...' : 'RUN INTEL AUDIT'}
            </button>
            {error && <p className="text-error text-sm mt-2">{error}</p>}
          </form>
        </section>
      </div>

      {/* Right Column: Verdict & Table */}
      <div className="xl:col-span-7 space-y-6">
        {verdict ? (
            <>
              {/* Verdict Section */}
              <section className={`glass-panel p-8 rounded-xl ${verdict.status === 'APPROVED' ? 'border-secondary/30 glow-violet' : 'border-error/30 glow-red'} animate-in fade-in slide-in-from-bottom-4 duration-700`}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${verdict.status === 'APPROVED' ? 'bg-secondary/20 border-secondary/50 text-secondary' : 'bg-error-container border-error/50 text-error'}`}>
                    <span className="material-symbols-outlined text-4xl" style={{fontVariationSettings: "'FILL' 1"}}>{verdict.status === 'APPROVED' ? 'check_circle' : 'warning'}</span>
                  </div>
                  <div className="flex-grow text-center md:text-left">
                    <div className={`status-chip px-3 py-1 rounded-full text-xs font-bold inline-block mb-2 ${verdict.status === 'APPROVED' ? 'bg-secondary/20 text-secondary' : 'bg-error-container/40 text-error'}`}>{verdict.status}</div>
                    <h2 className={`text-4xl font-bold mb-1 ${verdict.status === 'APPROVED' ? 'text-secondary' : 'text-error'}`}>
                        {verdict.status === 'APPROVED' ? 'All Systems Go' : `${verdict.risks.length} Risks Found`}
                    </h2>
                    <p className="text-on-surface-variant">
                        {verdict.status === 'APPROVED' ? 'No license conflicts or known vulnerabilities detected.' : 'License conflicts and/or vulnerabilities detected in the analyzed packages.'}
                    </p>
                    
                    {verdict.capTransaction && (
                        <div className="mt-4 p-3 bg-surface-container-highest rounded-lg text-sm border border-white/5">
                            <span className="text-on-surface-variant font-label-mono">CROO SETTLEMENT:</span> <span className="text-primary">{verdict.capTransaction.orderId}</span>
                        </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Data Table Section */}
              <section className="glass-panel rounded-xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Risk Breakdown</h3>
                  <div className="flex gap-2">
                    <span className="status-chip text-[10px] bg-error-container/20 text-error px-2 py-1 rounded">RISKS: {verdict.risks.length}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 font-label-mono text-xs text-on-surface-variant uppercase tracking-wider">
                        <th className="p-4 pl-8">Package Name</th>
                        <th className="p-4">Type</th>
                        <th className="p-4 text-center">Severity</th>
                        <th className="p-4 pr-8 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {verdict.risks.length === 0 ? (
                            <tr><td colSpan={4} className="text-center p-8 text-on-surface-variant">No risks detected.</td></tr>
                        ) : (
                            verdict.risks.map((risk, i) => (
                              <tr key={i} className="group hover:bg-white/5 transition-colors">
                                <td className="p-4 pl-8 flex items-center gap-4 relative">
                                  <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${risk.severity === 'HIGH' ? 'bg-error glow-red' : 'bg-tertiary-container'}`}></div>
                                  <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center">
                                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-on-surface">{risk.package}</p>
                                  </div>
                                </td>
                                <td className="p-4"><span className="text-sm">{risk.type}</span></td>
                                <td className="p-4 text-center">
                                  <span className={`status-chip px-2 py-1 rounded-md text-[10px] border ${risk.severity === 'HIGH' ? 'bg-error/10 text-error border-error/20' : 'bg-tertiary-container/10 text-tertiary border-tertiary-container/20'}`}>
                                      {risk.severity}
                                  </span>
                                </td>
                                <td className="p-4 pr-8 text-right text-xs text-on-surface-variant">
                                  {risk.detail}
                                </td>
                              </tr>
                            ))
                        )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant border border-dashed border-white/10 rounded-xl p-12">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-50">policy</span>
                <p>Run an audit to view the results here.</p>
            </div>
        )}
      </div>
    </div>
  );
}

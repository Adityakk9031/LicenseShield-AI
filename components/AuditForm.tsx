"use client";

import { useState } from 'react';
import { PackageInput, AuditVerdict } from '@/lib/types';

export default function AuditForm({ onAudit, loading }: { onAudit: (packages: PackageInput[], projectLicense: string) => void, loading: boolean }) {
  const [input, setInput] = useState('lodash@4.17.20\nexpress');
  const [projectLicense, setProjectLicense] = useState('MIT');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const packages: PackageInput[] = input.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Simple parse logic, fails on scoped packages with @ version, but fine for hackathon
        const lastAt = line.lastIndexOf('@');
        if (lastAt > 0) {
            return {
                name: line.substring(0, lastAt),
                version: line.substring(lastAt + 1),
                ecosystem: 'npm'
            };
        }
        return {
          name: line,
          ecosystem: 'npm'
        };
      });
      
    onAudit(packages, projectLicense);
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Target Project License</label>
          <select value={projectLicense} onChange={e => setProjectLicense(e.target.value)}>
            <option value="MIT">MIT</option>
            <option value="APACHE-2.0">Apache 2.0</option>
            <option value="GPL-3.0">GPL 3.0</option>
            <option value="PROPRIETARY">Proprietary</option>
          </select>
        </div>
        <div className="form-group">
          <label>Dependencies (one per line, format: name@version)</label>
          <textarea 
            rows={5} 
            value={input} 
            onChange={e => setInput(e.target.value)}
            placeholder="lodash@4.17.20&#10;express"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Auditing...' : 'Run Audit via CROO'}
        </button>
      </form>
    </div>
  );
}

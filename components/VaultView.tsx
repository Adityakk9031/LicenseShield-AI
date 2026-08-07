'use client';

import { useState } from 'react';

const LICENSE_KNOWLEDGE_BASE = [
  {
    id: 'mit',
    name: 'MIT License',
    type: 'Permissive',
    commercialUse: true,
    copyleftRisk: 'None',
    description: 'Extremely permissive license allowing commercial use, modification, distribution, and private use with minimal attribution requirement.',
    compatibleWith: ['MIT', 'Apache-2.0', 'GPL-3.0', 'Proprietary'],
  },
  {
    id: 'apache-2',
    name: 'Apache License 2.0',
    type: 'Permissive with Patent Grant',
    commercialUse: true,
    copyleftRisk: 'Low',
    description: 'Permissive license that provides explicit grant of patent rights from contributors. Requires preservation of copyright notices and trademark disclaimers.',
    compatibleWith: ['Apache-2.0', 'GPL-3.0', 'Proprietary'],
  },
  {
    id: 'bsd-3',
    name: 'BSD 3-Clause',
    type: 'Permissive',
    commercialUse: true,
    copyleftRisk: 'None',
    description: 'Permissive license with a clause prohibiting the use of author names for endorsement without specific written permission.',
    compatibleWith: ['MIT', 'Apache-2.0', 'GPL-3.0', 'Proprietary'],
  },
  {
    id: 'gpl-3',
    name: 'GNU General Public License v3.0 (GPL-3.0)',
    type: 'Strong Copyleft',
    commercialUse: true,
    copyleftRisk: 'High (Copyleft)',
    description: 'Strong copyleft license. Requires any derivative work or distributed application linking to this code to also be licensed under GPL-3.0 and open-sourced.',
    compatibleWith: ['GPL-3.0', 'AGPL-3.0'],
  },
  {
    id: 'agpl-3',
    name: 'GNU Affero General Public License v3.0 (AGPL-3.0)',
    type: 'Network Copyleft',
    commercialUse: true,
    copyleftRisk: 'Critical (SaaS Trigger)',
    description: 'Network copyleft license. Triggers source code disclosure obligations even if software is accessed over a network without physical distribution.',
    compatibleWith: ['AGPL-3.0'],
  },
  {
    id: 'mpl-2',
    name: 'Mozilla Public License 2.0 (MPL-2.0)',
    type: 'Weak Copyleft',
    commercialUse: true,
    copyleftRisk: 'Medium (File-level Copyleft)',
    description: 'File-level copyleft license. Modifications to MPL-covered files must be kept under MPL-2.0, but larger projects can combine them with proprietary modules.',
    compatibleWith: ['MPL-2.0', 'Apache-2.0', 'GPL-3.0', 'Proprietary'],
  },
];

export default function VaultView() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLicenses = LICENSE_KNOWLEDGE_BASE.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="vault-container">
      <div className="vault-header">
        <h1 className="vault-title">License Compliance Vault</h1>
        <p className="vault-subtitle">
          Enterprise open-source license taxonomy, compatibility rule matrix, and copyleft trigger reference.
        </p>

        <div className="search-bar-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search licenses by name, type, or copyleft risk (e.g. Copyleft, Permissive, AGPL)..."
            className="vault-search-input"
          />
        </div>
      </div>

      <div className="vault-grid">
        {filteredLicenses.map((lic) => (
          <div key={lic.id} className="vault-card glass-card">
            <div className="vault-card-top">
              <span className={`risk-pill ${lic.copyleftRisk.includes('High') || lic.copyleftRisk.includes('Critical') ? 'risk-high' : 'risk-low'}`}>
                {lic.copyleftRisk}
              </span>
              <span className="lic-type">{lic.type}</span>
            </div>

            <h3 className="lic-name">{lic.name}</h3>
            <p className="lic-desc">{lic.description}</p>

            <div className="lic-compat-section">
              <span className="compat-label">Compatible Target Licenses:</span>
              <div className="compat-tags">
                {lic.compatibleWith.map((t, idx) => (
                  <span key={idx} className="compat-tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

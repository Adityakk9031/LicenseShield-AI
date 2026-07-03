import { RiskItem } from '@/lib/types';

export default function RiskTable({ risks }: { risks: RiskItem[] }) {
  if (risks.length === 0) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No risks detected.</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Package</th>
            <th>Type</th>
            <th>Severity</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {risks.map((risk, i) => (
            <tr key={i}>
              <td><strong>{risk.package}</strong></td>
              <td>{risk.type}</td>
              <td>
                <span className={`badge ${risk.severity === 'HIGH' ? 'error' : risk.severity === 'MEDIUM' ? 'warning' : 'success'}`}>
                  {risk.severity}
                </span>
              </td>
              <td style={{ color: 'var(--text-muted)' }}>{risk.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

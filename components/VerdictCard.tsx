import { AuditVerdict } from '@/lib/types';

export default function VerdictCard({ verdict }: { verdict: AuditVerdict }) {
  const isApproved = verdict.status === 'APPROVED';
  
  return (
    <div className="card" style={{ textAlign: 'center', borderColor: isApproved ? 'var(--success)' : 'var(--error)' }}>
      <h2 style={{ color: isApproved ? 'var(--success)' : 'var(--error)', fontSize: '2rem', margin: '0 0 1rem 0' }}>
        {isApproved ? 'APPROVED ✓' : 'FLAGGED ⚠'}
      </h2>
      
      {verdict.settlementTxHash && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Base Sepolia On-Chain Settlement</div>
          <div><strong>TX Hash:</strong> <span style={{ fontFamily: 'monospace' }}>{verdict.settlementTxHash}</span></div>
          <div><strong>Status:</strong> <span style={{ color: 'var(--success)' }}>COMPLETED</span></div>
        </div>
      )}


      {verdict.suggestions.length > 0 && (
        <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>AI Suggestions</h3>
          <ul style={{ color: 'var(--text-muted)', paddingLeft: '1.2rem', margin: 0 }}>
            {verdict.suggestions.map((s, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

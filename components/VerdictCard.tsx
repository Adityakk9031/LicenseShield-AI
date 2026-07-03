import { AuditVerdict } from '@/lib/types';

export default function VerdictCard({ verdict }: { verdict: AuditVerdict }) {
  const isApproved = verdict.status === 'APPROVED';
  
  return (
    <div className="card" style={{ textAlign: 'center', borderColor: isApproved ? 'var(--success)' : 'var(--error)' }}>
      <h2 style={{ color: isApproved ? 'var(--success)' : 'var(--error)', fontSize: '2rem', margin: '0 0 1rem 0' }}>
        {isApproved ? 'APPROVED ✓' : 'FLAGGED ⚠'}
      </h2>
      
      {verdict.capTransaction && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CROO CAP Settlement</div>
          <div><strong>Order ID:</strong> {verdict.capTransaction.orderId}</div>
          <div><strong>Negotiation ID:</strong> {verdict.capTransaction.negotiationId}</div>
          <div><strong>Status:</strong> <span style={{ color: 'var(--accent)' }}>{verdict.capTransaction.status}</span></div>
          <div><strong>Settled At:</strong> {new Date(verdict.capTransaction.settledAt).toLocaleString()}</div>
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

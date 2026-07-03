export default function PackageBadge({ label, type }: { label: string; type: 'success' | 'warning' | 'error' | 'default' }) {
  let colorClass = '';
  switch (type) {
    case 'success': colorClass = 'success'; break;
    case 'warning': colorClass = 'warning'; break;
    case 'error': colorClass = 'error'; break;
    default: colorClass = '';
  }
  
  return (
    <span className={`badge ${colorClass}`} style={!colorClass ? { background: 'rgba(255,255,255,0.1)' } : {}}>
      {label}
    </span>
  );
}

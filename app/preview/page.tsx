'use client';

// Preview route for visual QA of the redesigned dashboard pages.
// Not linked anywhere in the product UI.
import DashboardLayout from '@/app/dashboard/layout';
import DashboardPage from '@/app/dashboard/page';
import KeysPage from '@/app/dashboard/keys/page';
import LogsPage from '@/app/dashboard/logs/page';
import BillingPage from '@/app/billing/page';
import { useState } from 'react';

const TABS = [
  { label: 'Overview', Comp: DashboardPage },
  { label: 'API Keys', Comp: KeysPage },
  { label: 'Audit Logs', Comp: LogsPage },
  { label: 'Billing', Comp: BillingPage },
] as const;

export default function DashboardPreview() {
  const [active, setActive] = useState(0);
  const ActiveComp = TABS[active].Comp;

  return (
    <div>
      <div
        style={{
          position: 'fixed',
          top: 8,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          gap: 6,
          background: '#0F172A',
          padding: 6,
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(15,23,42,0.3)',
        }}
      >
        {TABS.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              background: i === active ? '#6366F1' : 'transparent',
              color: i === active ? '#fff' : '#94A3B8',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <DashboardLayout>
        <ActiveComp />
      </DashboardLayout>
    </div>
  );
}

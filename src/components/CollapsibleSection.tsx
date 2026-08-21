import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

/**
 * A titled section with a chevron toggle — pulled out as its own
 * component rather than duplicated in LabManage.tsx and
 * AdminDashboard.tsx's hospital detail view, since both needed the exact
 * same "settings page with several collapsible blocks" pattern.
 */
export function CollapsibleSection({ title, children, defaultExpanded = true }: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 18, marginBottom: 16 }}>
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <h2 style={{ fontSize: 16, margin: 0 }}>{title}</h2>
        <span
          style={{
            display: 'inline-block',
            fontSize: 14,
            color: 'var(--ink-soft)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease'
          }}
        >
          ▾
        </span>
      </div>
      {expanded && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  );
}

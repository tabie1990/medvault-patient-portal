import { useEffect, useState } from 'react';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

const STATUS_OPTIONS: api.LabOrderStatus[] = ['requested', 'scheduled', 'sample_collected', 'in_progress', 'completed', 'cancelled'];

const STATUS_COLORS: Record<api.LabOrderStatus, string> = {
  requested: 'var(--clay)',
  scheduled: 'var(--clay)',
  sample_collected: 'var(--teal)',
  in_progress: 'var(--teal)',
  completed: 'var(--success)',
  cancelled: 'var(--danger)'
};

export function LabDashboard() {
  const { t } = useLang();
  const [orders, setOrders] = useState<api.FullLabOrder[] | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    const res = await api.getMyLabOrders();
    setOrders(res.lab_orders);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStatusChange(orderId: string, status: api.LabOrderStatus) {
    setUpdatingId(orderId);
    try {
      await api.updateLabOrderStatus(orderId, status);
      await load();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>{t('labOrders')}</h1>

      {orders && orders.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('noLabOrdersYet')}</p>}

      <div style={{ display: 'grid', gap: 12 }}>
        {orders?.map((o) => (
          <div
            key={o.id}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: '16px 18px',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{o.orderRef}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
                  {o.items.map((i) => i.labService.testName).join(', ')}
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: o.paymentStatus === 'paid' ? '#E4F3EA' : '#FBF1E8',
                  color: o.paymentStatus === 'paid' ? 'var(--success)' : 'var(--clay)'
                }}
              >
                {o.paymentStatus === 'paid' ? t('paid') : o.paymentStatus === 'pending' ? t('pending') : t('unpaid')}
              </span>
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>
              {t('status')}
            </label>
            <select
              value={o.status}
              onChange={(e) => handleStatusChange(o.id, e.target.value as api.LabOrderStatus)}
              disabled={updatingId === o.id}
              style={{
                padding: '8px 10px',
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 8,
                border: `1.5px solid ${STATUS_COLORS[o.status]}`,
                color: STATUS_COLORS[o.status],
                background: 'var(--white)'
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useLang } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import * as api from '../lib/api';

export function MyAppointments() {
  const { t } = useLang();
  const { globalPatientId } = useAuth();
  const [appointments, setAppointments] = useState<api.Appointment[] | null>(null);

  useEffect(() => {
    if (!globalPatientId) return;
    api.getPatientTimeline(globalPatientId).then((res) => setAppointments(res.appointments));
  }, [globalPatientId]);

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>{t('myAppointments')}</h1>

      {appointments && appointments.length === 0 && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('noAppointmentsYet')}</p>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {appointments?.map((a) => (
          <div
            key={a.id}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: '16px 18px',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{t('teleconsult')}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 3 }}>
                  {a.requestedDate ? new Date(a.requestedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : ''} · {a.requestedTime}
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: a.paymentStatus === 'paid' ? '#E4F3EA' : '#FBF1E8',
                  color: a.paymentStatus === 'paid' ? 'var(--success)' : 'var(--clay)'
                }}
              >
                {a.paymentStatus === 'paid' ? t('paid') : a.paymentStatus === 'pending' ? t('pending') : t('unpaid')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

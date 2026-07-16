import { useEffect, useState } from 'react';
import { useLang } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import * as api from '../lib/api';

export function MyAppointments() {
  const { t } = useLang();
  const { userId } = useAuth();
  const [appointments, setAppointments] = useState<api.Appointment[] | null>(null);
  const [sessions, setSessions] = useState<api.TelemedicineSession[]>([]);

  useEffect(() => {
    if (!userId) return;
    api.getPatientTimeline(userId).then((res) => {
      setAppointments(res.appointments);
      setSessions(res.telemedicine_sessions);
    });
  }, [userId]);

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>{t('myAppointments')}</h1>

      {appointments && appointments.length === 0 && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('noAppointmentsYet')}</p>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {appointments?.map((a) => {
          const session = sessions.find((s) => s.appointmentId === a.id);
          const hasRoom = Boolean(session?.roomUrl);

          return (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: hasRoom ? 12 : 0 }}>
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

              {hasRoom && (
                <a
                  href={session!.roomUrl!}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '11px 16px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--white)',
                    background: 'var(--success)',
                    borderRadius: 8,
                    textDecoration: 'none'
                  }}
                >
                  {t('joinCall')}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

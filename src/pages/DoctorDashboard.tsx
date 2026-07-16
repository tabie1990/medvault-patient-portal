import { useEffect, useState } from 'react';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

export function DoctorDashboard() {
  const { t } = useLang();
  const [appointments, setAppointments] = useState<api.AppointmentWithSession[] | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  async function load() {
    const res = await api.getMyAppointments();
    setAppointments(res.appointments);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStartSession(appointmentId: string) {
    setStartingId(appointmentId);
    try {
      const sessionRes = await api.createTelemedicineSession(appointmentId);
      const roomRes = await api.createRoomForSession(sessionRes.session.id);
      if (roomRes.session.roomUrl) {
        window.open(roomRes.session.roomUrl, '_blank');
      }
      await load();
    } catch {
      // Most likely appointment_not_paid_yet — reflected in the list's
      // own status badge already, no separate error banner needed here.
    } finally {
      setStartingId(null);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>{t('upcomingAppointments')}</h1>

      {appointments && appointments.length === 0 && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('noUpcomingAppointments')}</p>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {appointments?.map((a) => {
          const session = a.telemedicineSessions?.[0];
          const isPaid = a.paymentStatus === 'paid';
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{t('teleconsult')}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 3 }}>
                    {a.requestedDate
                      ? new Date(a.requestedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
                      : ''}{' '}
                    {a.requestedTime}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: isPaid ? '#E4F3EA' : '#FBF1E8',
                    color: isPaid ? 'var(--success)' : 'var(--clay)'
                  }}
                >
                  {isPaid ? t('paid') : a.paymentStatus === 'pending' ? t('pending') : t('unpaid')}
                </span>
              </div>

              {!isPaid && <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>{t('waitingForPayment')}</p>}

              {isPaid && hasRoom && (
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

              {isPaid && !hasRoom && (
                <button
                  onClick={() => handleStartSession(a.id)}
                  disabled={startingId === a.id}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--white)',
                    background: 'var(--teal)',
                    border: 'none',
                    borderRadius: 8,
                    opacity: startingId === a.id ? 0.6 : 1
                  }}
                >
                  {startingId === a.id ? t('startingSession') : t('startSession')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export function DoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLang();
  const navigate = useNavigate();

  const [slots, setSlots] = useState<Record<string, string[]> | null>(null);
  const [doctor, setDoctor] = useState<api.Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<api.Appointment | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getDoctorPublic(id).then((res) => setDoctor(res.doctor));
    api.getDoctorAvailability(id, 7).then((res) => {
      setSlots(res.slots);
      const firstDateWithSlots = Object.entries(res.slots).find(([, times]) => times.length > 0)?.[0];
      setSelectedDate(firstDateWithSlots ?? Object.keys(res.slots)[0] ?? null);
    });
  }, [id]);

  async function handleBook() {
    if (!id || !selectedDate || !selectedTime) return;
    setBooking(true);
    try {
      const res = await api.createAppointment({
        doctor_id: id,
        appointment_type: 'teleconsult',
        requested_date: selectedDate,
        requested_time: selectedTime
      });
      setBookedAppointment(res.appointment);
    } finally {
      setBooking(false);
    }
  }

  function dayLabel(dateStr: string) {
    const d = new Date(`${dateStr}T00:00:00Z`);
    const dayName = (lang === 'fr' ? DAY_NAMES_FR : DAY_NAMES_EN)[d.getUTCDay()];
    const dayNum = d.getUTCDate();
    return { dayName, dayNum };
  }

  if (bookedAppointment) {
    return <PaymentStep appointment={bookedAppointment} doctor={doctor} />;
  }

  return (
    <div>
      <Link to="/" style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
        ← {t('backToDoctors')}
      </Link>

      <h1 style={{ fontSize: 22, marginBottom: 4 }}>{t('selectADate')}</h1>

      {!slots && <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>…</p>}

      {slots && (
        <>
          {/* Signature element — the appointment book strip. Warm clay accent
              marks a genuinely open day, quiet grey marks a closed one —
              meant to feel like flipping through a real appointment book,
              not scanning a generic calendar widget. */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0 20px', marginTop: 14 }}>
            {Object.entries(slots).map(([dateStr, times]) => {
              const { dayName, dayNum } = dayLabel(dateStr);
              const hasSlots = times.length > 0;
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setSelectedTime(null);
                  }}
                  disabled={!hasSlots}
                  style={{
                    minWidth: 64,
                    padding: '10px 8px',
                    borderRadius: 12,
                    border: isSelected ? '2px solid var(--navy)' : '1.5px solid var(--line)',
                    background: isSelected ? 'var(--navy)' : hasSlots ? 'var(--white)' : '#F3F1EC',
                    color: isSelected ? 'var(--white)' : hasSlots ? 'var(--ink)' : 'var(--ink-soft)',
                    textAlign: 'center',
                    flexShrink: 0,
                    opacity: hasSlots ? 1 : 0.55
                  }}
                >
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 700 }}>
                    {dayName.slice(0, 3)}
                  </div>
                  <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{dayNum}</div>
                  {hasSlots && !isSelected && (
                    <div style={{ width: 5, height: 5, borderRadius: 5, background: 'var(--clay)', margin: '4px auto 0' }} />
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <>
              <h2 style={{ fontSize: 16, marginBottom: 10 }}>{t('selectATime')}</h2>
              {slots[selectedDate].length === 0 ? (
                <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('noSlotsThisDay')}</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8, marginBottom: 24 }}>
                  {slots[selectedDate].map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: 8,
                        border: selectedTime === time ? '2px solid var(--teal)' : '1.5px solid var(--line)',
                        background: selectedTime === time ? 'var(--teal-light)' : 'var(--white)',
                        color: 'var(--ink)',
                        fontWeight: 600,
                        fontSize: 14
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <button
            onClick={handleBook}
            disabled={!selectedTime || booking}
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--white)',
              background: selectedTime ? 'var(--navy)' : 'var(--ink-soft)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              opacity: booking ? 0.7 : 1
            }}
          >
            {booking ? t('booking') : t('bookThisSlot')}
          </button>
        </>
      )}
    </div>
  );
}

function PaymentStep({ appointment, doctor }: { appointment: api.Appointment; doctor: api.Doctor | null }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [status, setStatus] = useState<string>(appointment.paymentStatus);
  const [ussdCode, setUssdCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestPayment() {
    setRequesting(true);
    setError(null);
    try {
      // Real fee from the doctor's own record — never guessed or
      // hardcoded. If it's somehow still missing, refuse to request a
      // payment for an unknown amount rather than silently sending 0.
      const amount = Number(doctor?.teleconsultFee ?? 0);
      if (!amount) {
        setError(t('somethingWentWrong'));
        return;
      }
      const res = await api.requestAppointmentPayment(appointment.id, phone, amount);
      setUssdCode(res.ussd_code ?? null);
      setStatus('pending');
    } catch (e: any) {
      // Found in testing: this call failing silently left the patient
      // with no feedback at all — button just stopped spinning, nothing
      // else happened. Surface whatever the backend actually said went
      // wrong (e.g. an invalid phone number format) instead of that.
      setError(e?.raw?.error || e?.message || t('somethingWentWrong'));
    } finally {
      setRequesting(false);
    }
  }

  async function handleRefresh() {
    const res = await api.getAppointmentPaymentStatus(appointment.id);
    setStatus(res.status);
  }

  const statusLabel = status === 'paid' ? t('paid') : status === 'pending' ? t('pending') : t('unpaid');

  return (
    <div style={{ maxWidth: 420, margin: '20px auto 0' }}>
      <div style={{ background: 'var(--teal-light)', borderRadius: 'var(--radius)', padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)', marginBottom: 6 }}>✓ {t('bookingConfirmed')}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          {appointment.appointmentRef} ·{' '}
          {appointment.requestedDate ? new Date(appointment.requestedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : ''}{' '}
          {appointment.requestedTime}
        </div>
      </div>

      <h2 style={{ fontSize: 17, marginBottom: 4 }}>{t('payNow')}</h2>
      {doctor?.teleconsultFee && (
        <p style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--navy)', marginBottom: 16 }}>
          {Number(doctor.teleconsultFee).toLocaleString()} FCFA
        </p>
      )}

      {error && (
        <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {status !== 'paid' && (
        <>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>
            {t('momoNumber')}
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="237 6XX XXX XXX"
            style={{ width: '100%', padding: '12px 14px', fontSize: 16, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box', marginBottom: 12 }}
          />
          <button
            onClick={handleRequestPayment}
            disabled={requesting || phone.length < 9}
            style={{
              width: '100%',
              padding: '13px 16px',
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--white)',
              background: 'var(--teal)',
              border: 'none',
              borderRadius: 8,
              opacity: requesting || phone.length < 9 ? 0.6 : 1
            }}
          >
            {requesting ? t('requestingPayment') : t('requestPayment')}
          </button>
          {ussdCode && <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 12 }}>{t('checkUssdPrompt')}</p>}
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t('paymentStatus')}</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: status === 'paid' ? 'var(--success)' : status === 'pending' ? 'var(--clay)' : 'var(--ink-soft)'
          }}
        >
          {statusLabel}
        </span>
      </div>
      {status !== 'paid' && (
        <button onClick={handleRefresh} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 13, fontWeight: 600, marginTop: 10 }}>
          {t('refreshStatus')}
        </button>
      )}

      <button
        onClick={() => navigate('/appointments')}
        style={{ width: '100%', marginTop: 24, background: 'none', border: '1.5px solid var(--line)', borderRadius: 8, padding: '12px 16px', fontWeight: 600, color: 'var(--navy)' }}
      >
        {t('myAppointments')}
      </button>
    </div>
  );
}

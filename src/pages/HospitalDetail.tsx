import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import * as api from '../lib/api';

const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HospitalDetail() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const { t, lang } = useLang();
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [hospital, setHospital] = useState<api.PublicHospital | null>(null);
  const [doctors, setDoctors] = useState<api.HospitalDoctor[] | null>(null);
  const [services, setServices] = useState<api.HospitalServiceItem[] | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<api.HospitalDoctor | null>(null);
  const [slots, setSlots] = useState<Record<string, string[]> | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<api.Appointment | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hospitalId) return;
    api.getPublicHospital(hospitalId).then((res) => setHospital(res.hospital));
    api.getPublicHospitalDoctors(hospitalId).then((res) => setDoctors(res.doctors));
    api.getPublicHospitalServices(hospitalId).then((res) => setServices(res.services));
  }, [hospitalId]);

  async function handleSelectDoctor(doctor: api.HospitalDoctor) {
    if (!hospitalId) return;
    setSelectedDoctor(doctor);
    setSlots(null);
    setSelectedDate(null);
    setSelectedTime(null);
    const res = await api.getHospitalDoctorSlots(hospitalId, doctor.id, 7);
    setSlots(res.slots);
    const firstDateWithSlots = Object.entries(res.slots).find(([, times]) => times.length > 0)?.[0];
    setSelectedDate(firstDateWithSlots ?? Object.keys(res.slots)[0] ?? null);
  }

  function dayLabel(dateStr: string) {
    const d = new Date(`${dateStr}T00:00:00Z`);
    const dayName = (lang === 'fr' ? DAY_NAMES_FR : DAY_NAMES_EN)[d.getUTCDay()];
    const dayNum = d.getUTCDate();
    return { dayName, dayNum };
  }

  async function handleBookWithoutDoctor() {
    if (!hospitalId) return;
    if (!userId) {
      navigate('/login');
      return;
    }
    setBooking(true);
    setError('');
    try {
      const res = await api.createAppointment({ hospital_id: hospitalId, appointment_type: 'in_person', global_patient_id: userId });
      setBookedAppointment(res.appointment);
    } catch {
      setError(t('somethingWentWrong'));
    } finally {
      setBooking(false);
    }
  }

  async function handleBookWithDoctor() {
    if (!hospitalId || !selectedDoctor || !selectedDate || !selectedTime) return;
    if (!userId) {
      navigate('/login');
      return;
    }
    setBooking(true);
    setError('');
    try {
      const res = await api.createAppointment({
        hospital_id: hospitalId,
        hospital_doctor_roster_id: selectedDoctor.id,
        appointment_type: 'in_person',
        requested_date: selectedDate,
        requested_time: selectedTime,
        global_patient_id: userId
      });
      setBookedAppointment(res.appointment);
    } catch {
      setError(t('somethingWentWrong'));
    } finally {
      setBooking(false);
    }
  }

  if (bookedAppointment) {
    return <PaymentStep appointment={bookedAppointment} hospital={hospital} />;
  }

  return (
    <div>
      <Link to="/find-a-hospital" style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
        ← {t('findAHospital')}
      </Link>

      {services && services.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {services.map((s) => (
            <span key={s.id} style={{ fontSize: 12, padding: '5px 12px', background: 'var(--teal-light)', borderRadius: 20, fontWeight: 600 }}>
              {s.name}
            </span>
          ))}
        </div>
      )}

      {!selectedDoctor && (
        <>
          <h2 style={{ fontSize: 16, marginBottom: 10 }}>{t('hospitalDoctorRoster')}</h2>
          {doctors && doctors.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 20 }}>{t('noRosterYet')}</p>}
          <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
            {doctors?.map((d) => (
              <button
                key={d.id}
                onClick={() => handleSelectDoctor(d)}
                style={{
                  textAlign: 'left',
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  padding: '14px 16px',
                  boxShadow: 'var(--shadow)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{d.fullName}</div>
                {d.specialty && <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{d.specialty}</div>}
                {d.workingHours.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6 }}>
                    {d.workingHours.map((w) => `${DAY_ABBR[w.dayOfWeek]} ${w.startTime}-${w.endTime}`).join(', ')}
                  </div>
                )}
              </button>
            ))}
          </div>

          {doctors && doctors.length === 0 && (
            <button
              onClick={handleBookWithoutDoctor}
              disabled={booking}
              style={{
                width: '100%',
                padding: '13px 16px',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--white)',
                background: 'var(--navy)',
                border: 'none',
                borderRadius: 8,
                opacity: booking ? 0.6 : 1
              }}
            >
              {booking ? t('sending') : t('requestAppointment')}
            </button>
          )}
        </>
      )}

      {selectedDoctor && (
        <>
          <button onClick={() => setSelectedDoctor(null)} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 13, fontWeight: 600, marginBottom: 14, cursor: 'pointer', padding: 0 }}>
            ← {selectedDoctor.fullName}
          </button>

          {!slots && <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>…</p>}

          {slots && (
            <>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0 20px' }}>
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
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 700 }}>{dayName.slice(0, 3)}</div>
                      <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{dayNum}</div>
                      {hasSlots && !isSelected && <div style={{ width: 5, height: 5, borderRadius: 5, background: 'var(--clay)', margin: '4px auto 0' }} />}
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

              {error && (
                <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>{error}</div>
              )}

              <button
                onClick={handleBookWithDoctor}
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
        </>
      )}
    </div>
  );
}

function PaymentStep({ appointment, hospital }: { appointment: api.Appointment; hospital: api.PublicHospital | null }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [status, setStatus] = useState<string>(appointment.paymentStatus);
  const [ussdCode, setUssdCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const flatFee = hospital?.flatBookingFee ? Number(hospital.flatBookingFee) : null;

  async function handleRequestPayment() {
    setRequesting(true);
    setError(null);
    try {
      if (!flatFee) {
        setError(t('somethingWentWrong'));
        return;
      }
      const res = await api.requestAppointmentPayment(appointment.id, phone, flatFee);
      setUssdCode(res.ussd_code ?? null);
      setStatus('pending');
    } catch (e: any) {
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

  // No flat fee at all — confirmed as soon as the booking itself
  // succeeded, matching the same "no payment step needed" behavior the
  // WhatsApp agent follows for a hospital with nothing configured.
  if (!flatFee) {
    return (
      <div style={{ maxWidth: 420, margin: '60px auto 0', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>{t('appointmentRequested')}</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.6 }}>{t('hospitalWillContact')}</p>
      </div>
    );
  }

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
      <p style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--navy)', marginBottom: 16 }}>{flatFee.toLocaleString()} FCFA</p>

      {error && <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {status !== 'paid' && (
        <>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('momoNumber')}</label>
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
        <span style={{ fontSize: 13, fontWeight: 700, color: status === 'paid' ? 'var(--success)' : status === 'pending' ? 'var(--clay)' : 'var(--ink-soft)' }}>{statusLabel}</span>
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

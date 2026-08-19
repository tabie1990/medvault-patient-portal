import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

export function DoctorDashboard() {
  const { t } = useLang();
  const [appointments, setAppointments] = useState<api.AppointmentWithSession[] | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [prescriptionsByAppointment, setPrescriptionsByAppointment] = useState<Record<string, api.Prescription[]>>({});
  const [openPrescriptionFormId, setOpenPrescriptionFormId] = useState<string | null>(null);
  const [rxSymptoms, setRxSymptoms] = useState('');
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [rxItemsText, setRxItemsText] = useState('');
  const [creatingRx, setCreatingRx] = useState(false);
  const [sendingRxId, setSendingRxId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function load() {
    const res = await api.getMyAppointments();
    setAppointments(res.appointments);
    const completed = res.appointments.filter((a) => a.status === 'completed');
    const entries = await Promise.all(
      completed.map(async (a) => {
        const r = await api.getPrescriptionsForAppointment(a.id);
        return [a.id, r.prescriptions] as const;
      })
    );
    setPrescriptionsByAppointment(Object.fromEntries(entries));
  }

  useEffect(() => {
    load();
    api.getMyDoctorProfile().then((res) => setVerificationStatus(res.doctor.verificationStatus));
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

  async function handleCopyLink(appointmentId: string, roomUrl: string) {
    await navigator.clipboard.writeText(roomUrl);
    setCopiedId(appointmentId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleMarkCompleted(appointmentId: string) {
    setCompletingId(appointmentId);
    try {
      await api.markAppointmentCompleted(appointmentId);
      await load();
    } finally {
      setCompletingId(null);
    }
  }

  function openPrescriptionForm(appointmentId: string) {
    setRxSymptoms('');
    setRxDiagnosis('');
    setRxNotes('');
    setRxItemsText('');
    setOpenPrescriptionFormId(appointmentId);
  }

  async function handleCreatePrescription(appointmentId: string) {
    const items: api.PrescriptionItem[] = rxItemsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((name) => ({ type: 'medication', name }));
    if (items.length === 0) return;
    setCreatingRx(true);
    try {
      const res = await api.createPrescription({
        appointment_id: appointmentId,
        symptoms: rxSymptoms || undefined,
        diagnosis: rxDiagnosis || undefined,
        notes: rxNotes || undefined,
        items
      });
      setPrescriptionsByAppointment((prev) => ({
        ...prev,
        [appointmentId]: [res.prescription, ...(prev[appointmentId] ?? [])]
      }));
      setOpenPrescriptionFormId(null);
    } finally {
      setCreatingRx(false);
    }
  }

  async function handleSendPrescription(appointmentId: string, prescriptionId: string) {
    setSendingRxId(prescriptionId);
    try {
      const res = await api.sendPrescription(prescriptionId);
      setPrescriptionsByAppointment((prev) => ({
        ...prev,
        [appointmentId]: (prev[appointmentId] ?? []).map((p) => (p.id === prescriptionId ? res.prescription : p))
      }));
    } finally {
      setSendingRxId(null);
    }
  }

  return (
    <div>
      {verificationStatus && verificationStatus !== 'verified' && (
        <Link
          to="/doctor/kyc"
          style={{
            display: 'block',
            background: 'var(--teal-light)',
            border: '1px solid var(--teal)',
            borderRadius: 'var(--radius)',
            padding: '14px 18px',
            marginBottom: 20,
            textDecoration: 'none'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 3 }}>{t('completeYourVerification')}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t('completeYourVerificationBody')}</div>
        </Link>
      )}

      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        <Link to="/doctor/profile" style={{ display: 'inline-block', fontSize: 13, fontWeight: 700, color: 'var(--teal)' }}>
          {t('myProfile')} →
        </Link>
        <Link to="/doctor/availability" style={{ display: 'inline-block', fontSize: 13, fontWeight: 700, color: 'var(--teal)' }}>
          {t('myAvailability')} →
        </Link>
        <Link to="/doctor/labs" style={{ display: 'inline-block', fontSize: 13, fontWeight: 700, color: 'var(--teal)' }}>
          {t('myLabs')} →
        </Link>
      </div>

      <h1 style={{ fontSize: 24, marginBottom: 18 }}>{t('upcomingAppointments')}</h1>

      {appointments && appointments.length === 0 && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('noUpcomingAppointments')}</p>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {appointments?.map((a) => {
          const session = a.telemedicineSession;
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
              <div
                onClick={() => toggleExpanded(a.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: expandedIds[a.id] ? 12 : 0, cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{t('teleconsult')}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 3 }}>
                    {a.requestedDate ? (
                      <>
                        {new Date(a.requestedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}{' '}
                        {a.requestedTime}
                      </>
                    ) : (
                      // Instant-consult appointments genuinely have no
                      // scheduled slot (see teleconsult-request.service.ts
                      // — there's no date to book, only "now") — but the
                      // exact moment it was actually booked (createdAt)
                      // is real data worth showing, not just a generic
                      // label with no time at all.
                      <>
                        ⚡ {t('instantConsultation')} —{' '}
                        {new Date(a.createdAt).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
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
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 14,
                      color: 'var(--ink-soft)',
                      transform: expandedIds[a.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease'
                    }}
                    aria-label={expandedIds[a.id] ? t('collapse') : t('expand')}
                  >
                    ▾
                  </span>
                </div>
              </div>

              {expandedIds[a.id] && (
                <>
                  {a.patient && (a.patient.fullName || a.patient.phone) && (
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>
                  {a.patient.fullName && <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{a.patient.fullName}</div>}
                  <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                    {a.patient.dob && <span>{t('dob')}: {new Date(a.patient.dob).toLocaleDateString(undefined, { timeZone: 'UTC' })}</span>}
                    {a.patient.phone && <span>📞 {a.patient.phone}</span>}
                  </div>
                </div>
              )}

              {!isPaid && <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>{t('waitingForPayment')}</p>}

              {isPaid && hasRoom && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={session!.roomUrl!}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
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
                  <button
                    onClick={() => handleCopyLink(a.id, session!.roomUrl!)}
                    style={{
                      padding: '11px 16px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--navy)',
                      background: 'var(--white)',
                      border: '1.5px solid var(--line)',
                      borderRadius: 8
                    }}
                  >
                    {copiedId === a.id ? `✓ ${t('copied')}` : t('copyLink')}
                  </button>
                </div>
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

              {isPaid && a.status !== 'completed' && (
                <button
                  onClick={() => handleMarkCompleted(a.id)}
                  disabled={completingId === a.id}
                  style={{
                    width: '100%',
                    marginTop: 8,
                    padding: '11px 16px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--navy)',
                    background: 'var(--white)',
                    border: '1.5px solid var(--line)',
                    borderRadius: 8,
                    opacity: completingId === a.id ? 0.6 : 1
                  }}
                >
                  {completingId === a.id ? t('markingCompleted') : t('markCompleted')}
                </button>
              )}

              {a.status === 'completed' && (
                <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', marginBottom: 8 }}>✓ {t('consultationCompleted')}</div>

                  {(prescriptionsByAppointment[a.id] ?? []).map((rx) => (
                    <div
                      key={rx.id}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line)' }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{rx.prescriptionRef}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{rx.items.length} {t('items')}</div>
                      </div>
                      {rx.status === 'sent_to_patient' ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>✓ {t('sentToPatient')}</span>
                      ) : (
                        <button
                          onClick={() => handleSendPrescription(a.id, rx.id)}
                          disabled={sendingRxId === rx.id}
                          style={{
                            padding: '7px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--white)',
                            background: 'var(--teal)',
                            border: 'none',
                            borderRadius: 6,
                            opacity: sendingRxId === rx.id ? 0.6 : 1
                          }}
                        >
                          {sendingRxId === rx.id ? t('sending') : t('sendToPatient')}
                        </button>
                      )}
                    </div>
                  ))}

                  {openPrescriptionFormId === a.id ? (
                    <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                      <textarea
                        value={rxSymptoms}
                        onChange={(e) => setRxSymptoms(e.target.value)}
                        placeholder={t('symptomsPlaceholder')}
                        rows={2}
                        style={{ padding: '8px 10px', fontSize: 13, border: '1.5px solid var(--line)', borderRadius: 8, resize: 'vertical' }}
                      />
                      <textarea
                        value={rxDiagnosis}
                        onChange={(e) => setRxDiagnosis(e.target.value)}
                        placeholder={t('diagnosisPlaceholder')}
                        rows={2}
                        style={{ padding: '8px 10px', fontSize: 13, border: '1.5px solid var(--line)', borderRadius: 8, resize: 'vertical' }}
                      />
                      <textarea
                        value={rxItemsText}
                        onChange={(e) => setRxItemsText(e.target.value)}
                        placeholder={t('itemsPlaceholder')}
                        rows={3}
                        style={{ padding: '8px 10px', fontSize: 13, border: '1.5px solid var(--line)', borderRadius: 8, resize: 'vertical' }}
                      />
                      <textarea
                        value={rxNotes}
                        onChange={(e) => setRxNotes(e.target.value)}
                        placeholder={t('notesPlaceholder')}
                        rows={2}
                        style={{ padding: '8px 10px', fontSize: 13, border: '1.5px solid var(--line)', borderRadius: 8, resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleCreatePrescription(a.id)}
                          disabled={creatingRx || !rxItemsText.trim()}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--white)',
                            background: 'var(--teal)',
                            border: 'none',
                            borderRadius: 8,
                            opacity: creatingRx || !rxItemsText.trim() ? 0.6 : 1
                          }}
                        >
                          {creatingRx ? t('creating') : t('createPrescription')}
                        </button>
                        <button
                          onClick={() => setOpenPrescriptionFormId(null)}
                          style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: 'var(--navy)', background: 'var(--white)', border: '1.5px solid var(--line)', borderRadius: 8 }}
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openPrescriptionForm(a.id)}
                      style={{ marginTop: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, color: 'var(--teal)', background: 'transparent', border: '1.5px solid var(--teal)', borderRadius: 8 }}
                    >
                      + {t('writePrescription')}
                    </button>
                  )}
                </div>
              )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

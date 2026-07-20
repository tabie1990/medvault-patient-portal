import { useEffect, useState } from 'react';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';
import { WeeklyScheduleEditor, type WeeklyWindow } from '../components/WeeklyScheduleEditor';

type Tab = 'kyc' | 'revenue' | 'errors' | 'stale' | 'hospitals';

export function AdminDashboard() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('kyc');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'kyc', label: t('tabKycQueue') },
    { key: 'revenue', label: t('tabRevenue') },
    { key: 'errors', label: t('tabErrors') },
    { key: 'stale', label: t('tabStaleSync') },
    { key: 'hospitals', label: t('tabHospitals') }
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--line)' }}>
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 700,
              background: 'none',
              border: 'none',
              borderBottom: tab === tb.key ? '2.5px solid var(--navy)' : '2.5px solid transparent',
              color: tab === tb.key ? 'var(--navy)' : 'var(--ink-soft)'
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'kyc' && <KycQueue />}
      {tab === 'revenue' && <RevenueTab />}
      {tab === 'errors' && <ErrorFeedTab />}
      {tab === 'stale' && <StaleSyncTab />}
      {tab === 'hospitals' && <HospitalsTab />}
    </div>
  );
}

function KycQueue() {
  const { t } = useLang();
  const [doctors, setDoctors] = useState<api.PendingDoctor[]>([]);
  const [labs, setLabs] = useState<api.PendingLabProvider[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await api.getPendingKyc();
    setDoctors(res.doctors);
    setLabs(res.lab_providers);
  }

  useEffect(() => {
    load();
  }, []);

  async function viewDoctorDoc(doctorId: string, field: 'national_id' | 'medical_license' | 'selfie') {
    // Opening the tab AFTER an await is a real, common bug — by the time
    // the async call resolves, the browser no longer treats window.open
    // as a direct response to the click and silently blocks it, with no
    // visible error at all. Open a blank tab synchronously first (still
    // within the click's own call stack), then navigate it once we have
    // the real URL.
    const tab = window.open('', '_blank');
    const res = await api.getDoctorDocumentUrl(doctorId, field);
    if (tab) tab.location.href = res.url;
  }

  async function viewLabDoc(labId: string, field: 'business_registration' | 'lab_accreditation' | 'owner_id') {
    const tab = window.open('', '_blank');
    const res = await api.getLabDocumentUrl(labId, field);
    if (tab) tab.location.href = res.url;
  }

  async function handleApproveDoctor(doctorId: string) {
    setBusyId(doctorId);
    try {
      await api.decideDoctorKyc(doctorId, true);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRejectDoctor(doctorId: string) {
    setBusyId(doctorId);
    try {
      await api.decideDoctorKyc(doctorId, false, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleApproveLab(labId: string) {
    setBusyId(labId);
    try {
      await api.decideLabKyc(labId, true);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRejectLab(labId: string) {
    setBusyId(labId);
    try {
      await api.decideLabKyc(labId, false, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const nothingPending = doctors.length === 0 && labs.length === 0;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>{t('kycReviewQueue')}</h1>

      {nothingPending && <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('noPendingReviews')}</p>}

      {doctors.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, marginBottom: 10 }}>{t('pendingDoctors')}</h2>
          <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
            {doctors.map((d) => (
              <div key={d.id} style={cardStyle}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{d.fullName}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>
                  {d.email ?? d.phone} {d.specialty ? `· ${d.specialty}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <DocLink label={t('nationalIdDoc')} onClick={() => viewDoctorDoc(d.id, 'national_id')} />
                  <DocLink label={t('medicalLicenseDoc')} onClick={() => viewDoctorDoc(d.id, 'medical_license')} />
                  <DocLink label={t('selfieDoc')} onClick={() => viewDoctorDoc(d.id, 'selfie')} />
                </div>

                {rejectingId === d.id ? (
                  <RejectForm
                    reason={rejectReason}
                    setReason={setRejectReason}
                    onConfirm={() => handleRejectDoctor(d.id)}
                    onCancel={() => setRejectingId(null)}
                    busy={busyId === d.id}
                    t={t}
                  />
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleApproveDoctor(d.id)} disabled={busyId === d.id} style={approveBtn}>
                      {t('approve')}
                    </button>
                    <button onClick={() => setRejectingId(d.id)} disabled={busyId === d.id} style={rejectBtn}>
                      {t('reject')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {labs.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, marginBottom: 10 }}>{t('pendingLabs')}</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {labs.map((l) => (
              <div key={l.id} style={cardStyle}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{l.name}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>
                  {l.city} {l.businessRegistrationNumber ? `· #${l.businessRegistrationNumber}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <DocLink label={t('businessRegDoc')} onClick={() => viewLabDoc(l.id, 'business_registration')} />
                  <DocLink label={t('labAccreditationDoc')} onClick={() => viewLabDoc(l.id, 'lab_accreditation')} />
                  <DocLink label={t('ownerIdDoc')} onClick={() => viewLabDoc(l.id, 'owner_id')} />
                </div>

                {rejectingId === l.id ? (
                  <RejectForm
                    reason={rejectReason}
                    setReason={setRejectReason}
                    onConfirm={() => handleRejectLab(l.id)}
                    onCancel={() => setRejectingId(null)}
                    busy={busyId === l.id}
                    t={t}
                  />
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleApproveLab(l.id)} disabled={busyId === l.id} style={approveBtn}>
                      {t('approve')}
                    </button>
                    <button onClick={() => setRejectingId(l.id)} disabled={busyId === l.id} style={rejectBtn}>
                      {t('reject')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RevenueTab() {
  const { t } = useLang();
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getRevenue>> | null>(null);

  useEffect(() => {
    api.getRevenue().then(setData);
  }, []);

  if (!data) return null;

  const fmt = (n: string | number) => Number(n).toLocaleString();

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label={t('platformRevenue')} value={`${fmt(data.platform_revenue_total)} FCFA`} accent="var(--success)" />
        <StatCard label={t('grossAppointments')} value={`${fmt(data.appointment_gross_total)} FCFA`} accent="var(--teal)" />
        <StatCard label={t('grossLabOrders')} value={`${fmt(data.lab_order_gross_total)} FCFA`} accent="var(--teal)" />
      </div>

      <h2 style={{ fontSize: 16, marginBottom: 10 }}>{t('recentPayouts')}</h2>
      {data.recent_payouts.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('noPayoutsYet')}</p>}
      <div style={{ display: 'grid', gap: 8 }}>
        {data.recent_payouts.map((p) => (
          <div key={p.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
              {p.appointmentId ? 'Teleconsult' : 'Lab order'} · {new Date(p.completedAt).toLocaleDateString()}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              <span style={{ color: 'var(--success)' }}>{fmt(p.platformAmount)}</span>
              <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}> / {fmt(p.providerAmount)} to provider</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorFeedTab() {
  const { t } = useLang();
  const [errors, setErrors] = useState<api.ErrorLogEntry[] | null>(null);

  useEffect(() => {
    api.getErrorFeed().then((res) => setErrors(res.errors));
  }, []);

  if (!errors) return null;

  return (
    <div>
      {errors.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('noErrorsLogged')}</p>}
      <div style={{ display: 'grid', gap: 8 }}>
        {errors.map((e) => (
          <div key={e.id} style={{ ...cardStyle, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>{e.source}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{new Date(e.createdAt).toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--ink)', wordBreak: 'break-word' }}>{e.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaleSyncTab() {
  const { t } = useLang();
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getStaleSyncs>> | null>(null);

  useEffect(() => {
    api.getStaleSyncs().then(setData);
  }, []);

  if (!data) return null;

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 16 }}>
        Threshold: {data.threshold_hours}h since last contact
      </p>
      {data.stale_installations.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('noStaleSyncs')}</p>}
      <div style={{ display: 'grid', gap: 8 }}>
        {data.stale_installations.map((inst) => (
          <div key={inst.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{inst.hospital.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{inst.deviceLabel ?? inst.hospital.hospitalId}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--clay)', fontWeight: 700 }}>
              {t('lastSeen')}: {inst.lastSeenAt ? new Date(inst.lastSeenAt).toLocaleString() : t('never')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HospitalsTab() {
  const { t } = useLang();
  const [hospitals, setHospitals] = useState<api.AdminHospital[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [regId, setRegId] = useState('');
  const [regCode, setRegCode] = useState('');
  const [regName, setRegName] = useState('');
  const [regCity, setRegCity] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await api.getAdminHospitals();
    setHospitals(res.hospitals);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRegister() {
    setSaving(true);
    try {
      await api.createHospital({ hospital_id: regId, hospital_code: regCode, name: regName, city: regCity || undefined });
      setRegId('');
      setRegCode('');
      setRegName('');
      setRegCity('');
      setShowRegister(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (!hospitals) return null;

  return (
    <div>
      {hospitals.length === 0 && !showRegister && <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 16 }}>{t('noHospitalsYet')}</p>}

      <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
        {hospitals.map((h) => (
          <div key={h.id} style={cardStyle}>
            <div
              onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{h.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  {h.hospitalId} · {h.city ?? ''} · {h.doctorRoster.length} doctors · {h.services.length} services
                </div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 700 }}>{expandedId === h.id ? '▲' : '▼'}</span>
            </div>

            {expandedId === h.id && <HospitalDetail hospital={h} onChange={load} t={t} />}
          </div>
        ))}
      </div>

      {showRegister ? (
        <div style={{ ...cardStyle, padding: 18 }}>
          <label style={smallLabel}>{t('hospitalName')}</label>
          <input value={regName} onChange={(e) => setRegName(e.target.value)} style={smallInput} />
          <label style={{ ...smallLabel, marginTop: 10 }}>{t('hospitalIdLabel')}</label>
          <input value={regId} onChange={(e) => setRegId(e.target.value)} style={smallInput} />
          <label style={{ ...smallLabel, marginTop: 10 }}>{t('hospitalCodeLabel')}</label>
          <input value={regCode} onChange={(e) => setRegCode(e.target.value.toUpperCase())} maxLength={3} style={smallInput} />
          <label style={{ ...smallLabel, marginTop: 10 }}>{t('city')}</label>
          <input value={regCity} onChange={(e) => setRegCity(e.target.value)} style={smallInput} />
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={handleRegister} disabled={saving || !regId || !regCode || !regName} style={approveBtn}>
              {saving ? '…' : t('register')}
            </button>
            <button onClick={() => setShowRegister(false)} style={{ ...rejectBtn, background: 'var(--ink-soft)' }}>
              {t('cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowRegister(true)} style={approveBtn}>
          + {t('registerAHospital')}
        </button>
      )}
    </div>
  );
}

function HospitalDetail({ hospital, onChange, t }: { hospital: api.AdminHospital; onChange: () => void; t: (k: any) => string }) {
  const [newService, setNewService] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState('');
  const [editingHoursFor, setEditingHoursFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAddService() {
    if (!newService) return;
    setBusy(true);
    try {
      await api.addHospitalService(hospital.hospitalId, newService);
      setNewService('');
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveService(serviceId: string) {
    setBusy(true);
    try {
      await api.deleteHospitalService(hospital.hospitalId, serviceId);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function handleAddDoctor() {
    if (!newDoctorName) return;
    setBusy(true);
    try {
      await api.addHospitalDoctor(hospital.hospitalId, { full_name: newDoctorName, specialty: newDoctorSpecialty || undefined });
      setNewDoctorName('');
      setNewDoctorSpecialty('');
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveDoctor(doctorId: string) {
    setBusy(true);
    try {
      await api.deleteHospitalDoctor(hospital.hospitalId, doctorId);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveHours(doctorId: string, windows: WeeklyWindow[]) {
    setBusy(true);
    try {
      await api.setHospitalDoctorHours(
        hospital.hospitalId,
        doctorId,
        windows.map((w) => ({ day_of_week: w.dayOfWeek, start_time: w.start, end_time: w.end }))
      );
      setEditingHoursFor(null);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
      <h3 style={{ fontSize: 14, marginBottom: 8 }}>{t('hospitalServices')}</h3>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {hospital.services.map((s) => (
          <span key={s.id} style={{ fontSize: 12, padding: '5px 10px', background: 'var(--teal-light)', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
            {s.name}
            <button onClick={() => handleRemoveService(s.id)} disabled={busy} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 700, padding: 0 }}>
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input value={newService} onChange={(e) => setNewService(e.target.value)} placeholder={t('addAHospitalService')} style={{ ...smallInput, flex: 1 }} />
        <button onClick={handleAddService} disabled={busy || !newService} style={approveBtn}>
          {t('add')}
        </button>
      </div>

      <h3 style={{ fontSize: 14, marginBottom: 8 }}>{t('hospitalDoctorRoster')}</h3>
      {hospital.doctorRoster.length === 0 && <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t('noRosterYet')}</p>}
      <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
        {hospital.doctorRoster.map((d) => (
          <div key={d.id} style={{ background: 'var(--paper)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{d.fullName}</span>
                {d.specialty && <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}> · {d.specialty}</span>}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEditingHoursFor(editingHoursFor === d.id ? null : d.id)} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  {t('setHours')}
                </button>
                <button onClick={() => handleRemoveDoctor(d.id)} disabled={busy} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  {t('remove')}
                </button>
              </div>
            </div>
            {d.workingHours.length > 0 && editingHoursFor !== d.id && (
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>
                {d.workingHours.map((w) => `${DAY_ABBR[w.dayOfWeek]} ${w.startTime}-${w.endTime}`).join(', ')}
              </div>
            )}
            {editingHoursFor === d.id && (
              <div style={{ marginTop: 10 }}>
                <WeeklyScheduleEditor
                  initialWindows={d.workingHours.map((w) => ({ dayOfWeek: w.dayOfWeek, start: w.startTime, end: w.endTime }))}
                  onSave={(windows) => handleSaveHours(d.id, windows)}
                  saving={busy}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={newDoctorName} onChange={(e) => setNewDoctorName(e.target.value)} placeholder={t('fullName')} style={{ ...smallInput, flex: 1 }} />
        <input value={newDoctorSpecialty} onChange={(e) => setNewDoctorSpecialty(e.target.value)} placeholder={t('specialtyLabel')} style={{ ...smallInput, flex: 1 }} />
        <button onClick={handleAddDoctor} disabled={busy || !newDoctorName} style={approveBtn}>
          {t('add')}
        </button>
      </div>
    </div>
  );
}

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const smallLabel = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginBottom: 4 };
const smallInput = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid var(--line)', borderRadius: 6, boxSizing: 'border-box' as const };

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ ...cardStyle, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent, fontFamily: 'var(--font-display)' }}>{value}</div>
    </div>
  );
}

function DocLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'var(--navy)', background: 'var(--teal-light)', border: 'none', borderRadius: 6 }}>
      {label}
    </button>
  );
}

function RejectForm({
  reason,
  setReason,
  onConfirm,
  onCancel,
  busy,
  t
}: {
  reason: string;
  setReason: (r: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
  t: (k: any) => string;
}) {
  return (
    <div>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t('rejectionReason')}
        style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid var(--line)', borderRadius: 6, boxSizing: 'border-box', marginBottom: 8 }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onConfirm} disabled={busy} style={rejectBtn}>
          {t('confirmReject')}
        </button>
        <button onClick={onCancel} disabled={busy} style={{ padding: '9px 16px', fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)', background: 'none', border: '1.5px solid var(--line)', borderRadius: 6 }}>
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}

const cardStyle = { background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '16px 18px', boxShadow: 'var(--shadow)' };
const approveBtn = { padding: '9px 18px', fontSize: 13, fontWeight: 700, color: 'var(--white)', background: 'var(--success)', border: 'none', borderRadius: 6 };
const rejectBtn = { padding: '9px 18px', fontSize: 13, fontWeight: 700, color: 'var(--white)', background: 'var(--danger)', border: 'none', borderRadius: 6 };

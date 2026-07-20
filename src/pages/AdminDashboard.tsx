import { useEffect, useState } from 'react';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

type Tab = 'kyc' | 'revenue' | 'errors' | 'stale';

export function AdminDashboard() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('kyc');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'kyc', label: t('tabKycQueue') },
    { key: 'revenue', label: t('tabRevenue') },
    { key: 'errors', label: t('tabErrors') },
    { key: 'stale', label: t('tabStaleSync') }
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

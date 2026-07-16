import { useEffect, useState } from 'react';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

export function AdminDashboard() {
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
    const res = await api.getDoctorDocumentUrl(doctorId, field);
    window.open(res.url, '_blank');
  }

  async function viewLabDoc(labId: string, field: 'business_registration' | 'lab_accreditation' | 'owner_id') {
    const res = await api.getLabDocumentUrl(labId, field);
    window.open(res.url, '_blank');
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

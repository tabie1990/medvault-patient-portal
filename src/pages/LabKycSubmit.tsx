import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

type DocKind = 'business_registration' | 'lab_accreditation' | 'owner_id';

interface UploadState {
  file: File | null;
  key: string | null;
  uploading: boolean;
}

export function LabKycSubmit() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLang();
  const navigate = useNavigate();

  const [regNumber, setRegNumber] = useState('');
  const [docs, setDocs] = useState<Record<DocKind, UploadState>>({
    business_registration: { file: null, key: null, uploading: false },
    lab_accreditation: { file: null, key: null, uploading: false },
    owner_id: { file: null, key: null, uploading: false }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleFileSelected(kind: DocKind, file: File) {
    if (!id) return;
    setDocs((d) => ({ ...d, [kind]: { file, key: null, uploading: true } }));
    setError('');
    try {
      const { upload_url, key } = await api.getLabKycUploadUrl(id, file.name, file.type);
      await api.uploadToPresignedUrl(upload_url, file);
      setDocs((d) => ({ ...d, [kind]: { file, key, uploading: false } }));
    } catch {
      setError(t('uploadFailed'));
      setDocs((d) => ({ ...d, [kind]: { file: null, key: null, uploading: false } }));
    }
  }

  // Lab accreditation is optional — mirrors the backend's own validation,
  // which only requires business registration + owner ID.
  const canSubmit = regNumber && docs.business_registration.key && docs.owner_id.key;

  async function handleSubmit() {
    if (!id || !canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await api.submitLabKyc(id, {
        business_registration_number: regNumber,
        business_registration_key: docs.business_registration.key!,
        lab_accreditation_key: docs.lab_accreditation.key ?? undefined,
        owner_id_key: docs.owner_id.key!
      });
      setDone(true);
    } catch {
      setError(t('somethingWentWrong'));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 420, margin: '60px auto 0', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>{t('kycSubmitted')}</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{t('kycSubmittedBody')}</p>
        <Link to={`/doctor/labs/${id}`} style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 14 }}>
          {t('backToLabs')}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 460, margin: '20px auto 0' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>{t('verifyThisLab')}</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>{t('kycIntro')}</p>

      {error && (
        <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('businessRegNumber')}</label>
      <input
        value={regNumber}
        onChange={(e) => setRegNumber(e.target.value)}
        style={{ width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box', marginBottom: 16 }}
      />

      <UploadRow kind="business_registration" label={t('businessRegDoc')} state={docs.business_registration} onSelect={handleFileSelected} t={t} />
      <UploadRow kind="lab_accreditation" label={t('labAccreditationDoc')} state={docs.lab_accreditation} onSelect={handleFileSelected} t={t} />
      <UploadRow kind="owner_id" label={t('ownerIdDoc')} state={docs.owner_id} onSelect={handleFileSelected} t={t} />

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        style={{
          width: '100%',
          marginTop: 20,
          padding: '13px 16px',
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--white)',
          background: 'var(--navy)',
          border: 'none',
          borderRadius: 8,
          opacity: !canSubmit || submitting ? 0.6 : 1
        }}
      >
        {submitting ? t('sending') : t('submitKyc')}
      </button>
    </div>
  );
}

function UploadRow({
  kind,
  label,
  state,
  onSelect,
  t
}: {
  kind: DocKind;
  label: string;
  state: UploadState;
  onSelect: (kind: DocKind, file: File) => void;
  t: (k: any) => string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{label}</label>
      <div
        style={{
          border: `1.5px dashed ${state.key ? 'var(--success)' : 'var(--line)'}`,
          borderRadius: 10,
          padding: '16px',
          textAlign: 'center',
          background: state.key ? '#E4F3EA' : 'var(--white)'
        }}
      >
        <input
          type="file"
          accept="image/*,.pdf"
          id={`lab-upload-${kind}`}
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelect(kind, file);
          }}
        />
        <label htmlFor={`lab-upload-${kind}`} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: state.key ? 'var(--success)' : 'var(--teal)' }}>
          {state.uploading ? t('uploading') : state.key ? `✓ ${state.file?.name}` : t('chooseFile')}
        </label>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

type DocKind = 'national_id' | 'medical_license' | 'selfie';

interface UploadState {
  file: File | null;
  key: string | null;
  uploading: boolean;
}

export function DoctorKycSubmit() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<Record<DocKind, UploadState>>({
    national_id: { file: null, key: null, uploading: false },
    medical_license: { file: null, key: null, uploading: false },
    selfie: { file: null, key: null, uploading: false }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleFileSelected(kind: DocKind, file: File) {
    setDocs((d) => ({ ...d, [kind]: { file, key: null, uploading: true } }));
    setError('');
    try {
      const { upload_url, key } = await api.getKycUploadUrl(file.name, file.type);
      await api.uploadToPresignedUrl(upload_url, file);
      setDocs((d) => ({ ...d, [kind]: { file, key, uploading: false } }));
    } catch {
      setError(t('uploadFailed'));
      setDocs((d) => ({ ...d, [kind]: { file: null, key: null, uploading: false } }));
    }
  }

  const allUploaded = docs.national_id.key && docs.medical_license.key && docs.selfie.key;

  async function handleSubmit() {
    if (!allUploaded) return;
    setSubmitting(true);
    setError('');
    try {
      await api.submitDoctorKyc({
        national_id_key: docs.national_id.key!,
        medical_license_key: docs.medical_license.key!,
        selfie_key: docs.selfie.key!
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
        <button
          onClick={() => navigate('/doctor')}
          style={{ padding: '12px 20px', background: 'var(--navy)', color: 'var(--white)', border: 'none', borderRadius: 8, fontWeight: 700 }}
        >
          {t('myDashboard')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 460, margin: '20px auto 0' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>{t('kycTitle')}</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>{t('kycIntro')}</p>

      {error && (
        <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <UploadRow kind="national_id" label={t('nationalId')} state={docs.national_id} onSelect={handleFileSelected} t={t} />
      <UploadRow kind="medical_license" label={t('medicalLicense')} state={docs.medical_license} onSelect={handleFileSelected} t={t} />
      <UploadRow kind="selfie" label={t('selfiePhoto')} state={docs.selfie} onSelect={handleFileSelected} t={t} />

      <button
        onClick={handleSubmit}
        disabled={!allUploaded || submitting}
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
          opacity: !allUploaded || submitting ? 0.6 : 1
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
          id={`upload-${kind}`}
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelect(kind, file);
          }}
        />
        <label htmlFor={`upload-${kind}`} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: state.key ? 'var(--success)' : 'var(--teal)' }}>
          {state.uploading ? t('uploading') : state.key ? `✓ ${state.file?.name}` : t('chooseFile')}
        </label>
      </div>
    </div>
  );
}

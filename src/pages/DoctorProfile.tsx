import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

export function DoctorProfile() {
  const { t } = useLang();
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [consultationTypesText, setConsultationTypesText] = useState('');
  const [momoNumber, setMomoNumber] = useState('');
  const [momoNetwork, setMomoNetwork] = useState('MTN');
  const [teleconsultFee, setTeleconsultFee] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [doctorPhone, setDoctorPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [acceptingInstantConsults, setAcceptingInstantConsults] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    api.getMyDoctorProfile().then((res) => {
      setFullName(res.doctor.fullName ?? '');
      setDob(res.doctor.dob ? res.doctor.dob.slice(0, 10) : '');
      setAddress(res.doctor.address ?? '');
      setSpecialty(res.doctor.specialty ?? '');
      const types = Array.isArray(res.doctor.consultationTypes) ? res.doctor.consultationTypes : [];
      setConsultationTypesText(types.join(', '));
      setMomoNumber(res.doctor.momoNumber ?? '');
      setMomoNetwork(res.doctor.momoNetwork ?? 'MTN');
      setTeleconsultFee(res.doctor.teleconsultFee ?? '');
      setDoctorPhone(res.doctor.phone ?? '');
      setPhotoUrl(res.doctor.photoUrl ?? null);
      setAcceptingInstantConsults(res.doctor.acceptingInstantConsults ?? false);
    });
  }, []);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const { upload_url, key } = await api.getPhotoUploadUrl(file.name, file.type);
      await api.uploadToPresignedUrl(upload_url, file);
      const res = await api.setDoctorPhoto(key);
      // Bust any stale cached copy of the old photo at this same URL
      // (GET /doctors/:id/photo is cached for 24h — see doctors.routes.ts)
      // by appending a cache-busting query param just for this immediate
      // preview; the stored photoUrl itself stays clean.
      setPhotoUrl(`${res.photo_url}?t=${Date.now()}`);
    } catch {
      setPhotoError(t('photoUploadFailed'));
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  }

  async function handleSave() {
    setSaving(true);
    setSavedMsg(false);
    setPhoneError(null);
    try {
      const consultation_types = consultationTypesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await api.setDoctorProfile({
        full_name: fullName,
        dob: dob || undefined,
        address,
        specialty,
        consultation_types: consultation_types,
        momo_number: momoNumber,
        momo_network: momoNetwork,
        teleconsult_fee: teleconsultFee ? Number(teleconsultFee) : undefined,
        phone: doctorPhone || undefined
      });
      setDoctorPhone(res.doctor.phone ?? '');
      setSavedMsg(true);
    } catch (e: any) {
      if (e?.status === 409) {
        setPhoneError(t('phoneAlreadyInUse'));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleInstantConsults(next: boolean) {
    // Optimistic — the backend rejects turning this on without a phone
    // number, so revert immediately if that happens instead of leaving
    // the toggle showing a state that didn't actually save.
    setAcceptingInstantConsults(next);
    try {
      await api.setDoctorProfile({ accepting_instant_consults: next });
    } catch {
      setAcceptingInstantConsults(!next);
    }
  }

  async function handleGenerateReferralLink() {
    if (!fullName || !doctorPhone) return;
    setGeneratingLink(true);
    try {
      const res = await api.generateReferralCode({
        referrer_name: fullName,
        referrer_phone: doctorPhone,
        referrer_momo_number: momoNumber || undefined,
        referrer_momo_network: momoNumber ? momoNetwork : undefined
      });
      setReferralLink(res.share_link);
    } finally {
      setGeneratingLink(false);
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <Link to="/doctor" style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
        ← {t('myDashboard')}
      </Link>

      <h1 style={{ fontSize: 24, marginBottom: 20 }}>{t('myProfile')}</h1>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 18, marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('profilePhotoLabel')}</label>
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 12 }}>{t('profilePhotoHint')}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--teal-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--teal)' }}>
                {fullName ? fullName.trim().charAt(0).toUpperCase() : '?'}
              </span>
            )}
          </div>
          <label
            style={{
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--navy)',
              background: 'var(--white)',
              border: '1.5px solid var(--line)',
              borderRadius: 8,
              cursor: uploadingPhoto ? 'default' : 'pointer',
              opacity: uploadingPhoto ? 0.6 : 1
            }}
          >
            {uploadingPhoto ? t('uploadingPhoto') : t('uploadPhoto')}
            <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} style={{ display: 'none' }} />
          </label>
        </div>
        {photoError && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 10 }}>{photoError}</p>}
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>{t('acceptingInstantConsultsLabel')}</div>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{t('acceptingInstantConsultsHint')}</p>
            {!doctorPhone && <p style={{ fontSize: 12, color: 'var(--clay)', marginTop: 6, fontWeight: 600 }}>{t('instantConsultsNeedsPhone')}</p>}
          </div>
          <button
            onClick={() => handleToggleInstantConsults(!acceptingInstantConsults)}
            disabled={!doctorPhone && !acceptingInstantConsults}
            style={{
              flexShrink: 0,
              width: 46,
              height: 26,
              borderRadius: 13,
              border: 'none',
              background: acceptingInstantConsults ? 'var(--teal)' : 'var(--line)',
              position: 'relative',
              cursor: !doctorPhone && !acceptingInstantConsults ? 'not-allowed' : 'pointer',
              opacity: !doctorPhone && !acceptingInstantConsults ? 0.6 : 1
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: acceptingInstantConsults ? 23 : 3,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'var(--white)',
                transition: 'left 0.15s ease'
              }}
            />
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 18 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('fullNameLabel')}</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={{ width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box', marginBottom: 18 }}
        />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('phoneLabel')}</label>
        <input
          value={doctorPhone}
          onChange={(e) => setDoctorPhone(e.target.value)}
          placeholder={t('phonePlaceholder')}
          style={{ width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box', marginBottom: phoneError ? 6 : 18 }}
        />
        {phoneError && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 18 }}>{phoneError}</p>}

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('dobLabel')}</label>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          style={{ width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box', marginBottom: 18 }}
        />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('addressLabel')}</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t('addressPlaceholder')}
          style={{ width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box', marginBottom: 18 }}
        />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('specialtyLabel')}</label>
        <input
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          placeholder={t('specialtyPlaceholder')}
          style={{ width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box', marginBottom: 18 }}
        />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('consultationTypesLabel')}</label>
        <input
          value={consultationTypesText}
          onChange={(e) => setConsultationTypesText(e.target.value)}
          style={{ width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box' }}
        />
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6, marginBottom: 18 }}>{t('consultationTypesHint')}</p>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('teleconsultFeeLabel')}</label>
        <input
          value={teleconsultFee}
          onChange={(e) => setTeleconsultFee(e.target.value)}
          inputMode="numeric"
          placeholder={t('teleconsultFeeHint')}
          style={{ width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box', marginBottom: 18 }}
        />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('payoutDetails')}</label>
        <input
          value={momoNumber}
          onChange={(e) => setMomoNumber(e.target.value)}
          placeholder={t('momoNumberLabel')}
          style={{ width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box', marginBottom: 10 }}
        />
        <select
          value={momoNetwork}
          onChange={(e) => setMomoNetwork(e.target.value)}
          style={{ width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box', marginBottom: 18 }}
        >
          <option value="MTN">MTN</option>
          <option value="Orange">Orange</option>
        </select>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '11px 20px',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--white)',
            background: 'var(--navy)',
            border: 'none',
            borderRadius: 8,
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? t('sending') : t('save')}
        </button>
        {savedMsg && <p style={{ fontSize: 13, color: 'var(--success)', marginTop: 12, fontWeight: 600 }}>{t('savedSuccessfully')}</p>}
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 18, marginTop: 16 }}>
        <h2 style={{ fontSize: 15, marginBottom: 6, color: 'var(--navy)' }}>{t('myReferralLink')}</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14 }}>{t('myReferralLinkHint')}</p>
        {referralLink ? (
          <div style={{ background: 'var(--teal-light)', borderRadius: 8, padding: '10px 14px', fontSize: 13, wordBreak: 'break-all' }}>{referralLink}</div>
        ) : (
          <>
            {!doctorPhone && (
              <>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('phoneLabel')}</label>
                <input
                  value={doctorPhone}
                  onChange={(e) => setDoctorPhone(e.target.value)}
                  placeholder={t('phonePlaceholder')}
                  style={{ width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box', marginBottom: 12 }}
                />
              </>
            )}
            <button
              onClick={handleGenerateReferralLink}
              disabled={generatingLink || !doctorPhone}
              style={{
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--white)',
                background: 'var(--teal)',
                border: 'none',
                borderRadius: 8,
                opacity: generatingLink || !doctorPhone ? 0.6 : 1
              }}
            >
              {generatingLink ? t('sending') : t('generateLink')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

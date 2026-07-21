import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

export function DoctorProfile() {
  const { t } = useLang();
  const [specialty, setSpecialty] = useState('');
  const [consultationTypesText, setConsultationTypesText] = useState('');
  const [momoNumber, setMomoNumber] = useState('');
  const [momoNetwork, setMomoNetwork] = useState('MTN');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    api.getMyDoctorProfile().then((res) => {
      setSpecialty(res.doctor.specialty ?? '');
      const types = Array.isArray(res.doctor.consultationTypes) ? res.doctor.consultationTypes : [];
      setConsultationTypesText(types.join(', '));
      setMomoNumber(res.doctor.momoNumber ?? '');
      setMomoNetwork(res.doctor.momoNetwork ?? 'MTN');
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSavedMsg(false);
    try {
      const consultation_types = consultationTypesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await api.setDoctorProfile({ specialty, consultation_types: consultation_types, momo_number: momoNumber, momo_network: momoNetwork });
      setSavedMsg(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <Link to="/doctor" style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
        ← {t('myDashboard')}
      </Link>

      <h1 style={{ fontSize: 24, marginBottom: 20 }}>{t('myProfile')}</h1>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 18 }}>
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
    </div>
  );
}

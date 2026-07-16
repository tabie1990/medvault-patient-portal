import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

export function MyLabs() {
  const { t } = useLang();
  const [labs, setLabs] = useState<api.MyLabProvider[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [serviceType, setServiceType] = useState('on_site');
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await api.getMyLabs();
    setLabs(res.lab_providers);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRegister() {
    setSaving(true);
    try {
      await api.registerLab({ name, service_type: serviceType, city: city || undefined });
      setName('');
      setCity('');
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>{t('myLabs')}</h1>

      {labs && labs.length === 0 && !showForm && <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 16 }}>{t('noLabsYet')}</p>}

      <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
        {labs?.map((lab) => (
          <div
            key={lab.id}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: '16px 18px',
              boxShadow: 'var(--shadow)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{lab.name}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 3 }}>
                {lab.city ?? ''} · {lab.services.length} {t('labServices').toLowerCase()}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: lab.verificationStatus === 'verified' ? '#E4F3EA' : '#FBF1E8',
                  color: lab.verificationStatus === 'verified' ? 'var(--success)' : 'var(--clay)'
                }}
              >
                {lab.verificationStatus}
              </span>
              <Link
                to={`/doctor/labs/${lab.id}`}
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', textDecoration: 'none' }}
              >
                {t('manage')} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {showForm ? (
        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 18 }}>
          <label style={labelStyle}>{t('labName')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <label style={{ ...labelStyle, marginTop: 12 }}>{t('city')}</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
          <label style={{ ...labelStyle, marginTop: 12 }}>{t('serviceType')}</label>
          <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} style={inputStyle}>
            <option value="on_site">{t('serviceTypeOnSite')}</option>
            <option value="home_visit">{t('serviceTypeHome')}</option>
            <option value="both">{t('serviceTypeBoth')}</option>
          </select>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={handleRegister} disabled={saving || !name} style={{ ...primaryBtn, opacity: saving || !name ? 0.6 : 1 }}>
              {saving ? t('sending') : t('register')}
            </button>
            <button onClick={() => setShowForm(false)} style={secondaryBtn}>
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={primaryBtn}>
          + {t('registerALab')}
        </button>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box' as const };
const primaryBtn = { padding: '12px 20px', fontSize: 14, fontWeight: 700, color: 'var(--white)', background: 'var(--navy)', border: 'none', borderRadius: 8 };
const secondaryBtn = { padding: '12px 16px', fontSize: 14, fontWeight: 700, color: 'var(--ink-soft)', background: 'none', border: '1.5px solid var(--line)', borderRadius: 8 };

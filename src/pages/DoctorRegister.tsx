import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

export function DoctorRegister() {
  const { t } = useLang();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleRegister() {
    setLoading(true);
    setError('');
    try {
      await api.registerDoctor({ full_name: fullName, email: email || undefined, phone: phone || undefined });
      setDone(true);
    } catch (e: any) {
      setError(e?.raw?.error === 'a_doctor_with_this_email_or_phone_already_exists' ? t('accountAlreadyExists') : t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 380, margin: '60px auto 0', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>{t('registrationSent')}</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{t('registrationSentBody')}</p>
        <Link to="/staff-login" style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 14 }}>
          {t('logIn')} →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 380, margin: '40px auto 0' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>{t('doctorRegisterTitle')}</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>{t('doctorRegisterIntro')}</p>

      {error && (
        <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <label style={labelStyle}>{t('fullName')}</label>
      <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />

      <label style={{ ...labelStyle, marginTop: 14 }}>{t('emailLabel')}</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />

      <label style={{ ...labelStyle, marginTop: 14 }}>{t('phoneOptional')}</label>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />

      <button
        onClick={handleRegister}
        disabled={loading || !fullName || !email}
        style={{ ...buttonStyle, marginTop: 20, opacity: loading || !fullName || !email ? 0.6 : 1 }}
      >
        {loading ? t('sending') : t('register')}
      </button>

      <Link to="/staff-login" style={{ display: 'block', textAlign: 'center', marginTop: 16, color: 'var(--teal)', fontSize: 13, fontWeight: 600 }}>
        {t('alreadyHaveAccount')}
      </Link>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 };

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 16,
  border: '1.5px solid var(--line)',
  borderRadius: 8,
  boxSizing: 'border-box' as const
};

const buttonStyle = {
  width: '100%',
  padding: '13px 16px',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--white)',
  background: 'var(--navy)',
  border: 'none',
  borderRadius: 8
};

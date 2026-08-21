import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';
import { TermsAgreement } from '../components/TermsAgreement';

export function LabRegister() {
  const { t } = useLang();
  const [labName, setLabName] = useState('');
  const [serviceType, setServiceType] = useState('on_site');
  const [city, setCity] = useState('');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const canSubmit = labName && ownerFullName && (ownerEmail || ownerPhone) && password.length >= 8 && termsAccepted;

  async function handleRegister() {
    setLoading(true);
    setError('');
    try {
      await api.registerLabSelf({
        name: labName,
        service_type: serviceType,
        city: city || undefined,
        owner_full_name: ownerFullName,
        owner_email: ownerEmail || undefined,
        owner_phone: ownerPhone || undefined,
        password,
        terms_accepted: termsAccepted
      });
      setDone(true);
    } catch (e: any) {
      setError(e?.raw?.error === 'an_account_with_this_email_or_phone_already_exists' ? t('accountAlreadyExists') : t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 380, margin: '60px auto 0', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>{t('registrationSent')}</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{t('labRegisterSentBody')}</p>
        <Link to="/staff-login" style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 14 }}>
          {t('logIn')} →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 380, margin: '40px auto 0' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>{t('labRegisterTitle')}</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>{t('labRegisterIntro')}</p>

      {error && (
        <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <label style={labelStyle}>{t('labNameLabel')}</label>
      <input value={labName} onChange={(e) => setLabName(e.target.value)} style={inputStyle} />

      <label style={{ ...labelStyle, marginTop: 14 }}>{t('serviceTypeLabel')}</label>
      <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} style={inputStyle}>
        <option value="on_site">{t('labServiceOnSite')}</option>
        <option value="home_service">{t('labServiceHome')}</option>
        <option value="both">{t('labServiceBoth')}</option>
      </select>

      <label style={{ ...labelStyle, marginTop: 14 }}>{t('cityOptional')}</label>
      <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />

      <div style={{ height: 1, background: 'var(--line)', margin: '20px 0' }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>{t('ownerDetailsHeading')}</div>

      <label style={labelStyle}>{t('fullName')}</label>
      <input value={ownerFullName} onChange={(e) => setOwnerFullName(e.target.value)} style={inputStyle} />

      <label style={{ ...labelStyle, marginTop: 14 }}>{t('emailLabel')}</label>
      <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} style={inputStyle} />

      <label style={{ ...labelStyle, marginTop: 14 }}>{t('phoneOptional')}</label>
      <input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} style={inputStyle} />

      <label style={{ ...labelStyle, marginTop: 14 }}>{t('choosePasswordLabel')}</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
      <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>{t('passwordMinLength')}</p>

      <TermsAgreement checked={termsAccepted} onChange={setTermsAccepted} />

      <button
        onClick={handleRegister}
        disabled={loading || !canSubmit}
        style={{ ...buttonStyle, marginTop: 20, opacity: loading || !canSubmit ? 0.6 : 1 }}
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

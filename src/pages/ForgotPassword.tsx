import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

export function ForgotPassword() {
  const { t } = useLang();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'identify' | 'reset'>('identify');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRequestCode() {
    setLoading(true);
    setError('');
    try {
      await api.forgotPassword(identifier);
      setStep('reset');
    } catch {
      // Deliberately still proceed to the reset step even on an
      // unexpected error — the backend already responds identically
      // whether or not an account was found, so there's no useful
      // distinction to show here regardless.
      setStep('reset');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setLoading(true);
    setError('');
    try {
      await api.resetPassword(identifier, code, newPassword);
      navigate('/staff-login');
    } catch {
      setError(t('invalidCode'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '40px auto 0' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>{t('forgotPasswordTitle')}</h1>

      {error && (
        <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {step === 'identify' ? (
        <>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 20 }}>{t('forgotPasswordIntro')}</p>
          <label style={labelStyle}>{t('emailOrPhone')}</label>
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} style={inputStyle} />
          <button
            onClick={handleRequestCode}
            disabled={loading || !identifier}
            style={{ ...buttonStyle, marginTop: 18, opacity: loading || !identifier ? 0.6 : 1 }}
          >
            {loading ? t('sending') : t('sendCode')}
          </button>
        </>
      ) : (
        <>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 20 }}>{t('resetPasswordIntro')}</p>
          <label style={labelStyle}>{t('codeLabel')}</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} style={inputStyle} />
          <label style={{ ...labelStyle, marginTop: 14 }}>{t('newPassword')}</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
          <button
            onClick={handleReset}
            disabled={loading || code.length < 4 || newPassword.length < 8}
            style={{ ...buttonStyle, marginTop: 18, opacity: loading || code.length < 4 || newPassword.length < 8 ? 0.6 : 1 }}
          >
            {loading ? t('verifying') : t('resetPasswordCta')}
          </button>
        </>
      )}

      <Link to="/staff-login" style={{ display: 'block', textAlign: 'center', marginTop: 16, color: 'var(--teal)', fontSize: 13, fontWeight: 600 }}>
        {t('backToLogin')}
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

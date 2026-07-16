import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import * as api from '../lib/api';

export function Login() {
  const { t } = useLang();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRequestOtp() {
    setLoading(true);
    setError('');
    try {
      await api.requestOtp(phone);
      setStep('code');
    } catch {
      setError(t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setLoading(true);
    setError('');
    try {
      const res = await api.verifyOtp(phone, code);
      login(res.token, res.global_patient_id);
      navigate('/');
    } catch {
      setError(t('invalidCode'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '40px auto 0' }}>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>{t('findADoctor')}</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>{t('loginIntro')}</p>

      {error && (
        <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {step === 'phone' ? (
        <>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>
            {t('phoneLabel')}
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('phonePlaceholder')}
            style={inputStyle}
          />
          <button
            onClick={handleRequestOtp}
            disabled={loading || phone.length < 9}
            style={{ ...primaryButtonStyle, marginTop: 16, opacity: loading || phone.length < 9 ? 0.6 : 1 }}
          >
            {loading ? t('sending') : t('sendCode')}
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>
            {t('codeSentTo')} <strong style={{ color: 'var(--navy)' }}>{phone}</strong>
          </p>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>
            {t('codeLabel')}
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            style={{ ...inputStyle, letterSpacing: 6, fontSize: 20, textAlign: 'center' }}
          />
          <button
            onClick={handleVerify}
            disabled={loading || code.length < 4}
            style={{ ...primaryButtonStyle, marginTop: 16, opacity: loading || code.length < 4 ? 0.6 : 1 }}
          >
            {loading ? t('verifying') : t('verify')}
          </button>
          <button
            onClick={() => setStep('phone')}
            style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 13, fontWeight: 600, marginTop: 14, width: '100%' }}
          >
            {t('changeNumber')}
          </button>
        </>
      )}
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 16,
  border: '1.5px solid var(--line)',
  borderRadius: 'var(--radius-sm)',
  boxSizing: 'border-box'
};

const primaryButtonStyle: CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--white)',
  background: 'var(--navy)',
  border: 'none',
  borderRadius: 'var(--radius-sm)'
};

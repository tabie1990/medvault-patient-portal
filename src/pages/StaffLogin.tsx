import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import * as api from '../lib/api';

export function StaffLogin() {
  const { t } = useLang();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setLoading(true);
    setError('');
    try {
      const res = await api.staffLogin(identifier, password);
      login(res.token, res.role, ''); // doctor/lab_staff/admin dashboards derive identity from the JWT itself, not a client-known ID
      if (res.role === 'doctor') navigate('/doctor');
      else if (res.role === 'admin') navigate('/admin');
      else navigate('/lab');
    } catch {
      setError(t('invalidCode'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '40px auto 0' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>{t('staffLoginTitle')}</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 28 }}>{t('staffLoginIntro')}</p>

      {error && (
        <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>
        {t('emailOrPhone')}
      </label>
      <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} style={inputStyle} />

      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', margin: '14px 0 6px' }}>
        {t('password')}
      </label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

      <button
        onClick={handleLogin}
        disabled={loading || !identifier || !password}
        style={{ ...buttonStyle, marginTop: 18, opacity: loading || !identifier || !password ? 0.6 : 1 }}
      >
        {loading ? t('verifying') : t('logIn')}
      </button>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)', marginTop: 20 }}>
        {t('dontHaveAccount')}{' '}
        <Link to="/doctor-register" style={{ color: 'var(--teal)', fontWeight: 700 }}>
          {t('registerAsDoctor')}
        </Link>
      </p>
    </div>
  );
}

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

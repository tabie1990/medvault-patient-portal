import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import * as api from '../lib/api';

export function ChangePassword() {
  const { t } = useLang();
  const { role, clearMustChangePassword } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (newPassword.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('passwordsDontMatch'));
      return;
    }
    setLoading(true);
    try {
      await api.changePassword(role as 'doctor' | 'lab_staff' | 'admin', newPassword);
      clearMustChangePassword();
      if (role === 'doctor') navigate('/doctor');
      else if (role === 'admin') navigate('/admin');
      else navigate('/lab');
    } catch {
      setError(t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '60px auto 0' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>{t('mustChangePasswordTitle')}</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>{t('mustChangePasswordIntro')}</p>

      {error && (
        <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('newPassword')}</label>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={{ width: '100%', padding: '12px 14px', fontSize: 16, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box' }}
      />

      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', margin: '14px 0 6px' }}>{t('confirmNewPassword')}</label>
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        style={{ width: '100%', padding: '12px 14px', fontSize: 16, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box' }}
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !newPassword || !confirmPassword}
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
          opacity: loading || !newPassword || !confirmPassword ? 0.6 : 1
        }}
      >
        {loading ? t('sending') : t('setPasswordCta')}
      </button>
    </div>
  );
}

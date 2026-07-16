import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useAuth } from '../lib/auth';

export function Layout({ children }: { children: ReactNode }) {
  const { lang, setLang, t } = useLang();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'var(--navy)',
          color: 'var(--white)'
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--white)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 18
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, color: 'var(--white)', lineHeight: 1.1 }}>
              {t('appName')}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.3 }}>{t('tagline')}</div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, overflow: 'hidden' }}>
            {(['en', 'fr'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  border: 'none',
                  background: lang === l ? 'var(--teal)' : 'transparent',
                  color: 'var(--white)'
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          {token && (
            <Link to="/appointments" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              {t('myAppointments')}
            </Link>
          )}
          {token && (
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}
            >
              {t('logOut')}
            </button>
          )}
        </div>
      </header>
      <main style={{ flex: 1, width: '100%', maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px' }}>{children}</main>
    </div>
  );
}

import { type ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useAuth } from '../lib/auth';

function LoginMenu() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: '9px 16px',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--navy)',
          background: 'var(--white)',
          border: 'none',
          borderRadius: 8
        }}
      >
        {t('loginSignup')}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'var(--white)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(15,42,74,0.18)',
            overflow: 'hidden',
            minWidth: 190,
            zIndex: 20
          }}
        >
          {[
            { label: t('imAPatient'), to: '/login' },
            { label: t('imADoctor'), to: '/staff-login' },
            { label: t('imALabStaff'), to: '/staff-login' }
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setOpen(false);
                navigate(item.to);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--ink)',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--line)'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Layout({ children, wide }: { children: ReactNode; wide?: boolean }) {
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
          <img src="/favicon.png" alt="" width={36} height={36} style={{ borderRadius: 10 }} />
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
          {token ? (
            <>
              <Link to="/appointments" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                {t('myAppointments')}
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}
              >
                {t('logOut')}
              </button>
            </>
          ) : (
            <LoginMenu />
          )}
        </div>
      </header>
      <main style={{ flex: 1, width: '100%', maxWidth: wide ? 'none' : 720, margin: wide ? 0 : '0 auto', padding: wide ? 0 : '24px 20px 60px' }}>
        {children}
      </main>
    </div>
  );
}

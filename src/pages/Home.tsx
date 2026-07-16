import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';

const SERVICES = [
  { key: 'serviceTeleconsult', descKey: 'serviceTeleconsultDesc', icon: '🩺' },
  { key: 'serviceLab', descKey: 'serviceLabDesc', icon: '🧪' },
  { key: 'serviceWhatsapp', descKey: 'serviceWhatsappDesc', icon: '💬' },
  { key: 'serviceRecords', descKey: 'serviceRecordsDesc', icon: '🗂️' }
] as const;

const TIPS = [
  { titleKey: 'tip1Title', bodyKey: 'tip1Body' },
  { titleKey: 'tip2Title', bodyKey: 'tip2Body' },
  { titleKey: 'tip3Title', bodyKey: 'tip3Body' }
] as const;

export function Home() {
  const { t } = useLang();

  return (
    <div>
      {/* Hero — the real product, not an illustrated mascot. Two actual
          screenshots of the HMS presented as an angled, layered stack,
          because the honest, differentiating claim MedVAULT can make is
          "this software already runs real clinic floors," which a photo
          of real software proves in a way an avatar can't. */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-deep) 100%)',
          color: 'var(--white)',
          padding: '56px 20px 90px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 38, lineHeight: 1.15, color: 'var(--white)', marginBottom: 18, maxWidth: 520 }}>
              {t('heroHeadline')}
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', maxWidth: 480, marginBottom: 28 }}>
              {t('heroSubhead')}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                to="/find-a-doctor"
                style={{
                  padding: '13px 22px',
                  background: 'var(--clay)',
                  color: 'var(--white)',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none'
                }}
              >
                {t('findADoctorCta')} →
              </Link>
              <Link
                to="/staff-login"
                style={{
                  padding: '13px 22px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'var(--white)',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  border: '1.5px solid rgba(255,255,255,0.3)'
                }}
              >
                {t('forProvidersCta')}
              </Link>
            </div>
          </div>

          <div style={{ position: 'relative', minHeight: 280 }}>
            <img
              src="/screenshots/hms-laptop.jpg"
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '92%',
                borderRadius: 12,
                boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
                transform: 'rotate(2deg)'
              }}
            />
            <img
              src="/screenshots/hms-desktop.jpg"
              alt=""
              style={{
                position: 'absolute',
                bottom: -30,
                left: 0,
                width: '62%',
                borderRadius: 10,
                boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
                transform: 'rotate(-3deg)',
                border: '3px solid rgba(255,255,255,0.1)'
              }}
            />
          </div>
        </div>
      </section>

      {/* Signature strip — quiet, factual, not a decoration */}
      <section style={{ background: 'var(--teal-light)', padding: '14px 20px' }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'center',
            gap: 32,
            flexWrap: 'wrap',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--navy)'
          }}
        >
          <span>{t('builtForClinics')}</span>
          <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>{t('builtForClinicsSub')}</span>
        </div>
      </section>

      {/* Services */}
      <section style={{ padding: '56px 20px', maxWidth: 1120, margin: '0 auto' }}>
        <h2 style={{ fontSize: 26, marginBottom: 32, textAlign: 'center' }}>{t('servicesHeadline')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {SERVICES.map((s) => (
            <div
              key={s.key}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                padding: '24px 20px',
                boxShadow: 'var(--shadow)'
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
              <h3 style={{ fontSize: 16, marginBottom: 6 }}>{t(s.key)}</h3>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>{t(s.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partners — clearly placeholder until real logos are supplied */}
      <section style={{ padding: '40px 20px', background: '#F3F1EC' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 20, letterSpacing: 0.3 }}>
            {t('partnersHeadline')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  width: 120,
                  height: 48,
                  background: '#E4E1DA',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: 'var(--ink-soft)',
                  fontWeight: 600
                }}
              >
                Partner {i}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Health tips — genuine, generic public-health content, not fabricated company news */}
      <section style={{ padding: '56px 20px', maxWidth: 1120, margin: '0 auto' }}>
        <h2 style={{ fontSize: 26, marginBottom: 32, textAlign: 'center' }}>{t('tipsHeadline')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {TIPS.map((tip) => (
            <div key={tip.titleKey} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '20px' }}>
              <h3 style={{ fontSize: 15, marginBottom: 8, color: 'var(--navy)' }}>{t(tip.titleKey)}</h3>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55, margin: 0 }}>{t(tip.bodyKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

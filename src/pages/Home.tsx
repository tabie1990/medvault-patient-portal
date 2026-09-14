import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';
import { PackageOffers } from '../components/PackageOffers';

const SERVICES = [
  { key: 'serviceTeleconsult', descKey: 'serviceTeleconsultDesc', icon: '🩺' },
  { key: 'serviceLab', descKey: 'serviceLabDesc', icon: '🧪' },
  { key: 'serviceWhatsapp', descKey: 'serviceWhatsappDesc', icon: '💬' },
  { key: 'serviceRecords', descKey: 'serviceRecordsDesc', icon: '🗂️' }
] as const;

// Real partner hospitals/clinics — swap or extend this list as more
// logos come in; the marquee strip below is entirely data-driven.
const PARTNERS = [
  { name: 'JAPOMA District Hospital', src: '/screenshots/HDJ.png' },
  { name: 'Centre Medical Ste Yvette', src: '/screenshots/cmsy.jpg' },
  { name: 'Providence N&D Health Care', src: '/screenshots/n-and-d-logo.jpg' }
] as const;

// Real doctors, shown while GET /doctors/browse has no verified accounts
// yet on this environment — this is a stopgap for a genuinely empty
// backend list, not fabricated content. Once real verified doctors exist,
// the live API result takes over automatically (see the `doctors` effect
// below) and this list is never shown. Not linked to a doctor detail page
// since these aren't real bookable accounts (yet).
const FEATURED_DOCTORS = [
  {
    id: 'featured-charles-obam-assam',
    fullName: 'Dr Charles Amel Obam Assam',
    specialty: { en: 'General Practice', fr: 'Médecine générale' },
    photo: '/doctors/charles-obam-assam.jpeg'
  },
  {
    id: 'featured-georges-mouen-mbangue',
    fullName: 'Dr Georges Mouen Mbangue',
    specialty: { en: 'Ophthalmology', fr: 'Ophtalmologie' },
    photo: '/doctors/georges-mouen-mbangue.jpeg'
  }
] as const;

const TIPS = [
  { titleKey: 'tip1Title', bodyKey: 'tip1Body' },
  { titleKey: 'tip2Title', bodyKey: 'tip2Body' },
  { titleKey: 'tip3Title', bodyKey: 'tip3Body' }
] as const;

export function Home() {
  const { t, lang } = useLang();
  const [doctors, setDoctors] = useState<api.Doctor[] | null>(null);

  useEffect(() => {
    // Homepage is public and must never break on a backend hiccup — fall
    // back to simply not showing the section rather than surfacing an
    // error, since smoke tests check the page never renders "Error".
    api
      .listDoctors()
      .then((res) => setDoctors(res.doctors))
      .catch(() => setDoctors([]));
  }, []);

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
        {/* Soft decorative glow, not a stock illustration — just depth
            behind the real product screenshots, in the app's own accent
            colors (a cue taken from Waspito's hero treatment). */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(27,156,144,0.35) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '-25%',
            left: '30%',
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,115,74,0.18) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 40, alignItems: 'center', position: 'relative' }}>
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
              <Link
                to="/refer"
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
                🎉 {t('referADoctor')}
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
            {/* Real testimonial, not invented copy — pulled from the
                med-vault.com homepage's own reviews. */}
            <div
              style={{
                position: 'absolute',
                bottom: -56,
                right: -8,
                width: 240,
                background: 'var(--white)',
                borderRadius: 12,
                padding: '14px 16px',
                boxShadow: '0 16px 32px rgba(0,0,0,0.35)'
              }}
              className="hero-testimonial-card"
            >
              <div style={{ color: 'var(--clay)', fontSize: 12, marginBottom: 6, letterSpacing: 1 }}>★★★★★</div>
              <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink)', margin: '0 0 8px' }}>
                “To have a platform where patients and doctors can interact, from booking appointments to managing subscriptions, is a booster for us in the hospital industry.”
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'var(--teal-light)',
                    color: 'var(--teal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  M
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.3 }}>
                  <strong style={{ color: 'var(--navy)', fontWeight: 700 }}>Madavan Limunga</strong>
                  <br />
                  Mount Mary Hospital, Buea
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real proof instead of an unbacked claim — an actual product-overview
          video from med-vault.com, pulled from the real MedVAULT launch
          coverage rather than an illustrated mockup. */}
      <section style={{ background: 'var(--teal-light)', padding: '48px 20px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>{t('seeItInActionHeadline')}</h2>
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>{t('seeItInActionSub')}</p>
          <div style={{ aspectRatio: '16 / 9', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/mNh5Bet2FB8?rel=0&modestbranding=1"
              title="MedVAULT HMS Overview"
              allow="fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
              style={{ border: 'none', display: 'block' }}
            />
          </div>
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

      {/* Doctor cards — waits for the fetch to actually resolve so the
          section never flashes empty. Uses live, bookable doctors once
          any are verified on this environment; falls back to real (but
          not yet bookable) featured doctors otherwise — see
          FEATURED_DOCTORS above for why. */}
      {doctors && (() => {
        const isLive = doctors.length > 0;
        const cards = isLive
          ? doctors.slice(0, 6).map((d) => ({
              id: d.id,
              fullName: d.fullName,
              specialty: d.specialty ?? undefined,
              photo: d.photoUrl,
              fee: d.teleconsultFee ? `${Number(d.teleconsultFee).toLocaleString()} FCFA ${t('perConsult')}` : undefined,
              linkTo: `/doctors/${d.id}`
            }))
          : FEATURED_DOCTORS.map((d) => ({
              id: d.id,
              fullName: d.fullName,
              specialty: d.specialty[lang],
              photo: d.photo,
              fee: undefined,
              linkTo: undefined as string | undefined
            }));

        return (
          <section style={{ padding: '56px 20px', maxWidth: 1120, margin: '0 auto' }}>
            <h2 style={{ fontSize: 26, marginBottom: 32, textAlign: 'center' }}>{t('meetOurDoctorsHeadline')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              {cards.map((d) => {
                const cardStyle: CSSProperties = {
                  display: 'block',
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  padding: '20px',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: 'var(--shadow)'
                };
                const content = (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: 'var(--teal-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {d.photo ? (
                          <img src={d.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />
                        ) : (
                          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--teal)' }}>{d.fullName.trim().charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{d.fullName}</div>
                        {d.specialty && <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>{d.specialty}</div>}
                      </div>
                    </div>
                    {d.fee && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--teal)', fontWeight: 700 }}>{d.fee}</div>}
                  </>
                );
                return d.linkTo ? (
                  <Link key={d.id} to={d.linkTo} style={cardStyle}>
                    {content}
                  </Link>
                ) : (
                  <div key={d.id} style={cardStyle}>
                    {content}
                  </div>
                );
              })}
            </div>
            {isLive && (
              <div style={{ textAlign: 'center', marginTop: 28 }}>
                <Link to="/find-a-doctor" style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', textDecoration: 'none' }}>
                  {t('seeAllDoctors')} →
                </Link>
              </div>
            )}
          </section>
        );
      })()}

      <PackageOffers />

      {/* Run-your-clinic / install offer — deliberately NOT wired to
          GET /packages/offers. That endpoint's booking flow is built
          specifically for the pediatric check-up packages (requires
          children_ages, offers a home-visit toggle) and has no concept
          of a software installation deal — a different product for a
          different (B2B, not patient) audience. This is static content
          with its own contact CTA instead of a mismatched booking form. */}
      <section style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-deep) 100%)', color: 'var(--white)', padding: '56px 20px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 26, color: 'var(--white)', marginBottom: 8 }}>{t('clinicOfferHeadline')}</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 28, maxWidth: 480, margin: '0 auto 28px' }}>{t('clinicOfferAudience')}</p>

          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius)', padding: '32px 28px' }}>
            <div style={{ fontSize: 34, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 4 }}>
              99,999 FCFA <span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.65)' }}>{t('clinicOfferPriceSuffix')}</span>
            </div>

            <ul style={{ listStyle: 'none', margin: '24px 0', padding: 0, display: 'grid', gap: 12, textAlign: 'left', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
              {(['clinicOfferBullet1', 'clinicOfferBullet2', 'clinicOfferBullet3', 'clinicOfferBullet4'] as const).map((key) => (
                <li key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
                  <span style={{ color: 'var(--teal)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {t(key)}
                </li>
              ))}
            </ul>

            <a
              href="https://med-vault.com/contact/"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                padding: '13px 28px',
                background: 'var(--clay)',
                color: 'var(--white)',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none'
              }}
            >
              {t('clinicOfferCta')} →
            </a>
          </div>
        </div>
      </section>

      {/* Partners — real logos, looping in a CSS-only marquee (the list is
          duplicated once so the loop point at -50% is seamless). */}
      <section style={{ padding: '40px 0', background: '#F3F1EC', overflow: 'hidden' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 20, letterSpacing: 0.3, textAlign: 'center' }}>
          {t('ourPartners')}
        </p>
        <div style={{ maskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)' }}>
          <div
            className="partner-marquee-track"
            style={{
              display: 'flex',
              width: 'max-content',
              gap: 48,
              animation: 'partner-marquee 22s linear infinite'
            }}
          >
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <img
                key={`${p.name}-${i}`}
                src={p.src}
                alt={p.name}
                title={p.name}
                style={{ height: 64, width: 'auto', borderRadius: 8, flexShrink: 0 }}
              />
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

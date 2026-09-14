import { useEffect, useState, type CSSProperties } from 'react';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

type Step =
  | { kind: 'browse' }
  | { kind: 'form'; offer: api.PackageOffer }
  | { kind: 'payment'; offer: api.PackageOffer; bookingRef: string; totalPrice: number };

export function PackageOffers() {
  const { t } = useLang();
  const [offers, setOffers] = useState<api.PackageOffer[] | null>(null);
  const [step, setStep] = useState<Step>({ kind: 'browse' });

  useEffect(() => {
    // Public homepage section — same fallback-to-hidden approach as the
    // doctor cards above it, so a backend hiccup never shows an error.
    api
      .getPackageOffers()
      .then((res) => setOffers(res.offers))
      .catch(() => setOffers([]));
  }, []);

  if (!offers || offers.length === 0) return null;

  return (
    <section style={{ padding: '56px 20px', background: '#F3F1EC' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <h2 style={{ fontSize: 26, marginBottom: 32, textAlign: 'center' }}>{t('packagesHeadline')}</h2>

        {step.kind === 'browse' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {offers.map((o) => (
              <OfferCard key={o.id} offer={o} onBook={() => setStep({ kind: 'form', offer: o })} />
            ))}
          </div>
        )}

        {step.kind === 'form' && (
          <BookingForm
            offer={step.offer}
            onCancel={() => setStep({ kind: 'browse' })}
            onBooked={(bookingRef, totalPrice) => setStep({ kind: 'payment', offer: step.offer, bookingRef, totalPrice })}
          />
        )}

        {step.kind === 'payment' && (
          <PaymentStep
            offer={step.offer}
            bookingRef={step.bookingRef}
            totalPrice={step.totalPrice}
            onDone={() => setStep({ kind: 'browse' })}
          />
        )}
      </div>
    </section>
  );
}

function OfferCard({ offer, onBook }: { offer: api.PackageOffer; onBook: () => void }) {
  const { t } = useLang();
  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        padding: '24px 20px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <h3 style={{ fontSize: 18, color: 'var(--navy)', marginBottom: 6 }}>{offer.name}</h3>
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 14 }}>{offer.description}</p>
      <ul style={{ margin: '0 0 16px', paddingLeft: 18, fontSize: 13, color: 'var(--ink)', lineHeight: 1.7 }}>
        {offer.included_items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--teal)' }}>
          {offer.base_price.toLocaleString()} FCFA{' '}
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-soft)' }}>{t('perChild')}</span>
        </div>
        {offer.home_service_fee > 0 && (
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 16 }}>
            + {offer.home_service_fee.toLocaleString()} FCFA {t('homeServiceFeeNote')}
          </div>
        )}
        <button onClick={onBook} style={{ ...submitButtonStyle, background: 'var(--clay)', marginTop: offer.home_service_fee > 0 ? 0 : 16 }}>
          {t('bookThisPackage')}
        </button>
      </div>
    </div>
  );
}

function BookingForm({
  offer,
  onCancel,
  onBooked
}: {
  offer: api.PackageOffer;
  onCancel: () => void;
  onBooked: (bookingRef: string, totalPrice: number) => void;
}) {
  const { t } = useLang();
  const [city, setCity] = useState('');
  const [ages, setAges] = useState<string[]>(['']);
  const [homeService, setHomeService] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeRange, setPreferredTimeRange] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setChildrenCount(count: number) {
    const n = Math.max(1, Math.min(10, count));
    setAges((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push('');
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);
    if (!city.trim() || !guardianPhone.trim() || ages.some((a) => a.trim() === '')) {
      setError(t('packageFormIncomplete'));
      return;
    }
    const parsedAges = ages.map((a) => Number(a));
    if (parsedAges.some((a) => !Number.isFinite(a) || a < 0)) {
      setError(t('packageFormIncomplete'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.createPackageBooking({
        offer_id: offer.id,
        guardian_phone: guardianPhone,
        guardian_name: guardianName || undefined,
        city,
        children_ages: parsedAges,
        home_service: homeService,
        preferred_date: preferredDate || undefined,
        preferred_time_range: preferredTimeRange || undefined
      });
      onBooked(res.booking_ref, res.total_price);
    } catch (e: any) {
      setError(e?.raw?.error || e?.message || t('somethingWentWrong'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '24px 22px', boxShadow: 'var(--shadow)' }}>
      <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 13, fontWeight: 700, padding: 0, marginBottom: 14, cursor: 'pointer' }}>
        ← {t('back')}
      </button>
      <h3 style={{ fontSize: 18, color: 'var(--navy)', marginBottom: 16 }}>{offer.name}</h3>

      {error && <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 14 }}>{error}</div>}

      <div style={{ display: 'grid', gap: 12 }}>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('city')} style={fieldStyle} />

        <div>
          <label style={labelStyle}>{t('numberOfChildren')}</label>
          <input type="number" min={1} max={10} value={ages.length} onChange={(e) => setChildrenCount(Number(e.target.value) || 1)} style={fieldStyle} />
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {ages.map((age, i) => (
            <input
              key={i}
              type="number"
              min={0}
              max={offer.max_child_age}
              value={age}
              onChange={(e) => setAges((prev) => prev.map((a, idx) => (idx === i ? e.target.value : a)))}
              placeholder={`${t('childAgeLabel')} ${i + 1}`}
              style={fieldStyle}
            />
          ))}
        </div>

        {offer.home_service_fee > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--ink)' }}>
            <input type="checkbox" checked={homeService} onChange={(e) => setHomeService(e.target.checked)} />
            {t('homeServiceLabel')} (+{offer.home_service_fee.toLocaleString()} FCFA)
          </label>
        )}

        <div>
          <label style={labelStyle}>{t('preferredDateLabel')}</label>
          <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} style={fieldStyle} />
        </div>

        <div>
          <label style={labelStyle}>{t('preferredTimeRangeLabel')}</label>
          <select value={preferredTimeRange} onChange={(e) => setPreferredTimeRange(e.target.value)} style={fieldStyle}>
            <option value="">{t('noPreference')}</option>
            <option value="morning">{t('morning')}</option>
            <option value="afternoon">{t('afternoon')}</option>
            <option value="evening">{t('evening')}</option>
          </select>
        </div>

        <input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder={t('guardianNameLabel')} style={fieldStyle} />
        <input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder={t('guardianPhoneLabel')} style={fieldStyle} />

        <button onClick={handleSubmit} disabled={submitting} style={{ ...submitButtonStyle, opacity: submitting ? 0.6 : 1 }}>
          {submitting ? t('booking') : t('confirmBooking')}
        </button>
      </div>
    </div>
  );
}

function PaymentStep({
  offer,
  bookingRef,
  totalPrice,
  onDone
}: {
  offer: api.PackageOffer;
  bookingRef: string;
  totalPrice: number;
  onDone: () => void;
}) {
  const { t } = useLang();
  const [phone, setPhone] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [status, setStatus] = useState('unpaid');
  const [error, setError] = useState<string | null>(null);

  async function handleRequestPayment() {
    setRequesting(true);
    setError(null);
    try {
      await api.requestPackageBookingPayment(bookingRef, phone);
      setStatus('pending');
    } catch (e: any) {
      setError(e?.raw?.error || e?.message || t('somethingWentWrong'));
    } finally {
      setRequesting(false);
    }
  }

  async function handleRefresh() {
    const res = await api.getPackageBooking(bookingRef);
    setStatus(res.payment_status);
  }

  const statusLabel = status === 'paid' ? t('paid') : status === 'pending' ? t('pending') : t('unpaid');

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '24px 22px', boxShadow: 'var(--shadow)' }}>
      <div style={{ background: 'var(--teal-light)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)', marginBottom: 6 }}>✓ {t('bookingConfirmed')}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          {offer.name} · {t('bookingRefLabel')}: {bookingRef}
        </div>
      </div>

      <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t('payNow')}</h3>
      <p style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--navy)', marginBottom: 16 }}>{totalPrice.toLocaleString()} FCFA</p>

      {error && <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {status !== 'paid' && (
        <>
          <label style={labelStyle}>{t('momoNumber')}</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="237 6XX XXX XXX" style={{ ...fieldStyle, marginBottom: 12 }} />
          <button onClick={handleRequestPayment} disabled={requesting || !phone.trim()} style={{ ...submitButtonStyle, opacity: requesting ? 0.6 : 1, marginBottom: 12 }}>
            {requesting ? t('requestingPayment') : t('requestPayment')}
          </button>
          {status === 'pending' && <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>{t('checkUssdPrompt')}</p>}
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          {t('paymentStatus')}: <strong style={{ color: 'var(--navy)' }}>{statusLabel}</strong>
        </span>
        <button onClick={handleRefresh} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {t('refreshStatus')}
        </button>
      </div>

      {status === 'paid' && (
        <button onClick={onDone} style={{ ...submitButtonStyle, marginTop: 16 }}>
          {t('backToHome')}
        </button>
      )}
    </div>
  );
}

const fieldStyle: CSSProperties = { padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 'var(--radius-sm)', boxSizing: 'border-box', width: '100%' };
const labelStyle: CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 };
const submitButtonStyle: CSSProperties = { width: '100%', padding: '13px 16px', fontSize: 14, fontWeight: 700, color: 'var(--white)', background: 'var(--teal)', border: 'none', borderRadius: 'var(--radius-sm)' };

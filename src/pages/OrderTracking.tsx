import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

// Status/payment_status values aren't a confirmed enum from the backend
// (only "pending_payment"/"unpaid" and "paid" have been observed) — format
// generically (snake_case -> Title Case) rather than guess a translation
// table that might not cover every real value.
function formatStatus(s: string) {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function OrderTracking() {
  const { t } = useLang();
  const { bookingRef: paramRef } = useParams<{ bookingRef?: string }>();
  const navigate = useNavigate();
  const [inputRef, setInputRef] = useState(paramRef ?? '');
  const [booking, setBooking] = useState<api.PackageBooking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(ref: string) {
    setLoading(true);
    setError('');
    setBooking(null);
    try {
      const res = await api.getPackageBooking(ref.trim());
      setBooking(res);
    } catch {
      setError(t('bookingNotFound'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (paramRef) {
      setInputRef(paramRef);
      load(paramRef);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramRef]);

  function handleSearch() {
    const ref = inputRef.trim();
    if (!ref) return;
    if (ref === paramRef) load(ref);
    else navigate(`/track/${ref}`);
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>{t('trackYourBookingTitle')}</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          value={inputRef}
          onChange={(e) => setInputRef(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={t('bookingRefPlaceholder')}
          style={inputStyle}
        />
        <button onClick={handleSearch} disabled={!inputRef.trim() || loading} style={{ ...searchButtonStyle, opacity: loading ? 0.6 : 1 }}>
          {t('search')}
        </button>
      </div>

      {error && <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {booking && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--navy)', marginBottom: 4 }}>{booking.offer_name}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>{booking.booking_ref}</div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <span style={badgeStyle(booking.status)}>{formatStatus(booking.status)}</span>
            <span style={badgeStyle(booking.payment_status)}>{formatStatus(booking.payment_status)}</span>
          </div>

          <Row label={t('city')} value={booking.city} />
          <Row label={t('numberOfChildren')} value={String(booking.children_count)} />
          <Row label={t('homeVisitPlainLabel')} value={booking.home_service ? t('yes') : t('no')} />
          {booking.preferred_date && (
            <Row
              label={t('preferredDatePlainLabel')}
              value={new Date(booking.preferred_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
            />
          )}
          {booking.preferred_time_range && <Row label={t('preferredTimePlainLabel')} value={booking.preferred_time_range} />}
          <Row label={t('priceLabel')} value={`${booking.total_price.toLocaleString()} FCFA`} />
          <Row label={t('bookedOnLabel')} value={new Date(booking.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--line)', fontSize: 13 }}>
      <span style={{ color: 'var(--ink-soft)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{value}</span>
    </div>
  );
}

function badgeStyle(status: string): CSSProperties {
  const positive = status === 'paid' || status === 'confirmed' || status === 'completed';
  return {
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 20,
    background: positive ? '#E4F3EA' : '#FBF1E8',
    color: positive ? 'var(--success)' : 'var(--clay)'
  };
}

const inputStyle: CSSProperties = { flex: 1, padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 'var(--radius-sm)', boxSizing: 'border-box' };
const searchButtonStyle: CSSProperties = { padding: '12px 16px', fontSize: 14, fontWeight: 700, color: 'var(--white)', background: 'var(--teal)', border: 'none', borderRadius: 'var(--radius-sm)' };

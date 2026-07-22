import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

export function Hospitals() {
  const { t } = useLang();
  const [city, setCity] = useState('');
  const [hospitals, setHospitals] = useState<api.PublicHospital[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [locationError, setLocationError] = useState('');

  async function handleSearch() {
    setLoading(true);
    setSearched(true);
    setLocationError('');
    try {
      const res = await api.browseHospitals(city || undefined);
      setHospitals(res.hospitals);
    } catch {
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setLocationError(t('geolocationNotSupported'));
      return;
    }
    setLoading(true);
    setSearched(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await api.getHospitalsNearby(position.coords.latitude, position.coords.longitude);
          setHospitals(res.hospitals);
        } catch {
          setHospitals([]);
        } finally {
          setLoading(false);
        }
      },
      () => {
        // Browser denied or failed to get a location — a real, common
        // case (permission refused, no GPS signal), not a bug to chase.
        setLocationError(t('locationPermissionDenied'));
        setLoading(false);
      }
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>{t('findAHospital')}</h1>

      <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('city')} style={fieldStyle} />
        <button onClick={handleSearch} disabled={loading} style={{ ...searchButtonStyle, opacity: loading ? 0.6 : 1 }}>
          {t('search')}
        </button>
      </div>

      <button
        onClick={handleUseMyLocation}
        disabled={loading}
        style={{ ...searchButtonStyle, background: 'var(--navy)', width: '100%', marginBottom: 20, opacity: loading ? 0.6 : 1 }}
      >
        📍 {t('useMyLocation')}
      </button>

      {locationError && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{locationError}</p>}

      {searched && !loading && hospitals?.length === 0 && !locationError && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('noHospitalsFound')}</p>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {hospitals?.map((h) => (
          <Link
            key={h.hospitalId}
            to={`/hospitals/${h.hospitalId}`}
            style={{
              display: 'block',
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: '16px 18px',
              textDecoration: 'none',
              color: 'inherit',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{h.name}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>{h.city ?? h.region ?? ''}</div>
            {h.distance_km !== undefined && (
              <div style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 700, marginTop: 8 }}>
                {h.distance_km.toFixed(1)} km {t('away')}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

const fieldStyle = {
  padding: '11px 14px',
  fontSize: 15,
  border: '1.5px solid var(--line)',
  borderRadius: 'var(--radius-sm)',
  boxSizing: 'border-box' as const
};

const searchButtonStyle = {
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--white)',
  background: 'var(--teal)',
  border: 'none',
  borderRadius: 'var(--radius-sm)'
};

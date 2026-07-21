import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import * as api from '../lib/api';

export function Labs() {
  const { t } = useLang();
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [city, setCity] = useState('');
  const [labs, setLabs] = useState<api.PublicLabProvider[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceType, setServiceType] = useState<'on_site' | 'home_visit'>('on_site');
  const [homeAddress, setHomeAddress] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookedRef, setBookedRef] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleSearch() {
    const res = await api.browseLabs(city || undefined);
    setLabs(res.lab_providers);
  }

  useEffect(() => {
    handleSearch();
  }, []);

  function toggleExpand(labId: string) {
    setExpandedId(expandedId === labId ? null : labId);
    setSelectedServiceIds([]);
    setBookedRef(null);
    setError('');
  }

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) => (prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]));
  }

  async function handleBook(labId: string) {
    if (!userId) {
      navigate('/login');
      return;
    }
    if (selectedServiceIds.length === 0) return;
    setBooking(true);
    setError('');
    try {
      const res = await api.createLabOrder({
        lab_provider_id: labId,
        lab_service_ids: selectedServiceIds,
        service_type: serviceType,
        home_address: serviceType === 'home_visit' ? homeAddress : undefined
      });
      setBookedRef(res.lab_order.orderRef);
    } catch {
      setError(t('somethingWentWrong'));
    } finally {
      setBooking(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>{t('findALab')}</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t('city')}
          style={{ flex: 1, padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box' }}
        />
        <button onClick={handleSearch} style={{ padding: '11px 20px', fontSize: 14, fontWeight: 700, color: 'var(--white)', background: 'var(--teal)', border: 'none', borderRadius: 8 }}>
          {t('search')}
        </button>
      </div>

      {labs && labs.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('noLabsFound')}</p>}

      <div style={{ display: 'grid', gap: 12 }}>
        {labs?.map((lab) => (
          <div key={lab.id} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '16px 18px', boxShadow: 'var(--shadow)' }}>
            <div onClick={() => toggleExpand(lab.id)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{lab.name}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{lab.city ?? ''} · {lab.services.length} {t('labServices').toLowerCase()}</div>
              </div>
              <span style={{ color: 'var(--teal)', fontWeight: 700 }}>{expandedId === lab.id ? '▲' : '▼'}</span>
            </div>

            {expandedId === lab.id && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                {lab.services.length === 0 && <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t('noServicesYet')}</p>}
                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  {lab.services.map((s) => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedServiceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
                      <span style={{ flex: 1 }}>{s.testName}</span>
                      <span style={{ fontWeight: 700, color: 'var(--teal)' }}>{Number(s.basePrice).toLocaleString()} FCFA</span>
                    </label>
                  ))}
                </div>

                {(lab.serviceType === 'home_visit' || lab.serviceType === 'both') && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'flex', gap: 16, fontSize: 13, marginBottom: 8 }}>
                      <span>
                        <input type="radio" checked={serviceType === 'on_site'} onChange={() => setServiceType('on_site')} /> {t('onSite')}
                      </span>
                      <span>
                        <input type="radio" checked={serviceType === 'home_visit'} onChange={() => setServiceType('home_visit')} /> {t('homeVisit')}
                      </span>
                    </label>
                    {serviceType === 'home_visit' && (
                      <input
                        value={homeAddress}
                        onChange={(e) => setHomeAddress(e.target.value)}
                        placeholder={t('homeAddress')}
                        style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                )}

                {error && <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>{error}</div>}

                {bookedRef ? (
                  <div style={{ background: '#E4F3EA', color: 'var(--success)', borderRadius: 8, padding: '12px 14px', fontSize: 14, fontWeight: 600 }}>
                    ✓ {t('labOrderBooked')} — {bookedRef}
                  </div>
                ) : (
                  <button
                    onClick={() => handleBook(lab.id)}
                    disabled={selectedServiceIds.length === 0 || booking}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--white)',
                      background: 'var(--navy)',
                      border: 'none',
                      borderRadius: 8,
                      opacity: selectedServiceIds.length === 0 || booking ? 0.6 : 1
                    }}
                  >
                    {booking ? t('sending') : t('bookLabTest')}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

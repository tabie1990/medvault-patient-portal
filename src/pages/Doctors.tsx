import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

export function Doctors() {
  const { t } = useLang();
  const [specialty, setSpecialty] = useState('');
  const [name, setName] = useState('');
  const [doctors, setDoctors] = useState<api.Doctor[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.listDoctors({ specialty: specialty || undefined, name: name || undefined });
      setDoctors(res.doctors);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>{t('findADoctor')}</h1>

      <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
        <input
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          placeholder={t('searchSpecialty')}
          style={fieldStyle}
        />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('searchName')} style={fieldStyle} />
        <button onClick={handleSearch} disabled={loading} style={{ ...searchButtonStyle, opacity: loading ? 0.6 : 1 }}>
          {t('search')}
        </button>
      </div>

      {searched && !loading && doctors?.length === 0 && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('noDoctorsFound')}</p>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {doctors?.map((d) => (
          <Link
            key={d.id}
            to={`/doctors/${d.id}`}
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
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{d.fullName}</div>
            {d.specialty && <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>{d.specialty}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 700 }}>
                {d.teleconsultFee ? `${Number(d.teleconsultFee).toLocaleString()} FCFA` : ''} {d.teleconsultFee && t('perConsult')}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{t('viewAvailability')} →</span>
            </div>
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

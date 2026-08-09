import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import * as api from '../lib/api';

export function Children() {
  const { t } = useLang();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<api.ChildSummary[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [relationship, setRelationship] = useState('');
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [lookupError, setLookupError] = useState('');

  async function load() {
    if (role === 'doctor') {
      setChildren([]);
      return;
    }
    const res = await api.getMyChildren();
    setChildren(res.children);
  }

  useEffect(() => {
    load();
  }, [role]);

  async function handleLookup() {
    if (!lookupId) return;
    setLookupError('');
    try {
      await api.getChildFullRecord(lookupId.trim());
      navigate(`/children/${lookupId.trim()}`);
    } catch {
      setLookupError(t('childNotFound'));
    }
  }

  async function handleRegister() {
    if (!fullName || !dob || !relationship) return;
    setRegistering(true);
    setError('');
    try {
      await api.registerChild({ full_name: fullName, dob, sex: sex || undefined, relationship });
      setFullName('');
      setDob('');
      setSex('');
      setRelationship('');
      setShowForm(false);
      await load();
    } catch {
      setError(t('somethingWentWrong'));
    } finally {
      setRegistering(false);
    }
  }

  if (!children) return null;

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h1 style={{ fontSize: 24 }}>{role === 'doctor' ? t('lookUpAChild') : t('myChildren')}</h1>
        {role !== 'doctor' && (
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{ padding: '9px 16px', fontSize: 13, fontWeight: 700, color: 'var(--white)', background: 'var(--teal)', border: 'none', borderRadius: 8 }}
          >
            {showForm ? t('cancel') : `+ ${t('registerChild')}`}
          </button>
        )}
      </div>

      {role === 'doctor' && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 18, marginBottom: 20 }}>
          {lookupError && <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 14 }}>{lookupError}</div>}
          <label style={labelStyle}>{t('childMedvaultId')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={lookupId} onChange={(e) => setLookupId(e.target.value)} placeholder="MVG-0000000060" style={inputStyle} />
            <button
              onClick={handleLookup}
              disabled={!lookupId}
              style={{ padding: '11px 18px', fontSize: 14, fontWeight: 700, color: 'var(--white)', background: 'var(--navy)', border: 'none', borderRadius: 8, whiteSpace: 'nowrap', opacity: lookupId ? 1 : 0.6 }}
            >
              {t('search')}
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 18, marginBottom: 20 }}>
          {error && <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <label style={labelStyle}>{t('fullName')}</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
          <label style={{ ...labelStyle, marginTop: 12 }}>{t('dobLabel')}</label>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={inputStyle} />
          <label style={{ ...labelStyle, marginTop: 12 }}>{t('sexOptional')}</label>
          <select value={sex} onChange={(e) => setSex(e.target.value)} style={inputStyle}>
            <option value="">—</option>
            <option value="male">{t('male')}</option>
            <option value="female">{t('female')}</option>
          </select>
          <label style={{ ...labelStyle, marginTop: 12 }}>{t('relationshipToChild')}</label>
          <input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder={t('relationshipPlaceholder')} style={inputStyle} />
          <button
            onClick={handleRegister}
            disabled={registering || !fullName || !dob || !relationship}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--white)',
              background: 'var(--navy)',
              border: 'none',
              borderRadius: 8,
              opacity: registering || !fullName || !dob || !relationship ? 0.6 : 1
            }}
          >
            {registering ? t('sending') : t('registerChild')}
          </button>
        </div>
      )}

      {role !== 'doctor' && children.length === 0 && !showForm && <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('noChildrenYet')}</p>}

      <div style={{ display: 'grid', gap: 10 }}>
        {children.map((c) => (
          <Link
            key={c.globalPatientId}
            to={`/children/${c.globalPatientId}`}
            style={{
              display: 'block',
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: '14px 18px',
              textDecoration: 'none',
              color: 'inherit',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{c.fullName}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
              {c.relationship} · {new Date(c.dob).toLocaleDateString('en-GB')}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box' as const };

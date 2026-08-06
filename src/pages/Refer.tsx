import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

export function Refer() {
  const { t } = useLang();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [momoNumber, setMomoNumber] = useState('');
  const [momoNetwork, setMomoNetwork] = useState('MTN');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ code: string; share_link: string } | null>(null);

  async function handleGenerate() {
    if (!name || !phone) return;
    setGenerating(true);
    setError('');
    try {
      const res = await api.generateReferralCode({
        referrer_name: name,
        referrer_phone: phone,
        referrer_momo_number: momoNumber || undefined,
        referrer_momo_network: momoNumber ? momoNetwork : undefined
      });
      setResult(res);
    } catch {
      setError(t('somethingWentWrong'));
    } finally {
      setGenerating(false);
    }
  }

  if (result) {
    return (
      <div style={{ maxWidth: 420, margin: '60px auto 0', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>{t('referralReady')}</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>{t('myReferralLinkHint')}</p>
        <div style={{ background: 'var(--teal-light)', borderRadius: 8, padding: '12px 16px', fontSize: 14, wordBreak: 'break-all', marginBottom: 24 }}>
          {result.share_link}
        </div>
        <Link to="/" style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 14 }}>
          ← {t('backToHome')}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto 0' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>{t('referADoctor')}</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>{t('referADoctorIntro')}</p>

      {error && (
        <div style={{ background: '#FBEAE8', color: 'var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <label style={labelStyle}>{t('fullName')}</label>
      <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />

      <label style={{ ...labelStyle, marginTop: 14 }}>{t('phoneLabel')}</label>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('phonePlaceholder')} style={inputStyle} />

      <label style={{ ...labelStyle, marginTop: 14 }}>{t('momoNumberLabel')} ({t('optional')})</label>
      <input value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} style={inputStyle} />

      {momoNumber && (
        <select value={momoNetwork} onChange={(e) => setMomoNetwork(e.target.value)} style={{ ...inputStyle, marginTop: 10 }}>
          <option value="MTN">MTN</option>
          <option value="Orange">Orange</option>
        </select>
      )}

      <button
        onClick={handleGenerate}
        disabled={generating || !name || !phone}
        style={{
          width: '100%',
          marginTop: 20,
          padding: '13px 16px',
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--white)',
          background: 'var(--navy)',
          border: 'none',
          borderRadius: 8,
          opacity: generating || !name || !phone ? 0.6 : 1
        }}
      >
        {generating ? t('sending') : t('generateLink')}
      </button>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box' as const };

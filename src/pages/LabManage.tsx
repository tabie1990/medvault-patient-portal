import { useEffect, useState, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

export function LabManage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLang();
  const [lab, setLab] = useState<api.MyLabProvider | null>(null);
  const [staff, setStaff] = useState<api.LabStaffMember[]>([]);

  const [testName, setTestName] = useState('');
  const [price, setPrice] = useState('');
  const [addingService, setAddingService] = useState(false);

  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffAddedMsg, setStaffAddedMsg] = useState(false);

  const [momoNumber, setMomoNumber] = useState('');
  const [momoNetwork, setMomoNetwork] = useState('MTN');
  const [savingMomo, setSavingMomo] = useState(false);

  async function load() {
    if (!id) return;
    const labsRes = await api.getMyLabs();
    const found = labsRes.lab_providers.find((l) => l.id === id);
    if (found) {
      setLab(found);
      setMomoNumber(found.momoNumber ?? '');
      setMomoNetwork(found.momoNetwork ?? 'MTN');
    }
    const staffRes = await api.getLabStaff(id);
    setStaff(staffRes.staff);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleAddService() {
    if (!id || !testName || !price) return;
    setAddingService(true);
    try {
      await api.addLabService(id, { test_name: testName, base_price: Number(price) });
      setTestName('');
      setPrice('');
      await load();
    } finally {
      setAddingService(false);
    }
  }

  async function handleAddStaff() {
    if (!id || !staffName || !staffEmail) return;
    setAddingStaff(true);
    setStaffAddedMsg(false);
    try {
      await api.addLabStaff(id, { full_name: staffName, email: staffEmail });
      setStaffName('');
      setStaffEmail('');
      setStaffAddedMsg(true);
      await load();
    } finally {
      setAddingStaff(false);
    }
  }

  async function handleSaveMomo() {
    if (!id) return;
    setSavingMomo(true);
    try {
      await api.setLabPayoutDetails(id, { momo_number: momoNumber, momo_network: momoNetwork });
      await load();
    } finally {
      setSavingMomo(false);
    }
  }

  if (!lab) return null;

  return (
    <div>
      <Link to="/doctor/labs" style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
        {t('backToLabs')}
      </Link>

      <h1 style={{ fontSize: 24, marginBottom: 6 }}>{lab.name}</h1>
      <span
        style={{
          display: 'inline-block',
          fontSize: 12,
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 20,
          marginBottom: 20,
          background: lab.verificationStatus === 'verified' ? '#E4F3EA' : '#FBF1E8',
          color: lab.verificationStatus === 'verified' ? 'var(--success)' : 'var(--clay)'
        }}
      >
        {lab.verificationStatus}
      </span>

      {lab.verificationStatus !== 'verified' && (
        <Link
          to={`/doctor/labs/${lab.id}/kyc`}
          style={{
            display: 'block',
            background: 'var(--teal-light)',
            border: '1px solid var(--teal)',
            borderRadius: 'var(--radius)',
            padding: '14px 18px',
            marginBottom: 24,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 14,
            color: 'var(--navy)'
          }}
        >
          {t('verifyThisLab')} →
        </Link>
      )}

      <Section title={t('payoutDetails')}>
        <label style={labelStyle}>{t('momoNumberLabel')}</label>
        <input value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} style={inputStyle} />
        <select value={momoNetwork} onChange={(e) => setMomoNetwork(e.target.value)} style={{ ...inputStyle, marginTop: 10 }}>
          <option value="MTN">MTN</option>
          <option value="Orange">Orange</option>
        </select>
        <button onClick={handleSaveMomo} disabled={savingMomo} style={{ ...primaryBtn, marginTop: 10, opacity: savingMomo ? 0.6 : 1 }}>
          {t('save')}
        </button>
      </Section>

      <Section title={t('labServices')}>
        {lab.services.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{t('noServicesYet')}</p>}
        {lab.services.map((s) => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
            <span>{s.testName}</span>
            <span style={{ fontWeight: 700, color: 'var(--teal)' }}>{Number(s.basePrice).toLocaleString()} FCFA</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input value={testName} onChange={(e) => setTestName(e.target.value)} placeholder={t('testNamePlaceholder')} style={{ ...inputStyle, flex: 2 }} />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t('priceInFcfa')} inputMode="numeric" style={{ ...inputStyle, flex: 1 }} />
          <button onClick={handleAddService} disabled={addingService || !testName || !price} style={{ ...primaryBtn, opacity: addingService || !testName || !price ? 0.6 : 1 }}>
            {t('add')}
          </button>
        </div>
      </Section>

      <Section title={t('labStaffTitle')}>
        {staff.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{t('noStaffYet')}</p>}
        {staff.map((s) => (
          <div key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
            {s.fullName} — <span style={{ color: 'var(--ink-soft)' }}>{s.email ?? s.phone}</span>
          </div>
        ))}
        {staffAddedMsg && <p style={{ fontSize: 13, color: 'var(--success)', marginTop: 10 }}>{t('staffAdded')}</p>}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder={t('fullName')} style={{ ...inputStyle, flex: 1 }} />
          <input value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder={t('emailLabel')} style={{ ...inputStyle, flex: 1 }} />
          <button onClick={handleAddStaff} disabled={addingStaff || !staffName || !staffEmail} style={{ ...primaryBtn, opacity: addingStaff || !staffName || !staffEmail ? 0.6 : 1 }}>
            {t('addStaff')}
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 18, marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box' as const };
const primaryBtn = { padding: '11px 18px', fontSize: 14, fontWeight: 700, color: 'var(--white)', background: 'var(--navy)', border: 'none', borderRadius: 8 };

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import * as api from '../lib/api';
import { WeeklyScheduleEditor, type WeeklyWindow } from '../components/WeeklyScheduleEditor';
import { CollapsibleSection } from '../components/CollapsibleSection';

export function LabManage() {
  const { id: paramId } = useParams<{ id: string }>();
  const { t } = useLang();
  const { userId, role } = useAuth();
  const [lab, setLab] = useState<api.MyLabProvider | null>(null);
  const [staff, setStaff] = useState<api.LabStaffMember[]>([]);
  // Same self-service resolution as LabKycSubmit — /lab/manage has no
  // :id in the URL at all, since a self-registered lab's own staff only
  // ever has the one lab to manage.
  const [id, setId] = useState<string | undefined>(paramId);
  const backTo = paramId ? '/doctor/labs' : '/lab';

  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPhone, setAccountPhone] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountSaved, setAccountSaved] = useState(false);

  const [testName, setTestName] = useState('');
  const [price, setPrice] = useState('');
  const [addingService, setAddingService] = useState(false);
  const [showBulkServices, setShowBulkServices] = useState(false);
  const [bulkServicesText, setBulkServicesText] = useState('');
  const [bulkServiceError, setBulkServiceError] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [savingServiceId, setSavingServiceId] = useState<string | null>(null);

  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffAddedMsg, setStaffAddedMsg] = useState(false);

  const [momoNumber, setMomoNumber] = useState('');
  const [momoNetwork, setMomoNetwork] = useState('MTN');
  const [email, setEmail] = useState('');
  const [savingMomo, setSavingMomo] = useState(false);
  const [savingHours, setSavingHours] = useState(false);

  async function load() {
    const labsRes = await api.getMyLabs();
    // When there's no :id (self-service /lab/manage), there's exactly
    // one lab to find — the caller's own.
    const found = id ? labsRes.lab_providers.find((l) => l.id === id) : labsRes.lab_providers[0];
    if (found) {
      setLab(found);
      setId(found.id);
      setMomoNumber(found.momoNumber ?? '');
      setMomoNetwork(found.momoNetwork ?? 'MTN');
      setEmail(found.email ?? '');
    }
    if (found) {
      const staffRes = await api.getLabStaff(found.id);
      setStaff(staffRes.staff);
      const me = staffRes.staff.find((s) => s.id === userId);
      if (me) {
        setAccountName(me.fullName);
        setAccountEmail(me.email ?? '');
        setAccountPhone(me.phone ?? '');
      }
    }
  }

  useEffect(() => {
    load();
  }, [paramId]);

  async function handleSaveAccount() {
    setSavingAccount(true);
    setAccountError('');
    setAccountSaved(false);
    try {
      await api.updateLabStaffAccount({ full_name: accountName, email: accountEmail || undefined, phone: accountPhone || undefined });
      setAccountSaved(true);
      await load();
    } catch (e: any) {
      setAccountError(
        e?.raw?.error === 'an_account_with_this_email_already_exists' || e?.raw?.error === 'an_account_with_this_phone_already_exists'
          ? t('accountAlreadyExists')
          : t('somethingWentWrong')
      );
    } finally {
      setSavingAccount(false);
    }
  }

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

  // Bulk add — one "Test name, Price" per line. Reuses the same
  // single-item addLabService call in a loop rather than adding a new
  // backend bulk-create endpoint — these are lightweight, low-frequency
  // writes (a lab setting up its price list once), not worth the extra
  // backend surface for what a simple client-side loop already handles
  // correctly and atomically-enough per line.
  async function handleBulkAddServices() {
    if (!id || !bulkServicesText.trim()) return;
    setAddingService(true);
    setBulkServiceError('');
    const lines = bulkServicesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const failed: string[] = [];
    for (const line of lines) {
      const [name, priceStr] = line.split(',').map((p) => p.trim());
      const parsedPrice = Number(priceStr);
      if (!name || !priceStr || Number.isNaN(parsedPrice)) {
        failed.push(line);
        continue;
      }
      try {
        await api.addLabService(id, { test_name: name, base_price: parsedPrice });
      } catch {
        failed.push(line);
      }
    }
    if (failed.length > 0) {
      setBulkServiceError(`${t('bulkAddPartialFailure')}: ${failed.join(' · ')}`);
    } else {
      setBulkServicesText('');
      setShowBulkServices(false);
    }
    await load();
    setAddingService(false);
  }

  async function handleSavePrice(serviceId: string) {
    if (!id || !editingPrice) return;
    setSavingServiceId(serviceId);
    try {
      await api.updateLabService(id, serviceId, { base_price: Number(editingPrice) });
      setEditingServiceId(null);
      await load();
    } finally {
      setSavingServiceId(null);
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
      await api.setLabPayoutDetails(id, { momo_number: momoNumber, momo_network: momoNetwork, email });
      await load();
    } finally {
      setSavingMomo(false);
    }
  }

  async function handleSaveWorkingHours(windows: WeeklyWindow[]) {
    if (!id) return;
    setSavingHours(true);
    try {
      await api.setLabWorkingHours(id, windows.map((w) => ({ day_of_week: w.dayOfWeek, open_time: w.start, close_time: w.end })));
      await load();
    } finally {
      setSavingHours(false);
    }
  }

  if (!lab) return null;

  return (
    <div>
      <Link to={backTo} style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
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
          to={paramId ? `/doctor/labs/${lab.id}/kyc` : '/lab/kyc'}
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

      {role === 'lab_staff' && (
        <CollapsibleSection title={t('myAccountTitle')}>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14 }}>{t('myAccountHint')}</p>
          <label style={labelStyle}>{t('fullName')}</label>
          <input value={accountName} onChange={(e) => setAccountName(e.target.value)} style={inputStyle} />
          <label style={{ ...labelStyle, marginTop: 10 }}>{t('emailLabel')}</label>
          <input type="email" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} style={inputStyle} />
          <label style={{ ...labelStyle, marginTop: 10 }}>{t('phoneOptional')}</label>
          <input value={accountPhone} onChange={(e) => setAccountPhone(e.target.value)} style={inputStyle} />
          {accountError && <p style={{ fontSize: 13, color: 'var(--danger)', marginTop: 10 }}>{accountError}</p>}
          {accountSaved && !accountError && <p style={{ fontSize: 13, color: 'var(--success)', marginTop: 10 }}>{t('savedSuccessfully')}</p>}
          <button onClick={handleSaveAccount} disabled={savingAccount} style={{ ...primaryBtn, marginTop: 10, opacity: savingAccount ? 0.6 : 1 }}>
            {savingAccount ? t('sending') : t('save')}
          </button>
        </CollapsibleSection>
      )}

      <CollapsibleSection title={t('payoutDetails')}>
        <label style={labelStyle}>{t('momoNumberLabel')}</label>
        <input value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} style={inputStyle} />
        <select value={momoNetwork} onChange={(e) => setMomoNetwork(e.target.value)} style={{ ...inputStyle, marginTop: 10 }}>
          <option value="MTN">MTN</option>
          <option value="Orange">Orange</option>
        </select>
        <label style={{ ...labelStyle, marginTop: 10 }}>{t('contactEmailLabel')}</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('contactEmailHint')} style={inputStyle} />
        <button onClick={handleSaveMomo} disabled={savingMomo} style={{ ...primaryBtn, marginTop: 10, opacity: savingMomo ? 0.6 : 1 }}>
          {t('save')}
        </button>
      </CollapsibleSection>

      <CollapsibleSection title={t('workingHours')}>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14 }}>{t('workingHoursIntro')}</p>
        <WeeklyScheduleEditor
          initialWindows={lab.workingHours.map((w) => ({ dayOfWeek: w.dayOfWeek, start: w.openTime, end: w.closeTime }))}
          onSave={handleSaveWorkingHours}
          saving={savingHours}
        />
      </CollapsibleSection>

      <CollapsibleSection title={t('labServices')}>
        {lab.services.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{t('noServicesYet')}</p>}
        {lab.services.map((s) => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
            <span>{s.testName}</span>
            {editingServiceId === s.id ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  value={editingPrice}
                  onChange={(e) => setEditingPrice(e.target.value)}
                  inputMode="numeric"
                  style={{ ...inputStyle, width: 90, padding: '5px 8px' }}
                  autoFocus
                />
                <button
                  onClick={() => handleSavePrice(s.id)}
                  disabled={savingServiceId === s.id}
                  style={{ ...primaryBtn, padding: '5px 10px', fontSize: 12 }}
                >
                  {savingServiceId === s.id ? '…' : t('save')}
                </button>
                <button
                  onClick={() => setEditingServiceId(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 12 }}
                >
                  {t('cancel')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingServiceId(s.id);
                  setEditingPrice(String(s.basePrice));
                }}
                style={{ background: 'none', border: 'none', fontWeight: 700, color: 'var(--teal)', cursor: 'pointer', padding: 0 }}
              >
                {Number(s.basePrice).toLocaleString()} FCFA ✏️
              </button>
            )}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input value={testName} onChange={(e) => setTestName(e.target.value)} placeholder={t('testNamePlaceholder')} style={{ ...inputStyle, flex: 2 }} />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t('priceInFcfa')} inputMode="numeric" style={{ ...inputStyle, flex: 1 }} />
          <button onClick={handleAddService} disabled={addingService || !testName || !price} style={{ ...primaryBtn, opacity: addingService || !testName || !price ? 0.6 : 1 }}>
            {t('add')}
          </button>
        </div>

        {showBulkServices ? (
          <div style={{ marginTop: 14 }}>
            <textarea
              value={bulkServicesText}
              onChange={(e) => setBulkServicesText(e.target.value)}
              placeholder={t('bulkServicesPlaceholder')}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
            />
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>{t('bulkServicesHint')}</p>
            {bulkServiceError && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{bulkServiceError}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                onClick={handleBulkAddServices}
                disabled={addingService || !bulkServicesText.trim()}
                style={{ ...primaryBtn, opacity: addingService || !bulkServicesText.trim() ? 0.6 : 1 }}
              >
                {addingService ? t('sending') : t('bulkAddButton')}
              </button>
              <button
                onClick={() => {
                  setShowBulkServices(false);
                  setBulkServiceError('');
                }}
                style={{ padding: '11px 18px', fontSize: 14, fontWeight: 700, color: 'var(--navy)', background: 'var(--white)', border: '1.5px solid var(--line)', borderRadius: 8 }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowBulkServices(true)}
            style={{ marginTop: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, color: 'var(--teal)', background: 'transparent', border: '1.5px solid var(--teal)', borderRadius: 8 }}
          >
            + {t('bulkAddServices')}
          </button>
        )}
      </CollapsibleSection>

      <CollapsibleSection title={t('labStaffTitle')}>
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
      </CollapsibleSection>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '11px 14px', fontSize: 15, border: '1.5px solid var(--line)', borderRadius: 8, boxSizing: 'border-box' as const };
const primaryBtn = { padding: '11px 18px', fontSize: 14, fontWeight: 700, color: 'var(--white)', background: 'var(--navy)', border: 'none', borderRadius: 8 };

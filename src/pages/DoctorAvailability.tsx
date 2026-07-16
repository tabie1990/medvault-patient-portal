import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';
import { WeeklyScheduleEditor, type WeeklyWindow } from '../components/WeeklyScheduleEditor';

export function DoctorAvailability() {
  const { t } = useLang();
  const [windows, setWindows] = useState<WeeklyWindow[] | null>(null);
  const [slotMinutes, setSlotMinutes] = useState(15);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  async function load() {
    const [availRes, docRes] = await Promise.all([api.getMyAvailability(), api.getMyDoctorProfile()]);
    setWindows(availRes.availability.map((w) => ({ dayOfWeek: w.dayOfWeek, start: w.startTime, end: w.endTime })));
    setSlotMinutes(docRes.doctor.teleconsultSlotMinutes);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSaveWindows(newWindows: WeeklyWindow[]) {
    setSaving(true);
    setSavedMsg(false);
    try {
      await api.setMyAvailability(newWindows.map((w) => ({ day_of_week: w.dayOfWeek, start_time: w.start, end_time: w.end })));
      setSavedMsg(true);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSlotMinutes() {
    setSaving(true);
    try {
      await api.setTeleconsultSlotMinutes(slotMinutes);
      setSavedMsg(true);
    } finally {
      setSaving(false);
    }
  }

  if (!windows) return null;

  return (
    <div style={{ maxWidth: 480 }}>
      <Link to="/doctor" style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
        ← {t('myDashboard')}
      </Link>

      <h1 style={{ fontSize: 24, marginBottom: 8 }}>{t('myAvailability')}</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>{t('availabilityIntro')}</p>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 18, marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>{t('slotLength')}</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="number"
            min={5}
            max={60}
            step={5}
            value={slotMinutes}
            onChange={(e) => setSlotMinutes(Number(e.target.value))}
            style={{ width: 80, padding: '9px 10px', fontSize: 14, border: '1.5px solid var(--line)', borderRadius: 6 }}
          />
          <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t('minutes')}</span>
          <button
            onClick={handleSaveSlotMinutes}
            disabled={saving}
            style={{ padding: '9px 16px', fontSize: 13, fontWeight: 700, color: 'var(--white)', background: 'var(--teal)', border: 'none', borderRadius: 6, opacity: saving ? 0.6 : 1 }}
          >
            {t('save')}
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 18 }}>
        <WeeklyScheduleEditor initialWindows={windows} onSave={handleSaveWindows} saving={saving} />
      </div>

      {savedMsg && <p style={{ fontSize: 13, color: 'var(--success)', marginTop: 12, fontWeight: 600 }}>{t('savedSuccessfully')}</p>}
    </div>
  );
}

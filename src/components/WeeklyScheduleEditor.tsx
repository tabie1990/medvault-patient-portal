import { useState, useEffect } from 'react';
import { useLang } from '../lib/i18n';

const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

interface DayRow {
  enabled: boolean;
  start: string;
  end: string;
}

export interface WeeklyWindow {
  dayOfWeek: number;
  start: string;
  end: string;
}

/**
 * One row per day of the week, each with an on/off toggle and a single
 * start/end time — deliberately one window per day, not multiple. Real
 * requests so far have all been simple "Mon-Sat 8-20:00" style hours;
 * split shifts (e.g. a lunch closure) can be a fast-follow if actually
 * needed later, not built speculatively now.
 */
export function WeeklyScheduleEditor({
  initialWindows,
  onSave,
  saving
}: {
  initialWindows: WeeklyWindow[];
  onSave: (windows: WeeklyWindow[]) => void;
  saving: boolean;
}) {
  const { t, lang } = useLang();
  const dayNames = lang === 'fr' ? DAY_NAMES_FR : DAY_NAMES_EN;

  const [rows, setRows] = useState<DayRow[]>(() => {
    const base: DayRow[] = Array.from({ length: 7 }, () => ({ enabled: false, start: '08:00', end: '17:00' }));
    for (const w of initialWindows) {
      base[w.dayOfWeek] = { enabled: true, start: w.start, end: w.end };
    }
    return base;
  });

  useEffect(() => {
    const base: DayRow[] = Array.from({ length: 7 }, () => ({ enabled: false, start: '08:00', end: '17:00' }));
    for (const w of initialWindows) {
      base[w.dayOfWeek] = { enabled: true, start: w.start, end: w.end };
    }
    setRows(base);
  }, [initialWindows]);

  function updateRow(day: number, patch: Partial<DayRow>) {
    setRows((prev) => prev.map((r, i) => (i === day ? { ...r, ...patch } : r)));
  }

  function applyToAll() {
    const first = rows.findIndex((r) => r.enabled);
    if (first === -1) return;
    const { start, end } = rows[first];
    setRows((prev) => prev.map((r) => (r.enabled ? { ...r, start, end } : r)));
  }

  function handleSave() {
    const windows = rows
      .map((r, day) => ({ dayOfWeek: day, start: r.start, end: r.end, enabled: r.enabled }))
      .filter((r) => r.enabled)
      .map(({ dayOfWeek, start, end }) => ({ dayOfWeek, start, end }));
    onSave(windows);
  }

  return (
    <div>
      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((row, day) => (
          <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, width: 100, flexShrink: 0, fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" checked={row.enabled} onChange={(e) => updateRow(day, { enabled: e.target.checked })} />
              {dayNames[day].slice(0, 3)}
            </label>
            <input
              type="time"
              value={row.start}
              disabled={!row.enabled}
              onChange={(e) => updateRow(day, { start: e.target.value })}
              style={{ ...timeInputStyle, opacity: row.enabled ? 1 : 0.4 }}
            />
            <span style={{ color: 'var(--ink-soft)', fontSize: 13 }}>–</span>
            <input
              type="time"
              value={row.end}
              disabled={!row.enabled}
              onChange={(e) => updateRow(day, { end: e.target.value })}
              style={{ ...timeInputStyle, opacity: row.enabled ? 1 : 0.4 }}
            />
          </div>
        ))}
      </div>

      <button onClick={applyToAll} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 13, fontWeight: 600, marginTop: 12, padding: 0 }}>
        {t('applySameHoursToAllDays')}
      </button>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          display: 'block',
          marginTop: 14,
          padding: '11px 18px',
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--white)',
          background: 'var(--navy)',
          border: 'none',
          borderRadius: 8,
          opacity: saving ? 0.6 : 1
        }}
      >
        {saving ? t('sending') : t('save')}
      </button>
    </div>
  );
}

const timeInputStyle = {
  padding: '8px 10px',
  fontSize: 13,
  border: '1.5px solid var(--line)',
  borderRadius: 6,
  width: 100
};

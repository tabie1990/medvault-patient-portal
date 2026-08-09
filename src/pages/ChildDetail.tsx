import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import * as api from '../lib/api';

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  administered: { bg: '#E4F3EA', fg: 'var(--success)' },
  overdue: { bg: '#FBEAE8', fg: 'var(--danger)' },
  due: { bg: '#F3F1EC', fg: 'var(--ink-soft)' },
  parent_reported: { bg: '#FFF4CC', fg: '#8A6D00' },
  proof_submitted: { bg: '#FFF4CC', fg: '#8A6D00' },
  skipped: { bg: '#F3F1EC', fg: 'var(--ink-soft)' }
};

export function ChildDetail() {
  const { t } = useLang();
  const { role } = useAuth();
  const { childId } = useParams();
  const isDoctor = role === 'doctor';
  const [record, setRecord] = useState<api.ChildFullRecord | null>(null);

  async function load() {
    if (!childId) return;
    const res = await api.getChildFullRecord(childId);
    setRecord(res);
  }

  useEffect(() => {
    load();
  }, [childId]);

  if (!record) return null;

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>{record.child.fullName}</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 20 }}>
        {record.child.globalPatientId} · {new Date(record.child.dob).toLocaleDateString('en-GB')}
        {record.child.sex ? ` · ${record.child.sex}` : ''}
      </p>

      <Section title={t('guardians')}>
        {record.guardians.map((g) => (
          <div key={g.guardianPatientId} style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
            {g.guardianPatientId} — {g.relationship}
          </div>
        ))}
      </Section>

      <VaccinationsSection record={record} isDoctor={isDoctor} onChange={load} t={t} />
      <GrowthSection record={record} isDoctor={isDoctor} childId={childId!} onChange={load} t={t} />
      <NeonatalSection record={record} isDoctor={isDoctor} childId={childId!} onChange={load} t={t} />
      <MilestonesSection record={record} isDoctor={isDoctor} childId={childId!} onChange={load} t={t} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 18, marginBottom: 14 }}>
      <h2 style={{ fontSize: 15, color: 'var(--navy)', marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}

function VaccinationsSection({ record, isDoctor, onChange, t }: { record: api.ChildFullRecord; isDoctor: boolean; onChange: () => void; t: (k: any) => string }) {
  const [administeringId, setAdministeringId] = useState<string | null>(null);
  const [batchNumber, setBatchNumber] = useState('');
  const [administeredBy, setAdministeredBy] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdminister(id: string) {
    setSaving(true);
    try {
      await api.administerVaccination(id, { batch_number: batchNumber || undefined, administered_by: administeredBy || undefined });
      setAdministeringId(null);
      setBatchNumber('');
      setAdministeredBy('');
      onChange();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title={t('vaccinations')}>
      <div style={{ display: 'grid', gap: 8 }}>
        {record.vaccinations.map((v) => {
          const colors = STATUS_COLORS[v.status] ?? STATUS_COLORS.due;
          return (
            <div key={v.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14 }}>{v.scheduleItem.vaccineName}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: colors.bg, color: colors.fg, textTransform: 'uppercase' }}>
                  {v.status.replace('_', ' ')}
                </span>
              </div>
              {isDoctor && v.status !== 'administered' && (
                <div style={{ marginTop: 6 }}>
                  {administeringId === v.id ? (
                    <div style={{ display: 'grid', gap: 6 }}>
                      <input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder={t('batchNumber')} style={smallInput} />
                      <input value={administeredBy} onChange={(e) => setAdministeredBy(e.target.value)} placeholder={t('administeredBy')} style={smallInput} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleAdminister(v.id)} disabled={saving} style={smallPrimaryBtn}>{t('save')}</button>
                        <button onClick={() => setAdministeringId(null)} style={smallGhostBtn}>{t('cancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAdministeringId(v.id)} style={smallGhostBtn}>{t('markAdministered')}</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function GrowthSection({ record, isDoctor, childId, onChange, t }: { record: api.ChildFullRecord; isDoctor: boolean; childId: string; onChange: () => void; t: (k: any) => string }) {
  const [showForm, setShowForm] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCm, setHeadCm] = useState('');
  const [muacCm, setMuacCm] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api.recordGrowthMeasurement(childId, {
        weight_kg: weightKg ? Number(weightKg) : undefined,
        height_cm: heightCm ? Number(heightCm) : undefined,
        head_circumference_cm: headCm ? Number(headCm) : undefined,
        muac_cm: muacCm ? Number(muacCm) : undefined
      });
      setWeightKg('');
      setHeightCm('');
      setHeadCm('');
      setMuacCm('');
      setShowForm(false);
      onChange();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title={t('growthMeasurements')}>
      {record.growth_measurements.length === 0 && <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t('noneRecordedYet')}</p>}
      {record.growth_measurements.map((m) => (
        <div key={m.id} style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 6 }}>
          {new Date(m.measuredAt).toLocaleDateString('en-GB')} — {m.weightKg ? `${m.weightKg}kg ` : ''}
          {m.heightCm ? `${m.heightCm}cm ` : ''}
          {m.headCircumferenceCm ? `HC:${m.headCircumferenceCm}cm ` : ''}
          {m.muacCm ? `MUAC:${m.muacCm}cm` : ''}
        </div>
      ))}
      {isDoctor && (
        <>
          {showForm ? (
            <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
              <input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder={t('weightKg')} style={smallInput} />
              <input value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder={t('heightCm')} style={smallInput} />
              <input value={headCm} onChange={(e) => setHeadCm(e.target.value)} placeholder={t('headCircumferenceCm')} style={smallInput} />
              <input value={muacCm} onChange={(e) => setMuacCm(e.target.value)} placeholder={t('muacCm')} style={smallInput} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleSave} disabled={saving} style={smallPrimaryBtn}>{t('save')}</button>
                <button onClick={() => setShowForm(false)} style={smallGhostBtn}>{t('cancel')}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} style={{ ...smallGhostBtn, marginTop: 8 }}>{`+ ${t('addMeasurement')}`}</button>
          )}
        </>
      )}
    </Section>
  );
}

function NeonatalSection({ record, isDoctor, childId, onChange, t }: { record: api.ChildFullRecord; isDoctor: boolean; childId: string; onChange: () => void; t: (k: any) => string }) {
  const [showForm, setShowForm] = useState(false);
  const [birthWeightKg, setBirthWeightKg] = useState('');
  const [modeOfDelivery, setModeOfDelivery] = useState('');
  const [gestationalAgeWeeks, setGestationalAgeWeeks] = useState('');
  const [vitaminK, setVitaminK] = useState(false);
  const [hepB, setHepB] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api.setNeonatalRecord(childId, {
        birth_weight_kg: birthWeightKg ? Number(birthWeightKg) : undefined,
        mode_of_delivery: modeOfDelivery || undefined,
        gestational_age_weeks: gestationalAgeWeeks ? Number(gestationalAgeWeeks) : undefined,
        vitamin_k_given: vitaminK,
        hep_b_birth_dose_given: hepB
      });
      setShowForm(false);
      onChange();
    } finally {
      setSaving(false);
    }
  }

  const n = record.neonatal_record;

  return (
    <Section title={t('neonatalRecord')}>
      {n ? (
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          {n.birthWeightKg && <div>{t('weightKg')}: {n.birthWeightKg}kg</div>}
          {n.modeOfDelivery && <div>{t('modeOfDelivery')}: {n.modeOfDelivery}</div>}
          {n.gestationalAgeWeeks && <div>{t('gestationalAgeWeeks')}: {n.gestationalAgeWeeks}</div>}
          <div>{t('vitaminKGiven')}: {n.vitaminKGiven ? '✅' : '—'}</div>
          <div>{t('hepBBirthDose')}: {n.hepBBirthDoseGiven ? '✅' : '—'}</div>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t('noneRecordedYet')}</p>
      )}
      {isDoctor && (
        <>
          {showForm ? (
            <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
              <input value={birthWeightKg} onChange={(e) => setBirthWeightKg(e.target.value)} placeholder={t('weightKg')} style={smallInput} />
              <input value={modeOfDelivery} onChange={(e) => setModeOfDelivery(e.target.value)} placeholder={t('modeOfDelivery')} style={smallInput} />
              <input value={gestationalAgeWeeks} onChange={(e) => setGestationalAgeWeeks(e.target.value)} placeholder={t('gestationalAgeWeeks')} style={smallInput} />
              <label style={{ fontSize: 13 }}>
                <input type="checkbox" checked={vitaminK} onChange={(e) => setVitaminK(e.target.checked)} /> {t('vitaminKGiven')}
              </label>
              <label style={{ fontSize: 13 }}>
                <input type="checkbox" checked={hepB} onChange={(e) => setHepB(e.target.checked)} /> {t('hepBBirthDose')}
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleSave} disabled={saving} style={smallPrimaryBtn}>{t('save')}</button>
                <button onClick={() => setShowForm(false)} style={smallGhostBtn}>{t('cancel')}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} style={{ ...smallGhostBtn, marginTop: 8 }}>{n ? t('editNeonatalRecord') : `+ ${t('addNeonatalRecord')}`}</button>
          )}
        </>
      )}
    </Section>
  );
}

function MilestonesSection({ record, isDoctor, childId, onChange, t }: { record: api.ChildFullRecord; isDoctor: boolean; childId: string; onChange: () => void; t: (k: any) => string }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [concern, setConcern] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name) return;
    setSaving(true);
    try {
      await api.recordMilestone(childId, {
        milestone_name: name,
        age_at_assessment_months: ageMonths ? Number(ageMonths) : undefined,
        concern_flagged: concern
      });
      setName('');
      setAgeMonths('');
      setConcern(false);
      setShowForm(false);
      onChange();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title={t('milestones')}>
      {record.milestones.length === 0 && <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t('noneRecordedYet')}</p>}
      {record.milestones.map((m) => (
        <div key={m.id} style={{ fontSize: 13, color: m.concernFlagged ? 'var(--danger)' : 'var(--ink-soft)', marginBottom: 4 }}>
          {m.milestoneName}{m.ageAtAssessmentMonths ? ` (${m.ageAtAssessmentMonths}mo)` : ''}{m.concernFlagged ? ` ⚠️ ${t('concernFlagged')}` : ''}
        </div>
      ))}
      {isDoctor && (
        <>
          {showForm ? (
            <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('milestoneName')} style={smallInput} />
              <input value={ageMonths} onChange={(e) => setAgeMonths(e.target.value)} placeholder={t('ageAtAssessmentMonths')} style={smallInput} />
              <label style={{ fontSize: 13 }}>
                <input type="checkbox" checked={concern} onChange={(e) => setConcern(e.target.checked)} /> {t('concernFlagged')}
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleSave} disabled={saving || !name} style={smallPrimaryBtn}>{t('save')}</button>
                <button onClick={() => setShowForm(false)} style={smallGhostBtn}>{t('cancel')}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} style={{ ...smallGhostBtn, marginTop: 8 }}>{`+ ${t('addMilestone')}`}</button>
          )}
        </>
      )}
    </Section>
  );
}

const smallInput = { padding: '8px 10px', fontSize: 13, border: '1.5px solid var(--line)', borderRadius: 6, boxSizing: 'border-box' as const };
const smallPrimaryBtn = { padding: '7px 14px', fontSize: 12, fontWeight: 700, color: 'var(--white)', background: 'var(--teal)', border: 'none', borderRadius: 6 };
const smallGhostBtn = { padding: '7px 14px', fontSize: 12, fontWeight: 700, color: 'var(--navy)', background: 'none', border: '1.5px solid var(--line)', borderRadius: 6 };

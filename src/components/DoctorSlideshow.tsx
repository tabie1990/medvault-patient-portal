import { useEffect, useState, type CSSProperties } from 'react';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';
import { FEATURED_DOCTORS } from '../lib/featuredDoctors';

// Fixed to the empty side gutters that open up beside the centered content
// on wide screens — per the reference screenshot, "both ends" meant left
// and right, not top and bottom. Hidden below the width where those
// gutters actually exist (see the media query in index.css) so it never
// overlaps real content on laptop-and-narrower viewports.
//
// Same live-API-with-fallback pattern as the homepage doctor cards, driven
// by the shared featuredDoctors.ts list: add a doctor there and they show
// up here automatically, and real verified backend doctors take over
// automatically the moment GET /doctors/browse returns any.
export function DoctorSlideshow() {
  const { lang } = useLang();
  const [liveDoctors, setLiveDoctors] = useState<api.Doctor[] | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    api
      .listDoctors()
      .then((res) => setLiveDoctors(res.doctors))
      .catch(() => setLiveDoctors([]));
  }, []);

  const slides =
    liveDoctors && liveDoctors.length > 0
      ? liveDoctors.map((d) => ({ id: d.id, fullName: d.fullName, specialty: d.specialty ?? '', photo: d.photoUrl }))
      : FEATURED_DOCTORS.map((d) => ({ id: d.id, fullName: d.fullName, specialty: d.specialty[lang], photo: d.photo as string | null }));

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  if (!liveDoctors || slides.length === 0) return null;

  const current = slides[index % slides.length];

  return (
    <>
      <SidePanel side="left" doctor={current} />
      <SidePanel side="right" doctor={current} />
    </>
  );
}

function SidePanel({ side, doctor }: { side: 'left' | 'right'; doctor: { id: string; fullName: string; specialty: string; photo: string | null } }) {
  const { t } = useLang();
  const style: CSSProperties = {
    position: 'fixed',
    top: '50%',
    [side]: 24,
    transform: 'translateY(-50%)',
    width: 168,
    zIndex: 5
  };
  return (
    <div className="doctor-side-panel" style={style}>
      <div key={doctor.id} className="doctor-slide-fade" style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '16px 14px', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', letterSpacing: 0.3, marginBottom: 10, textTransform: 'uppercase' }}>
          {t('meetOurDoctorsHeadline')}
        </div>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'var(--teal-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px'
          }}
        >
          {doctor.photo ? (
            <img src={doctor.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />
          ) : (
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--teal)' }}>{doctor.fullName.trim().charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.3 }}>{doctor.fullName}</div>
        {doctor.specialty && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{doctor.specialty}</div>}
      </div>
    </div>
  );
}

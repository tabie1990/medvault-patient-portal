// Real doctors, shown wherever GET /doctors/browse has no verified
// accounts yet on this environment — a stopgap for a genuinely empty
// backend list, not fabricated content. Shared between the homepage
// "Meet our doctors" section and the site-wide DoctorSlideshow so both
// stay in sync from one place. To add a doctor here: drop their photo
// under public/doctors/ and add one entry — they'll show up in both
// places automatically, no other code changes needed. Once real
// verified doctors exist in the backend, live API data takes over
// automatically wherever this is used as a fallback.
export const FEATURED_DOCTORS = [
  {
    id: 'featured-charles-obam-assam',
    fullName: 'Dr Charles Amel Obam Assam',
    specialty: { en: 'General Practice', fr: 'Médecine générale' },
    photo: '/doctors/charles-obam-assam.jpeg'
  },
  {
    id: 'featured-georges-mouen-mbangue',
    fullName: 'Dr Georges Mouen Mbangue',
    specialty: { en: 'Ophthalmology', fr: 'Ophtalmologie' },
    photo: '/doctors/georges-mouen-mbangue.jpeg'
  }
] as const;

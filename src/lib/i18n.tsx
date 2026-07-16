import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type Lang = 'en' | 'fr';

const STRINGS = {
  appName: { en: 'MedVAULT', fr: 'MedVAULT' },
  tagline: { en: 'Health in Harmony', fr: 'La santé en harmonie' },
  phoneLabel: { en: 'Phone number', fr: 'Numéro de téléphone' },
  phonePlaceholder: { en: '237 6XX XXX XXX', fr: '237 6XX XXX XXX' },
  sendCode: { en: 'Send verification code', fr: 'Envoyer le code de vérification' },
  sending: { en: 'Sending…', fr: 'Envoi…' },
  codeLabel: { en: 'Verification code', fr: 'Code de vérification' },
  codeSentTo: { en: 'We sent a code to', fr: 'Nous avons envoyé un code au' },
  verify: { en: 'Verify & continue', fr: 'Vérifier et continuer' },
  verifying: { en: 'Verifying…', fr: 'Vérification…' },
  changeNumber: { en: 'Use a different number', fr: 'Utiliser un autre numéro' },
  loginIntro: { en: "Enter your phone number and we'll send you a one-time code.", fr: 'Entrez votre numéro et nous vous enverrons un code à usage unique.' },
  findADoctor: { en: 'Find a doctor', fr: 'Trouver un médecin' },
  searchSpecialty: { en: 'Search by specialty', fr: 'Rechercher par spécialité' },
  searchName: { en: 'Or search by name', fr: 'Ou rechercher par nom' },
  search: { en: 'Search', fr: 'Rechercher' },
  noDoctorsFound: { en: 'No doctors found. Try a different search.', fr: 'Aucun médecin trouvé. Essayez une autre recherche.' },
  perConsult: { en: 'per teleconsult', fr: 'par téléconsultation' },
  viewAvailability: { en: 'View availability', fr: 'Voir les disponibilités' },
  myAppointments: { en: 'My appointments', fr: 'Mes rendez-vous' },
  logOut: { en: 'Log out', fr: 'Se déconnecter' },
  selectADate: { en: 'Select a date', fr: 'Choisir une date' },
  selectATime: { en: 'Select a time', fr: 'Choisir une heure' },
  noSlotsThisDay: { en: 'No open slots this day', fr: 'Aucun créneau disponible ce jour' },
  bookThisSlot: { en: 'Book this slot', fr: 'Réserver ce créneau' },
  booking: { en: 'Booking…', fr: 'Réservation…' },
  bookingConfirmed: { en: 'Appointment booked', fr: 'Rendez-vous confirmé' },
  payNow: { en: 'Pay now with Mobile Money', fr: 'Payer maintenant avec Mobile Money' },
  momoNumber: { en: 'Mobile Money number', fr: 'Numéro Mobile Money' },
  requestPayment: { en: 'Request payment', fr: 'Demander le paiement' },
  requestingPayment: { en: 'Sending payment request…', fr: 'Envoi de la demande de paiement…' },
  checkUssdPrompt: { en: 'Check your phone for a Mobile Money prompt and confirm.', fr: 'Vérifiez votre téléphone pour une invite Mobile Money et confirmez.' },
  paymentStatus: { en: 'Payment status', fr: 'Statut du paiement' },
  refreshStatus: { en: 'Refresh status', fr: 'Actualiser le statut' },
  paid: { en: 'Paid', fr: 'Payé' },
  pending: { en: 'Pending', fr: 'En attente' },
  unpaid: { en: 'Unpaid', fr: 'Non payé' },
  backToDoctors: { en: 'Back to doctors', fr: 'Retour aux médecins' },
  noAppointmentsYet: { en: "You don't have any appointments yet.", fr: "Vous n'avez pas encore de rendez-vous." },
  teleconsult: { en: 'Teleconsult', fr: 'Téléconsultation' },
  somethingWentWrong: { en: 'Something went wrong. Please try again.', fr: "Une erreur s'est produite. Veuillez réessayer." },
  invalidCode: { en: 'That code is incorrect or has expired.', fr: 'Ce code est incorrect ou a expiré.' }
} as const;

export type StringKey = keyof typeof STRINGS;

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('mv_lang') as Lang) || 'en');

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('mv_lang', l);
  }, []);

  const t = useCallback((key: StringKey) => STRINGS[key][lang], [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}

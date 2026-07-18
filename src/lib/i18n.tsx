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
  invalidCode: { en: 'That code is incorrect or has expired.', fr: 'Ce code est incorrect ou a expiré.' },
  staffLoginTitle: { en: 'Doctor / staff login', fr: 'Connexion médecin / personnel' },
  staffLoginIntro: { en: 'Sign in with the email or phone and password you were given.', fr: 'Connectez-vous avec l\u2019email ou le téléphone et le mot de passe qui vous ont été fournis.' },
  emailOrPhone: { en: 'Email or phone', fr: 'Email ou téléphone' },
  password: { en: 'Password', fr: 'Mot de passe' },
  logIn: { en: 'Log in', fr: 'Se connecter' },
  myDashboard: { en: 'My dashboard', fr: 'Mon tableau de bord' },
  upcomingAppointments: { en: 'Upcoming appointments', fr: 'Rendez-vous à venir' },
  noUpcomingAppointments: { en: 'No upcoming appointments.', fr: 'Aucun rendez-vous à venir.' },
  startSession: { en: 'Start session', fr: 'Démarrer la session' },
  startingSession: { en: 'Starting…', fr: 'Démarrage…' },
  joinCall: { en: 'Join call', fr: 'Rejoindre l\u2019appel' },
  waitingForPayment: { en: 'Waiting for patient payment', fr: 'En attente du paiement du patient' },
  heroHeadline: { en: 'Real doctors. Real clinics. One connected system.', fr: 'De vrais médecins. De vraies cliniques. Un seul système connecté.' },
  heroSubhead: {
    en: 'MedVAULT links hospitals, independent doctors, and mobile labs across Cameroon — the same software running the clinic floor also books your teleconsult and takes your payment.',
    fr: 'MedVAULT relie hôpitaux, médecins indépendants et laboratoires mobiles à travers le Cameroun — le même logiciel qui fait tourner la clinique gère aussi votre téléconsultation et votre paiement.'
  },
  findADoctorCta: { en: 'Find a doctor', fr: 'Trouver un médecin' },
  forProvidersCta: { en: 'For healthcare providers', fr: 'Pour les professionnels de santé' },
  builtForClinics: { en: 'Built for real clinics, not a demo', fr: 'Conçu pour de vraies cliniques, pas une démo' },
  builtForClinicsSub: {
    en: 'This is the actual software running hospital front desks and consultation rooms today.',
    fr: "C'est le logiciel qui fait tourner aujourd'hui l'accueil et les salles de consultation des hôpitaux."
  },
  servicesHeadline: { en: 'What you can do on MedVAULT', fr: 'Ce que vous pouvez faire sur MedVAULT' },
  serviceTeleconsult: { en: 'Teleconsultation', fr: 'Téléconsultation' },
  serviceTeleconsultDesc: { en: 'Book and pay for a video consultation with a real, verified doctor.', fr: 'Réservez et payez une consultation vidéo avec un médecin réel et vérifié.' },
  serviceLab: { en: 'Lab tests', fr: 'Analyses de laboratoire' },
  serviceLabDesc: { en: 'Order tests for a home visit or at a partner lab, and pay by Mobile Money.', fr: 'Commandez des analyses à domicile ou en laboratoire partenaire, payez par Mobile Money.' },
  serviceWhatsapp: { en: 'WhatsApp booking', fr: 'Réservation WhatsApp' },
  serviceWhatsappDesc: { en: 'Book entirely by chatting — no app to download.', fr: 'Réservez entièrement par chat — aucune application à télécharger.' },
  serviceRecords: { en: 'Your health, connected', fr: 'Votre santé, connectée' },
  serviceRecordsDesc: { en: 'One patient record follows you across hospitals and independent doctors.', fr: 'Un seul dossier patient vous suit entre hôpitaux et médecins indépendants.' },
  partnersHeadline: { en: 'Trusted by clinics and labs across Cameroon', fr: 'Approuvé par des cliniques et laboratoires partout au Cameroun' },
  tipsHeadline: { en: 'Health tips', fr: 'Conseils santé' },
  tip1Title: { en: 'Know the signs of malaria early', fr: 'Reconnaître tôt les signes du paludisme' },
  tip1Body: { en: 'Fever, chills, and headache that come and go can be early malaria — testing early makes treatment far more effective.', fr: 'Fièvre, frissons et maux de tête intermittents peuvent signaler un paludisme précoce — un dépistage rapide rend le traitement bien plus efficace.' },
  tip2Title: { en: 'Managing blood pressure day to day', fr: 'Gérer sa tension artérielle au quotidien' },
  tip2Body: { en: 'Regular check-ins, less salt, and consistent medication timing matter more than any single reading.', fr: "Des contrôles réguliers, moins de sel et une prise de médicaments régulière comptent plus qu'une seule mesure." },
  tip3Title: { en: 'When a fever needs a doctor, not just rest', fr: "Quand une fièvre nécessite un médecin, pas seulement du repos" },
  tip3Body: { en: 'A fever above 39°C, lasting more than two days, or with a rash or stiff neck warrants a consultation.', fr: 'Une fièvre supérieure à 39°C, qui dure plus de deux jours, ou accompagnée d\u2019éruption ou de raideur de la nuque justifie une consultation.' },
  loginSignup: { en: 'Login / Sign up', fr: 'Connexion / Inscription' },
  imAPatient: { en: "I'm a patient", fr: 'Je suis patient(e)' },
  imADoctor: { en: "I'm a doctor", fr: 'Je suis médecin' },
  imALabStaff: { en: 'I work at a lab', fr: "Je travaille dans un laboratoire" },
  doctorRegisterTitle: { en: 'Register as a doctor', fr: 'Inscription médecin' },
  doctorRegisterIntro: {
    en: "We'll email you a temporary password to sign in with.",
    fr: 'Nous vous enverrons par email un mot de passe temporaire pour vous connecter.'
  },
  fullName: { en: 'Full name', fr: 'Nom complet' },
  emailLabel: { en: 'Email', fr: 'Email' },
  phoneOptional: { en: 'Phone (optional)', fr: 'Téléphone (facultatif)' },
  register: { en: 'Register', fr: "S'inscrire" },
  alreadyHaveAccount: { en: 'Already have an account? Log in', fr: 'Vous avez déjà un compte ? Se connecter' },
  registrationSent: { en: 'Check your email', fr: 'Vérifiez votre email' },
  registrationSentBody: {
    en: "We've sent a temporary password to your email. Use it to log in, then you'll be asked to set your own password.",
    fr: 'Nous avons envoyé un mot de passe temporaire à votre email. Utilisez-le pour vous connecter, puis vous pourrez définir votre propre mot de passe.'
  },
  accountAlreadyExists: { en: 'An account with this email or phone already exists.', fr: 'Un compte avec cet email ou ce téléphone existe déjà.' },
  dontHaveAccount: { en: "Don't have an account?", fr: "Vous n'avez pas de compte ?" },
  registerAsDoctor: { en: 'Register as a doctor', fr: 'S\u2019inscrire comme médecin' },
  labOrders: { en: 'Lab orders', fr: 'Analyses de laboratoire' },
  noLabOrdersYet: { en: 'No lab orders yet.', fr: 'Aucune analyse pour le moment.' },
  status: { en: 'Status', fr: 'Statut' },
  forgotPasswordLink: { en: 'Forgot password?', fr: 'Mot de passe oublié ?' },
  forgotPasswordTitle: { en: 'Reset your password', fr: 'Réinitialiser votre mot de passe' },
  forgotPasswordIntro: {
    en: "Enter the email or phone on your account and we'll send you a reset code.",
    fr: "Entrez l'email ou le téléphone de votre compte et nous vous enverrons un code de réinitialisation."
  },
  resetPasswordIntro: {
    en: 'Enter the code we sent, along with your new password.',
    fr: 'Entrez le code envoyé, ainsi que votre nouveau mot de passe.'
  },
  newPassword: { en: 'New password', fr: 'Nouveau mot de passe' },
  resetPasswordCta: { en: 'Reset password', fr: 'Réinitialiser le mot de passe' },
  backToLogin: { en: 'Back to login', fr: 'Retour à la connexion' },
  kycTitle: { en: 'Verify your identity', fr: 'Vérifiez votre identité' },
  kycIntro: {
    en: 'Upload these three documents so we can verify your account. A staff member reviews every submission manually.',
    fr: 'Téléchargez ces trois documents pour que nous puissions vérifier votre compte. Chaque soumission est examinée manuellement.'
  },
  nationalId: { en: 'National ID', fr: "Carte d'identité nationale" },
  medicalLicense: { en: 'Medical license', fr: 'Licence médicale' },
  selfiePhoto: { en: 'A selfie photo', fr: 'Une photo selfie' },
  chooseFile: { en: 'Choose file', fr: 'Choisir un fichier' },
  uploading: { en: 'Uploading…', fr: 'Téléchargement…' },
  uploadFailed: { en: 'That upload failed — please try again.', fr: 'Le téléchargement a échoué — veuillez réessayer.' },
  submitKyc: { en: 'Submit for review', fr: 'Soumettre pour examen' },
  kycSubmitted: { en: 'Submitted for review', fr: 'Soumis pour examen' },
  kycSubmittedBody: {
    en: "We've received your documents. A staff member will review them, usually within a couple of days.",
    fr: 'Nous avons reçu vos documents. Un membre du personnel les examinera, généralement sous quelques jours.'
  },
  completeYourVerification: { en: 'Complete your verification', fr: 'Complétez votre vérification' },
  completeYourVerificationBody: {
    en: 'Upload your documents so patients can book and pay for teleconsults with you.',
    fr: 'Téléchargez vos documents pour que les patients puissent réserver et payer des téléconsultations avec vous.'
  },
  myLabs: { en: 'My labs', fr: 'Mes laboratoires' },
  noLabsYet: { en: "You haven't registered a lab yet.", fr: "Vous n'avez pas encore enregistré de laboratoire." },
  registerALab: { en: 'Register a lab', fr: 'Enregistrer un laboratoire' },
  labName: { en: 'Lab name', fr: 'Nom du laboratoire' },
  city: { en: 'City', fr: 'Ville' },
  serviceTypeOnSite: { en: 'On-site (patients come to us)', fr: 'Sur place (les patients viennent)' },
  serviceType: { en: 'Service type', fr: 'Type de service' },
  serviceTypeHome: { en: 'Home visits', fr: 'Visites à domicile' },
  serviceTypeBoth: { en: 'Both', fr: 'Les deux' },
  manage: { en: 'Manage', fr: 'Gérer' },
  labServices: { en: 'Services offered', fr: 'Services offerts' },
  noServicesYet: { en: 'No services added yet.', fr: 'Aucun service ajouté pour le moment.' },
  addAService: { en: 'Add a service', fr: 'Ajouter un service' },
  testNamePlaceholder: { en: 'Test name (e.g. Full Blood Count)', fr: 'Nom du test (ex. Numération sanguine)' },
  priceInFcfa: { en: 'Price (FCFA)', fr: 'Prix (FCFA)' },
  add: { en: 'Add', fr: 'Ajouter' },
  payoutDetails: { en: 'Payout details', fr: 'Détails de paiement' },
  momoNumberLabel: { en: 'Mobile Money number', fr: 'Numéro Mobile Money' },
  save: { en: 'Save', fr: 'Enregistrer' },
  labStaffTitle: { en: 'Staff', fr: 'Personnel' },
  noStaffYet: { en: 'No staff added yet.', fr: 'Aucun membre du personnel ajouté.' },
  addStaff: { en: 'Add staff', fr: 'Ajouter un membre' },
  staffAdded: { en: 'Staff account created — they\u2019ll receive their login details by email.', fr: 'Compte créé — la personne recevra ses identifiants par email.' },
  verifyThisLab: { en: 'Verify this lab', fr: 'Vérifier ce laboratoire' },
  businessRegNumber: { en: 'Business registration number', fr: "Numéro d'enregistrement de l'entreprise" },
  businessRegDoc: { en: 'Business registration document', fr: "Document d'enregistrement de l'entreprise" },
  labAccreditationDoc: { en: 'Lab accreditation (optional)', fr: 'Accréditation du laboratoire (facultatif)' },
  ownerIdDoc: { en: 'Owner\u2019s national ID', fr: "Carte d'identité du propriétaire" },
  backToLabs: { en: '\u2190 Back to my labs', fr: '\u2190 Retour à mes laboratoires' },
  kycReviewQueue: { en: 'KYC review queue', fr: 'File d\u2019attente de vérification' },
  noPendingReviews: { en: 'Nothing waiting for review.', fr: 'Rien en attente de vérification.' },
  pendingDoctors: { en: 'Doctors', fr: 'Médecins' },
  pendingLabs: { en: 'Labs', fr: 'Laboratoires' },
  viewDocument: { en: 'View', fr: 'Voir' },
  nationalIdDoc: { en: 'National ID', fr: "Carte d'identité" },
  medicalLicenseDoc: { en: 'Medical license', fr: 'Licence médicale' },
  selfieDoc: { en: 'Selfie', fr: 'Selfie' },
  approve: { en: 'Approve', fr: 'Approuver' },
  reject: { en: 'Reject', fr: 'Rejeter' },
  rejectionReason: { en: 'Reason for rejection', fr: 'Motif du rejet' },
  confirmReject: { en: 'Confirm rejection', fr: 'Confirmer le rejet' },
  cancel: { en: 'Cancel', fr: 'Annuler' },
  applySameHoursToAllDays: { en: 'Apply same hours to all checked days', fr: 'Appliquer les mêmes horaires à tous les jours cochés' },
  myAvailability: { en: 'My availability', fr: 'Mes disponibilités' },
  availabilityIntro: {
    en: 'Set the days and hours you\u2019re available for teleconsults. Patients will only be able to book real, open slots within these hours.',
    fr: 'Définissez les jours et heures où vous êtes disponible pour des téléconsultations. Les patients ne pourront réserver que des créneaux réellement libres dans ces horaires.'
  },
  slotLength: { en: 'Appointment length', fr: 'Durée du rendez-vous' },
  minutes: { en: 'minutes', fr: 'minutes' },
  savedSuccessfully: { en: 'Saved.', fr: 'Enregistré.' },
  workingHours: { en: 'Working hours', fr: 'Heures d\u2019ouverture' },
  workingHoursIntro: {
    en: 'Set the days and hours this lab is open.',
    fr: 'Définissez les jours et heures d\u2019ouverture de ce laboratoire.'
  },
  mustChangePasswordTitle: { en: 'Set a new password', fr: 'Définir un nouveau mot de passe' },
  mustChangePasswordIntro: {
    en: 'For security, you need to set your own password before continuing — the one you logged in with was temporary.',
    fr: 'Pour des raisons de sécurité, vous devez définir votre propre mot de passe avant de continuer — celui utilisé pour la connexion était temporaire.'
  },
  confirmNewPassword: { en: 'Confirm new password', fr: 'Confirmer le nouveau mot de passe' },
  passwordsDontMatch: { en: "Passwords don't match.", fr: 'Les mots de passe ne correspondent pas.' },
  passwordTooShort: { en: 'Password must be at least 8 characters.', fr: 'Le mot de passe doit contenir au moins 8 caractères.' },
  setPasswordCta: { en: 'Set password and continue', fr: 'Définir le mot de passe et continuer' },
  myProfile: { en: 'My profile', fr: 'Mon profil' },
  specialtyLabel: { en: 'Specialty', fr: 'Spécialité' },
  specialtyPlaceholder: { en: 'e.g. General Practice, Cardiology, Pediatrics', fr: 'ex. Médecine générale, Cardiologie, Pédiatrie' },
  consultationTypesLabel: { en: 'Consultation types offered', fr: 'Types de consultation offerts' },
  consultationTypesHint: { en: 'Comma-separated, e.g. General Consultation, Follow-up', fr: 'Séparés par des virgules, ex. Consultation générale, Suivi' }
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

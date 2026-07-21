const BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('mv_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('mv_token', token);
  else localStorage.removeItem('mv_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(data.error || `request_failed_${res.status}`);
    err.status = res.status;
    err.raw = data;
    throw err;
  }
  return data;
}

const get = <T,>(path: string) => request<T>(path);
const post = <T,>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) });
const patch = <T,>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
const put = <T,>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
const del = <T,>(path: string) => request<T>(path, { method: 'DELETE' });

// ── Patient auth ─────────────────────────────────────────────────
export const requestOtp = (phone: string) => post<{ success: boolean; dev_code?: string }>('/patients/request-otp', { phone });
export const verifyOtp = (phone: string, code: string) =>
  post<{ success: boolean; token: string; global_patient_id: string }>('/patients/verify-otp', { phone, code });

// ── Doctors ──────────────────────────────────────────────────────
export interface Doctor {
  id: string;
  fullName: string;
  specialty: string | null;
  consultationTypes: string[] | null;
  teleconsultFee: string | null;
}
export const listDoctors = (params: { specialty?: string; name?: string } = {}) => {
  // URLSearchParams doesn't drop undefined values — it stringifies them to
  // the literal text "undefined", which the backend then correctly (but
  // unhelpfully) treats as a real search term. Only include keys that
  // actually have a non-empty value.
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][];
  const qs = new URLSearchParams(entries).toString();
  return get<{ success: boolean; doctors: Doctor[] }>(`/doctors/browse${qs ? `?${qs}` : ''}`);
};
export const getDoctorAvailability = (doctorId: string, days = 7) =>
  get<{ success: boolean; slots: Record<string, string[]> }>(`/doctors/${doctorId}/availability/slots?days=${days}`);
export const getDoctorPublic = (doctorId: string) => get<{ success: boolean; doctor: Doctor }>(`/doctors/${doctorId}/public`);

// ── Hospitals — public browse, roster, services, proximity search ──
export interface PublicHospital {
  hospitalId: string;
  name: string;
  city: string | null;
  region: string | null;
  flatBookingFee: string | null;
  distance_km?: number;
}
export const browseHospitals = (city?: string) => get<{ success: boolean; hospitals: PublicHospital[] }>(`/hospitals${city ? `?city=${encodeURIComponent(city)}` : ''}`);

// ── Labs — public browse + patient booking ───────────────────────
export interface PublicLabService {
  id: string;
  testName: string;
  basePrice: string;
}
export interface PublicLabProvider {
  id: string;
  name: string;
  city: string | null;
  serviceType: 'on_site' | 'home_visit' | 'both';
  services: PublicLabService[];
}
export const browseLabs = (city?: string) => get<{ success: boolean; lab_providers: PublicLabProvider[] }>(`/lab-providers${city ? `?city=${encodeURIComponent(city)}` : ''}`);

export const createLabOrder = (body: {
  lab_provider_id: string;
  lab_service_ids: string[];
  service_type: 'on_site' | 'home_visit' | 'both';
  home_address?: string;
}) => post<{ success: boolean; lab_order: { id: string; orderRef: string } }>('/lab-orders', body);

export const getPublicHospital = (hospitalId: string) => get<{ success: boolean; hospital: PublicHospital }>(`/hospitals/${hospitalId}`);

export const getHospitalDoctorSlots = (hospitalId: string, rosterId: string, days = 7) =>
  get<{ success: boolean; slots: Record<string, string[]> }>(`/hospitals/${hospitalId}/doctors/${rosterId}/slots?days=${days}`);

export const getHospitalsNearby = (lat: number, lng: number, radiusKm = 25) =>
  get<{ success: boolean; radius_km: number; hospitals: PublicHospital[] }>(`/hospitals/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`);

export const getPublicHospitalDoctors = (hospitalId: string) =>
  get<{ success: boolean; doctors: HospitalDoctor[] }>(`/hospitals/${hospitalId}/doctors`);

export const getPublicHospitalServices = (hospitalId: string) =>
  get<{ success: boolean; services: HospitalServiceItem[] }>(`/hospitals/${hospitalId}/services`);

// ── Appointments ─────────────────────────────────────────────────
export interface Appointment {
  id: string;
  appointmentRef: string;
  appointmentType: string;
  requestedDate: string | null;
  requestedTime: string | null;
  status: string;
  paymentStatus: string;
  paymentAmount: string | null;
  doctorId: string | null;
}
export const createAppointment = (
  body:
    | { doctor_id: string; appointment_type: 'teleconsult'; requested_date: string; requested_time: string; global_patient_id: string; notes?: string }
    | { hospital_id: string; appointment_type: 'in_person'; global_patient_id: string; notes?: string }
    | {
        hospital_id: string;
        hospital_doctor_roster_id: string;
        appointment_type: 'in_person';
        requested_date: string;
        requested_time: string;
        global_patient_id: string;
        notes?: string;
      }
) => post<{ success: boolean; appointment: Appointment }>('/appointments', { ...body, source: 'patient_web' });

export const requestAppointmentPayment = (appointmentId: string, phone: string, amount: number) =>
  post<{ success: boolean; reference: string; ussd_code?: string; operator?: string }>(
    `/appointments/${appointmentId}/request-payment`,
    { phone, amount }
  );
export const getAppointmentPaymentStatus = (appointmentId: string) =>
  get<{ success: boolean; status: string }>(`/appointments/${appointmentId}/payment-status`);

// ── Patient timeline (history) ──────────────────────────────────
export interface LabOrder {
  id: string;
  orderRef: string;
  status: string;
  paymentStatus: string;
  totalCost: string | null;
  labProvider: { name: string };
}
export interface TelemedicineSession {
  id: string;
  appointmentId: string;
  sessionRef: string;
  status: string;
  roomUrl: string | null;
}
export const getPatientTimeline = (globalPatientId: string) =>
  get<{ success: boolean; appointments: Appointment[]; lab_orders: LabOrder[]; telemedicine_sessions: TelemedicineSession[] }>(
    `/patients/${globalPatientId}/timeline`
  );

// ── Staff login (doctor / lab_staff / admin) — one shared endpoint,
// distinct from patient OTP login ─────────────────────────────────
export const staffLogin = (identifier: string, password: string) =>
  post<{ success: boolean; token: string; role: 'doctor' | 'lab_staff' | 'admin'; doctor_ref?: string; must_change_password?: boolean }>(
    '/auth/login',
    { identifier, password }
  );

// Two different endpoints depending on role — doctors have their own,
// admin/lab_staff share a separate one. Picking the right one here so
// the rest of the app only ever calls one function regardless of role.
export const changePassword = (role: 'doctor' | 'lab_staff' | 'admin', newPassword: string) =>
  post<{ success: boolean }>(role === 'doctor' ? '/doctors/change-password' : '/auth/change-password', {
    new_password: newPassword
  });

export const forgotPassword = (identifier: string) => post<{ success: boolean }>('/auth/forgot-password', { identifier });

export const resetPassword = (identifier: string, code: string, newPassword: string) =>
  post<{ success: boolean }>('/auth/reset-password', { identifier, code, new_password: newPassword });

export const registerDoctor = (body: { full_name: string; email?: string; phone?: string; specialty?: string }) =>
  post<{ success: boolean; doctor: FullDoctor }>('/doctors/register', body);

export interface FullDoctor extends Doctor {
  momoNumber: string | null;
  momoNetwork: string | null;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  teleconsultSlotMinutes: number;
}
export const getMyDoctorProfile = () => get<{ success: boolean; doctor: FullDoctor }>('/doctors/me');

// ── KYC submission — direct-to-storage upload, then submit the keys ──
export const getKycUploadUrl = (fileName: string, contentType: string) =>
  post<{ success: boolean; upload_url: string; key: string }>('/doctors/kyc/upload-url', {
    file_name: fileName,
    content_type: contentType
  });

// Uploads straight to object storage (Backblaze B2), not through our own
// API — the presigned URL points directly at the bucket. A plain PUT
// with a matching Content-Type header is the standard pattern for a
// presigned S3-compatible upload; no auth header needed here, the
// signature is embedded in the URL itself.
export async function uploadToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!res.ok) throw new Error(`upload_failed_${res.status}`);
}

export const submitDoctorKyc = (body: { national_id_key: string; medical_license_key: string; selfie_key: string }) =>
  post<{ success: boolean }>('/doctors/kyc', body);

// ── Doctor dashboard — their own appointments, with any linked session ──
export interface AppointmentWithSession extends Appointment {
  telemedicineSession?: TelemedicineSession | null;
}
export const getMyAppointments = () => get<{ success: boolean; appointments: AppointmentWithSession[] }>('/appointments/my');

export const createTelemedicineSession = (appointmentId: string) =>
  post<{ success: boolean; session: TelemedicineSession }>('/telemedicine/sessions', { appointment_id: appointmentId });

export const createRoomForSession = (sessionId: string) =>
  post<{ success: boolean; session: TelemedicineSession }>(`/telemedicine/sessions/${sessionId}/room`, {});

// ── A doctor's own teleconsult availability ──────────────────────
export interface AvailabilityWindow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}
export const getMyAvailability = () => get<{ success: boolean; availability: AvailabilityWindow[] }>('/doctors/me/availability');

export const setMyAvailability = (windows: { day_of_week: number; start_time: string; end_time: string }[]) =>
  put<{ success: boolean; availability: AvailabilityWindow[] }>('/doctors/me/availability', { windows });

export const setTeleconsultSlotMinutes = (minutes: number) =>
  patch<{ success: boolean; doctor: FullDoctor }>('/doctors/me', { teleconsult_slot_minutes: minutes });

export const setDoctorProfile = (body: {
  specialty?: string;
  consultation_types?: string[];
  momo_number?: string;
  momo_network?: string;
  teleconsult_fee?: number;
}) => patch<{ success: boolean; doctor: FullDoctor }>('/doctors/me', body);

// ── A doctor's own labs — registration, staff, services, KYC ────
export interface LabService {
  id: string;
  testName: string;
  basePrice: string;
}
export interface LabWorkingHoursWindow {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}
export interface MyLabProvider {
  id: string;
  providerRef: string;
  name: string;
  city: string | null;
  serviceType: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  momoNumber: string | null;
  momoNetwork: string | null;
  kycSubmittedAt: string | null;
  services: LabService[];
  workingHours: LabWorkingHoursWindow[];
}
export const getMyLabs = () => get<{ success: boolean; lab_providers: MyLabProvider[] }>('/lab-providers/my');

export const setLabWorkingHours = (labId: string, windows: { day_of_week: number; open_time: string; close_time: string }[]) =>
  put<{ success: boolean; working_hours: LabWorkingHoursWindow[] }>(`/lab-providers/${labId}/working-hours`, { windows });

export const registerLab = (body: { name: string; service_type: string; city?: string }) =>
  post<{ success: boolean; lab_provider: MyLabProvider }>('/lab-providers/register', body);

export const setLabPayoutDetails = (labId: string, body: { momo_number?: string; momo_network?: string; home_service_fee?: number }) =>
  patch<{ success: boolean; lab_provider: MyLabProvider }>(`/lab-providers/${labId}`, body);

export const addLabService = (labId: string, body: { test_name: string; base_price: number }) =>
  post<{ success: boolean; lab_service: LabService }>(`/lab-providers/${labId}/services`, body);

export interface LabStaffMember {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
}
export const getLabStaff = (labId: string) => get<{ success: boolean; staff: LabStaffMember[] }>(`/lab-providers/${labId}/staff`);

export const addLabStaff = (labId: string, body: { full_name: string; email?: string; phone?: string }) =>
  post<{ success: boolean; staff: LabStaffMember }>(`/lab-providers/${labId}/staff`, body);

export const getLabKycUploadUrl = (labId: string, fileName: string, contentType: string) =>
  post<{ success: boolean; upload_url: string; key: string }>(`/lab-providers/${labId}/kyc/upload-url`, {
    file_name: fileName,
    content_type: contentType
  });

export const submitLabKyc = (
  labId: string,
  body: { business_registration_number: string; business_registration_key: string; lab_accreditation_key?: string; owner_id_key: string }
) => post<{ success: boolean }>(`/lab-providers/${labId}/kyc`, body);

// ── Admin — KYC review queue ─────────────────────────────────────
export interface PendingDoctor {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  licenseNumber: string | null;
  kycSubmittedAt: string | null;
}
export interface PendingLabProvider {
  id: string;
  name: string;
  city: string | null;
  businessRegistrationNumber: string | null;
  kycSubmittedAt: string | null;
}
export const getPendingKyc = () =>
  get<{ success: boolean; doctors: PendingDoctor[]; lab_providers: PendingLabProvider[] }>('/admin/kyc/pending');

export const getDoctorDocumentUrl = (doctorId: string, field: 'national_id' | 'medical_license' | 'selfie') =>
  get<{ success: boolean; url: string }>(`/admin/kyc/doctors/${doctorId}/document-url?field=${field}`);

export const getLabDocumentUrl = (labId: string, field: 'business_registration' | 'lab_accreditation' | 'owner_id') =>
  get<{ success: boolean; url: string }>(`/admin/kyc/lab-providers/${labId}/document-url?field=${field}`);

export const decideDoctorKyc = (doctorId: string, approve: boolean, reason?: string) =>
  post<{ success: boolean; verification_status: string }>(`/admin/kyc/doctors/${doctorId}/decision`, { approve, reason });

export const decideLabKyc = (labId: string, approve: boolean, reason?: string) =>
  post<{ success: boolean; verification_status: string }>(`/admin/kyc/lab-providers/${labId}/decision`, { approve, reason });

// ── Admin monitoring — revenue, error feed, stale-sync alerts ────
export interface PayoutSummary {
  id: string;
  totalAmount: string;
  platformAmount: string;
  providerAmount: string;
  completedAt: string;
  appointmentId: string | null;
  labOrderId: string | null;
}
export const getRevenue = () =>
  get<{
    success: boolean;
    platform_revenue_total: string;
    appointment_gross_total: string;
    lab_order_gross_total: string;
    recent_payouts: PayoutSummary[];
  }>('/admin/revenue');

export interface ErrorLogEntry {
  id: string;
  source: string;
  message: string;
  createdAt: string;
}
export const getErrorFeed = () => get<{ success: boolean; errors: ErrorLogEntry[] }>('/admin/errors?limit=50');

export interface StaleInstallation {
  id: string;
  installationId: string;
  deviceLabel: string | null;
  lastSeenAt: string | null;
  hospital: { name: string; hospitalId: string };
}
export const getStaleSyncs = () =>
  get<{ success: boolean; threshold_hours: number; stale_installations: StaleInstallation[] }>('/admin/stale-syncs');

// ── Admin — hospital roster & services management ────────────────
export interface HospitalDoctorWindow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}
export interface HospitalDoctor {
  id: string;
  fullName: string;
  specialty: string | null;
  workingHours: HospitalDoctorWindow[];
}
export interface HospitalServiceItem {
  id: string;
  name: string;
}
export interface AdminHospital {
  id: string;
  hospitalId: string;
  hospitalCode: string;
  name: string;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  flatBookingFee: string | null;
  appointmentSlotMinutes: number;
  hospitalMomoNumber: string | null;
  hospitalMomoNetwork: string | null;
  doctorRoster: HospitalDoctor[];
  services: HospitalServiceItem[];
}
export const getAdminHospitals = () => get<{ success: boolean; hospitals: AdminHospital[] }>('/admin/hospitals');

export const createHospital = (body: {
  hospital_id: string;
  hospital_code: string;
  name: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}) =>
  post<{ success: boolean; hospital: AdminHospital }>('/admin/hospitals', body);

export const updateHospitalSettings = (
  hospitalId: string,
  body: {
    latitude?: number;
    longitude?: number;
    flat_booking_fee?: number;
    hospital_momo_number?: string;
    hospital_momo_network?: string;
    appointment_slot_minutes?: number;
  }
) => patch<{ success: boolean; hospital: AdminHospital }>(`/admin/hospitals/${hospitalId}`, body);

export const addHospitalService = (hospitalId: string, name: string) =>
  post<{ success: boolean; service: HospitalServiceItem }>(`/admin/hospitals/${hospitalId}/services`, { name });

export const deleteHospitalService = (hospitalId: string, serviceId: string) =>
  del<{ success: boolean }>(`/admin/hospitals/${hospitalId}/services/${serviceId}`);

export const addHospitalDoctor = (hospitalId: string, body: { full_name: string; specialty?: string }) =>
  post<{ success: boolean; doctor: HospitalDoctor }>(`/admin/hospitals/${hospitalId}/doctors`, body);

export const deleteHospitalDoctor = (hospitalId: string, doctorId: string) =>
  del<{ success: boolean }>(`/admin/hospitals/${hospitalId}/doctors/${doctorId}`);

export const setHospitalDoctorHours = (
  hospitalId: string,
  doctorId: string,
  windows: { day_of_week: number; start_time: string; end_time: string }[]
) => put<{ success: boolean; working_hours: HospitalDoctorWindow[] }>(`/admin/hospitals/${hospitalId}/doctors/${doctorId}/working-hours`, { windows });

// ── Lab staff dashboard ──────────────────────────────────────────
export type LabOrderStatus = 'requested' | 'scheduled' | 'sample_collected' | 'in_progress' | 'completed' | 'cancelled';
export interface LabOrderItem {
  id: string;
  priceAtOrder: string;
  labService: { testName: string };
}
export interface FullLabOrder extends LabOrder {
  status: LabOrderStatus;
  items: LabOrderItem[];
}
export const getMyLabOrders = () => get<{ success: boolean; lab_orders: FullLabOrder[] }>('/lab-orders/my');

export const updateLabOrderStatus = (orderId: string, status: LabOrderStatus) =>
  patch<{ success: boolean; lab_order: FullLabOrder }>(`/lab-orders/${orderId}`, { status });

const BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('mv_patient_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('mv_patient_token', token);
  else localStorage.removeItem('mv_patient_token');
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
  // No public "list all doctors" endpoint exists yet server-side — this
  // reuses the same shape the WhatsApp agent's list_doctors tool expects,
  // via a thin passthrough the portal's backend route will need to expose.
  // See PATIENT_PORTAL_DEPLOY.md for the one small backend addition this needs.
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return get<{ success: boolean; doctors: Doctor[] }>(`/doctors/browse${qs ? `?${qs}` : ''}`);
};
export const getDoctorAvailability = (doctorId: string, days = 7) =>
  get<{ success: boolean; slots: Record<string, string[]> }>(`/doctors/${doctorId}/availability/slots?days=${days}`);
export const getDoctorPublic = (doctorId: string) => get<{ success: boolean; doctor: Doctor }>(`/doctors/${doctorId}/public`);

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
export const createAppointment = (body: {
  doctor_id: string;
  appointment_type: 'teleconsult';
  requested_date: string;
  requested_time: string;
  notes?: string;
}) => post<{ success: boolean; appointment: Appointment }>('/appointments', { ...body, source: 'patient_web' });

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
  sessionRef: string;
  status: string;
  roomUrl: string | null;
}
export const getPatientTimeline = (globalPatientId: string) =>
  get<{ success: boolean; appointments: Appointment[]; lab_orders: LabOrder[]; telemedicine_sessions: TelemedicineSession[] }>(
    `/patients/${globalPatientId}/timeline`
  );

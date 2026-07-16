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
  global_patient_id: string;
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

export const forgotPassword = (identifier: string) => post<{ success: boolean }>('/auth/forgot-password', { identifier });

export const resetPassword = (identifier: string, code: string, newPassword: string) =>
  post<{ success: boolean }>('/auth/reset-password', { identifier, code, new_password: newPassword });

export const registerDoctor = (body: { full_name: string; email?: string; phone?: string; specialty?: string }) =>
  post<{ success: boolean; doctor: FullDoctor }>('/doctors/register', body);

export interface FullDoctor extends Doctor {
  momoNumber: string | null;
  momoNetwork: string | null;
}
export const getMyDoctorProfile = () => get<{ success: boolean; doctor: FullDoctor }>('/doctors/me');

// ── Doctor dashboard — their own appointments, with any linked session ──
export interface AppointmentWithSession extends Appointment {
  telemedicineSession?: TelemedicineSession | null;
}
export const getMyAppointments = () => get<{ success: boolean; appointments: AppointmentWithSession[] }>('/appointments/my');

export const createTelemedicineSession = (appointmentId: string) =>
  post<{ success: boolean; session: TelemedicineSession }>('/telemedicine/sessions', { appointment_id: appointmentId });

export const createRoomForSession = (sessionId: string) =>
  post<{ success: boolean; session: TelemedicineSession }>(`/telemedicine/sessions/${sessionId}/room`, {});

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

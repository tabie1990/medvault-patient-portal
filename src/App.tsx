import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, type Role } from './lib/auth';
import { LangProvider } from './lib/i18n';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { StaffLogin } from './pages/StaffLogin';
import { DoctorRegister } from './pages/DoctorRegister';
import { ForgotPassword } from './pages/ForgotPassword';
import { Doctors } from './pages/Doctors';
import { Hospitals } from './pages/Hospitals';
import { Labs } from './pages/Labs';
import { HospitalDetail } from './pages/HospitalDetail';
import { DoctorDetail } from './pages/DoctorDetail';
import { MyAppointments } from './pages/MyAppointments';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { LabDashboard } from './pages/LabDashboard';
import { DoctorKycSubmit } from './pages/DoctorKycSubmit';
import { DoctorAvailability } from './pages/DoctorAvailability';
import { DoctorProfile } from './pages/DoctorProfile';
import { MyLabs } from './pages/MyLabs';
import { LabManage } from './pages/LabManage';
import { LabKycSubmit } from './pages/LabKycSubmit';
import { AdminDashboard } from './pages/AdminDashboard';
import { ChangePassword } from './pages/ChangePassword';

function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Role-based routing — one app, branching to the right home screen based
// on the JWT's role, rather than a separate app per role. Redirects to
// the staff login (not the patient OTP login) since a doctor/lab/admin
// account was never meant to go through that screen.
function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { token, role: currentRole, mustChangePassword } = useAuth();
  if (!token) return <Navigate to="/staff-login" replace />;
  if (currentRole !== role) return <Navigate to="/staff-login" replace />;
  // Redirect to the forced change-password page regardless of which
  // protected route was actually requested — a temporary password
  // shouldn't grant real access to anything else first.
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  return <>{children}</>;
}

// For /change-password specifically — must work for any of the three
// staff roles, not gated to one, and deliberately does NOT redirect back
// to itself based on mustChangePassword (this is the page that handles it).
function RequireAnyStaffRole({ children }: { children: ReactNode }) {
  const { token, role } = useAuth();
  if (!token || role === 'patient' || role === null) return <Navigate to="/staff-login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout wide>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/login"
        element={
          <Layout>
            <Login />
          </Layout>
        }
      />
      <Route
        path="/staff-login"
        element={
          <Layout>
            <StaffLogin />
          </Layout>
        }
      />
      <Route
        path="/doctor-register"
        element={
          <Layout>
            <DoctorRegister />
          </Layout>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <Layout>
            <ForgotPassword />
          </Layout>
        }
      />
      {/* Browsing is public — booking itself still requires login,
          enforced inside DoctorDetail's own booking action rather than
          gating the whole page, so someone can look before signing up. */}
      <Route
        path="/find-a-doctor"
        element={
          <Layout>
            <Doctors />
          </Layout>
        }
      />
      <Route
        path="/doctors/:id"
        element={
          <Layout>
            <DoctorDetail />
          </Layout>
        }
      />
      <Route
        path="/find-a-hospital"
        element={
          <Layout>
            <Hospitals />
          </Layout>
        }
      />
      <Route
        path="/find-a-lab"
        element={
          <Layout>
            <Labs />
          </Layout>
        }
      />
      <Route
        path="/hospitals/:hospitalId"
        element={
          <Layout>
            <HospitalDetail />
          </Layout>
        }
      />
      <Route
        path="/appointments"
        element={
          <RequireAuth>
            <Layout>
              <MyAppointments />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/doctor"
        element={
          <RequireRole role="doctor">
            <Layout>
              <DoctorDashboard />
            </Layout>
          </RequireRole>
        }
      />
      <Route
        path="/lab"
        element={
          <RequireRole role="lab_staff">
            <Layout>
              <LabDashboard />
            </Layout>
          </RequireRole>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <Layout>
              <AdminDashboard />
            </Layout>
          </RequireRole>
        }
      />
      <Route
        path="/change-password"
        element={
          <RequireAnyStaffRole>
            <Layout>
              <ChangePassword />
            </Layout>
          </RequireAnyStaffRole>
        }
      />
      <Route
        path="/doctor/kyc"
        element={
          <RequireRole role="doctor">
            <Layout>
              <DoctorKycSubmit />
            </Layout>
          </RequireRole>
        }
      />
      <Route
        path="/doctor/availability"
        element={
          <RequireRole role="doctor">
            <Layout>
              <DoctorAvailability />
            </Layout>
          </RequireRole>
        }
      />
      <Route
        path="/doctor/profile"
        element={
          <RequireRole role="doctor">
            <Layout>
              <DoctorProfile />
            </Layout>
          </RequireRole>
        }
      />
      <Route
        path="/doctor/labs"
        element={
          <RequireRole role="doctor">
            <Layout>
              <MyLabs />
            </Layout>
          </RequireRole>
        }
      />
      <Route
        path="/doctor/labs/:id"
        element={
          <RequireRole role="doctor">
            <Layout>
              <LabManage />
            </Layout>
          </RequireRole>
        }
      />
      <Route
        path="/doctor/labs/:id/kyc"
        element={
          <RequireRole role="doctor">
            <Layout>
              <LabKycSubmit />
            </Layout>
          </RequireRole>
        }
      />
      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
}

function CatchAllRedirect() {
  const { role } = useAuth();
  if (role === 'doctor') return <Navigate to="/doctor" replace />;
  if (role === 'lab_staff') return <Navigate to="/lab" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/" replace />;
}

export function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}

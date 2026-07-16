import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, type Role } from './lib/auth';
import { LangProvider } from './lib/i18n';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { StaffLogin } from './pages/StaffLogin';
import { DoctorRegister } from './pages/DoctorRegister';
import { Doctors } from './pages/Doctors';
import { DoctorDetail } from './pages/DoctorDetail';
import { MyAppointments } from './pages/MyAppointments';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { LabDashboard } from './pages/LabDashboard';

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
  const { token, role: currentRole } = useAuth();
  if (!token) return <Navigate to="/staff-login" replace />;
  if (currentRole !== role) return <Navigate to="/staff-login" replace />;
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
      <Route path="/login" element={<Login />} />
      <Route path="/staff-login" element={<StaffLogin />} />
      <Route path="/doctor-register" element={<DoctorRegister />} />
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
      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
}

function CatchAllRedirect() {
  const { role } = useAuth();
  if (role === 'doctor') return <Navigate to="/doctor" replace />;
  if (role === 'lab_staff') return <Navigate to="/lab" replace />;
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

import { createBrowserRouter, createRoutesFromElements, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { RequireRole, RedirectIfAuthed } from "./components/auth/RouteGuards";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { NotFound } from "./pages/NotFound";
import { PatientDashboard } from "./pages/patient/Dashboard";
import { FindADoctor } from "./pages/patient/FindADoctor";
import { PatientAppointments } from "./pages/patient/Appointments";
import { PatientSettings } from "./pages/patient/Settings";
import { DoctorDashboard } from "./pages/doctor/Dashboard";
import { DoctorAppointments } from "./pages/doctor/Appointments";
import { DoctorSettings } from "./pages/doctor/Settings";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminDoctors } from "./pages/admin/Doctors";
import { AdminSettings } from "./pages/admin/Settings";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Landing />} />

      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthed>
            <Register />
          </RedirectIfAuthed>
        }
      />

      <Route
        path="/patient"
        element={
          <RequireRole role="PATIENT">
            <AppShell role="PATIENT" />
          </RequireRole>
        }
      >
        <Route index element={<PatientDashboard />} handle={{ title: "Dashboard" }} />
        <Route
          path="find-a-doctor"
          element={<FindADoctor />}
          handle={{ title: "Find a doctor" }}
        />
        <Route
          path="appointments"
          element={<PatientAppointments />}
          handle={{ title: "Appointments" }}
        />
        <Route path="settings" element={<PatientSettings />} handle={{ title: "Settings" }} />
      </Route>

      <Route
        path="/doctor"
        element={
          <RequireRole role="DOCTOR">
            <AppShell role="DOCTOR" />
          </RequireRole>
        }
      >
        <Route index element={<DoctorDashboard />} handle={{ title: "Dashboard" }} />
        <Route
          path="appointments"
          element={<DoctorAppointments />}
          handle={{ title: "Appointments" }}
        />
        <Route path="settings" element={<DoctorSettings />} handle={{ title: "Settings" }} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireRole role="ADMIN">
            <AppShell role="ADMIN" />
          </RequireRole>
        }
      >
        <Route index element={<AdminDashboard />} handle={{ title: "Dashboard" }} />
        <Route path="doctors" element={<AdminDoctors />} handle={{ title: "Doctors" }} />
        <Route path="settings" element={<AdminSettings />} handle={{ title: "Settings" }} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </>
  )
);

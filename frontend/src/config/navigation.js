import {
  LayoutGrid,
  Search,
  CalendarDays,
  Settings,
  Stethoscope,
} from "lucide-react";

export const NAVIGATION = {
  PATIENT: [
    { label: "Dashboard", to: "/patient", icon: LayoutGrid, end: true },
    { label: "Find a doctor", to: "/patient/find-a-doctor", icon: Search },
    { label: "Appointments", to: "/patient/appointments", icon: CalendarDays },
    { label: "Settings", to: "/patient/settings", icon: Settings },
  ],
  DOCTOR: [
    { label: "Dashboard", to: "/doctor", icon: LayoutGrid, end: true },
    { label: "Appointments", to: "/doctor/appointments", icon: CalendarDays },
    { label: "Settings", to: "/doctor/settings", icon: Settings },
  ],
  ADMIN: [
    { label: "Dashboard", to: "/admin", icon: LayoutGrid, end: true },
    { label: "Doctors", to: "/admin/doctors", icon: Stethoscope },
    { label: "Settings", to: "/admin/settings", icon: Settings },
  ],
};

export const ROLE_LABEL = {
  PATIENT: "Patient",
  DOCTOR: "Doctor",
  ADMIN: "Admin",
};

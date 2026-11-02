import React from "react";
import { Routes, Route } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout.jsx";
import PatientLayout from "./layouts/PatientLayout.jsx";
import DoctorLayout from "./layouts/DoctorLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { ROLES } from "./utils/constants.js";

// Public pages
import Home from "./pages/public/Home.jsx";
import About from "./pages/public/About.jsx";
import Services from "./pages/public/Services.jsx";
import Doctors from "./pages/public/Doctors.jsx";
import Contact from "./pages/public/Contact.jsx";
import Login from "./pages/public/Login.jsx";
import Register from "./pages/public/Register.jsx";
import DoctorDetail from "./pages/public/DoctorDetail.jsx";

// Patient pages
import PatientDashboard from "./pages/patient/PatientDashboard.jsx";
import PatientProfile from "./pages/patient/Profile.jsx";
import FindDoctors from "./pages/patient/FindDoctors.jsx";
import PatientDoctorProfile from "./pages/patient/DoctorProfile.jsx";
import BookAppointment from "./pages/patient/BookAppointment.jsx";
import AppointmentConfirmation from "./pages/patient/AppointmentConfirmation.jsx";
import MyAppointments from "./pages/patient/MyAppointments.jsx";
import PatientAppointmentDetails from "./pages/patient/AppointmentDetails.jsx";
import PatientMedicalRecords from "./pages/patient/MedicalRecords.jsx";
import PatientPrescriptions from "./pages/patient/Prescriptions.jsx";
import PatientNotifications from "./pages/patient/Notifications.jsx";

// Doctor pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard.jsx";
import DoctorProfile from "./pages/doctor/Profile.jsx";
import AvailabilityManagement from "./pages/doctor/AvailabilityManagement.jsx";
import DoctorAppointments from "./pages/doctor/Appointments.jsx";
import DoctorAppointmentDetails from "./pages/doctor/AppointmentDetails.jsx";
import PatientDetails from "./pages/doctor/PatientDetails.jsx";
import Consultation from "./pages/doctor/Consultation.jsx";
import DoctorMedicalRecords from "./pages/doctor/MedicalRecords.jsx";
import DoctorPrescriptions from "./pages/doctor/Prescriptions.jsx";
import DoctorNotifications from "./pages/doctor/Notifications.jsx";

import NotFound from "./pages/NotFound.jsx";

/**
 * All routing lives here so the full navigation map is visible in one
 * place. Patient/doctor sections are wrapped in ProtectedRoute so a
 * logged-in user of the wrong role is redirected rather than shown a
 * broken page.
 */
export default function App() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctors/:doctorId" element={<DoctorDetail />} />
      </Route>

      {/* Patient portal */}
      <Route
        element={
          <ProtectedRoute allowedRole={ROLES.PATIENT}>
            <PatientLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/profile" element={<PatientProfile />} />
        <Route path="/patient/find-doctors" element={<FindDoctors />} />
        <Route path="/patient/doctors/:doctorId" element={<PatientDoctorProfile />} />
        <Route path="/patient/book/:doctorId" element={<BookAppointment />} />
        <Route
          path="/patient/appointments/confirmation/:appointmentId"
          element={<AppointmentConfirmation />}
        />
        <Route path="/patient/appointments" element={<MyAppointments />} />
        <Route path="/patient/appointments/:appointmentId" element={<PatientAppointmentDetails />} />
        <Route path="/patient/medical-records" element={<PatientMedicalRecords />} />
        <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
        <Route path="/patient/notifications" element={<PatientNotifications />} />
      </Route>

      {/* Doctor portal */}
      <Route
        element={
          <ProtectedRoute allowedRole={ROLES.DOCTOR}>
            <DoctorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/profile" element={<DoctorProfile />} />
        <Route path="/doctor/availability" element={<AvailabilityManagement />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route path="/doctor/appointments/:appointmentId" element={<DoctorAppointmentDetails />} />
        <Route path="/doctor/appointments/:appointmentId/consultation" element={<Consultation />} />
        <Route path="/doctor/patients/:patientId" element={<PatientDetails />} />
        <Route path="/doctor/medical-records" element={<DoctorMedicalRecords />} />
        <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
        <Route path="/doctor/notifications" element={<DoctorNotifications />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from './redux/store.js';
import { Toaster } from 'react-hot-toast';

// Layout
import DashboardLayout from './layouts/DashboardLayout.js';

// Auth Pages
import LoginPage from './pages/auth/LoginPage.js';
import VerifyEmail from './pages/auth/VerifyEmail.js';
import ForgotPassword from './pages/auth/ForgotPassword.js';
import ResetPassword from './pages/auth/ResetPassword.js';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.js';
import UserManagement from './pages/admin/UserManagement.js';
import CourseManagement from './pages/admin/CourseManagement.js';
import StaffManagement from './pages/admin/StaffManagement.js';
import TimetableScheduler from './pages/admin/TimetableScheduler.js';
import CourseEnrollment from './pages/admin/CourseEnrollment.js';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard.js';
import LecturerDashboard from './pages/staff/LecturerDashboard.js';
import MarksInput from './pages/staff/MarksInput.js';
import AttendanceCheck from './pages/staff/AttendanceCheck.js';
import AssignmentManager from './pages/staff/AssignmentManager.js';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard.js';
import StudentCourses from './pages/student/StudentCourses.js';
import StudentMarks from './pages/student/StudentMarks.js';
import StudentTimetable from './pages/student/StudentTimetable.js';
import StudentEnrollment from './pages/student/StudentEnrollment.js';

import ForceChangePassword from './pages/auth/ForceChangePassword.js';

import './index.css';

// Guard Component to Protect Endpoints by Authentication & Roles
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'staff' | 'student' | 'lecturer')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to force change password if it is their first login
  if (user.isFirstLogin) {
    return <Navigate to="/force-change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized for role, bounce to their default portal dashboard
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/force-change-password" element={<ForceChangePassword />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <StaffManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CourseManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/timetable"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TimetableScheduler />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/enrollments"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CourseEnrollment />
              </ProtectedRoute>
            }
          />

          {/* Staff & Lecturer Routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer"
            element={
              <ProtectedRoute allowedRoles={['lecturer']}>
                <LecturerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/users"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/students"
            element={
              <ProtectedRoute allowedRoles={['staff', 'lecturer']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/lecturers"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/marks"
            element={
              <ProtectedRoute allowedRoles={['staff', 'lecturer']}>
                <MarksInput />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/attendance"
            element={
              <ProtectedRoute allowedRoles={['staff', 'lecturer']}>
                <AttendanceCheck />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/assignments"
            element={
              <ProtectedRoute allowedRoles={['staff', 'lecturer']}>
                <AssignmentManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/timetable"
            element={
              <ProtectedRoute allowedRoles={['staff', 'lecturer']}>
                <TimetableScheduler />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/enrollments"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <CourseEnrollment />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/courses"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/marks"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentMarks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/timetable"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentTimetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/enroll"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentEnrollment />
              </ProtectedRoute>
            }
          />

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

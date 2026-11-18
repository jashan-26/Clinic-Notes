import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DoctorProtectedRoute, AdminProtectedRoute } from './components/Auth/ProtectedRoute';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { PendingApproval } from './pages/PendingApproval';
import { StatusMessage } from './pages/StatusMessage';

import { AdminLayout } from './pages/Admin/AdminLayout';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { DoctorsList } from './pages/Admin/DoctorsList';
import { PendingApprovals } from './pages/Admin/PendingApprovals';
import { HospitalsManager } from './pages/Admin/HospitalsManager';
import { GlobalAuditLog } from './pages/Admin/GlobalAuditLog';
import { AdminSettings } from './pages/Admin/AdminSettings';

import { TopBar } from './components/TopBar';
import { DoctorNotesTab } from './components/DoctorNotes/DoctorNotesTab';
import { ConsultationTab } from './components/Consultation/ConsultationTab';
import { PatientMobileScreen } from './components/Consultation/PatientMobileScreen';
import { MyProfileModal } from './components/Common/MyProfileModal';
import { PrivacyShieldModal } from './components/Common/PrivacyShieldModal';
import { AuditLogModal } from './components/Common/AuditLogModal';
import { ComplianceModal } from './components/Common/ComplianceModal';
import { GuidedDemoTour } from './components/Common/GuidedDemoTour';
import { Activity, ShieldCheck, Lock } from 'lucide-react';

/**
 * Main Doctor Workstation Component
 */
function DoctorWorkstation() {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'consultation'
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPrivacyShieldOpen, setIsPrivacyShieldOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const { isDemoMode } = useAuth();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const roomParam = searchParams.get('room');

  // If patient QR link is opened on smartphone
  if (roleParam === 'patient' && roomParam) {
    return <PatientMobileScreen roomId={roomParam} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Demo Mode Notification Bar */}
      {isDemoMode && (
        <div className="bg-amber-500 text-white text-[11px] px-4 py-1 text-center font-medium flex items-center justify-center gap-1.5 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>
            Demo Mode: Database not connected. Running local hospital sandbox. Notes are encrypted via Web Crypto AES-GCM.
          </span>
        </div>
      )}

      {/* Hospital Top Bar */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenPrivacyShield={() => setIsPrivacyShieldOpen(true)}
        onOpenAuditLog={() => setIsAuditLogOpen(true)}
        onOpenCompliance={() => setIsComplianceOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onStartTour={() => setIsTourOpen(true)}
      />

      {/* Main Clinical Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'notes' && (
          <DoctorNotesTab onOpenPrivacyShield={() => setIsPrivacyShieldOpen(true)} />
        )}

        {activeTab === 'consultation' && <ConsultationTab />}
      </main>

      {/* Hospital & Compliance Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-teal-700" />
            <span className="font-semibold text-slate-700">ClinicNotes v2.6</span>
            <span>•</span>
            <span>AI-generated summary. Review and verify before clinical use.</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsComplianceOpen(true)}
              className="hover:text-slate-800 underline transition-colors"
            >
              HIPAA & DPDP Statement
            </button>
            <button
              onClick={() => setIsPrivacyShieldOpen(true)}
              className="hover:text-slate-800 underline transition-colors"
            >
              Privacy Shield Architecture
            </button>
            <button
              onClick={() => setIsAuditLogOpen(true)}
              className="hover:text-slate-800 underline transition-colors"
            >
              Audit Trail
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
          <strong>Zero-Knowledge Encryption Notice:</strong> Stored encrypted with doctor's passphrase. Even the admin cannot read your notes. Forgotten passphrases cannot be recovered.
        </div>
      </footer>

      {/* Modals */}
      <MyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <PrivacyShieldModal
        isOpen={isPrivacyShieldOpen}
        onClose={() => setIsPrivacyShieldOpen(false)}
      />

      <AuditLogModal
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
      />

      <ComplianceModal
        isOpen={isComplianceOpen}
        onClose={() => setIsComplianceOpen(false)}
      />

      <GuidedDemoTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onSwitchTab={setActiveTab}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pending" element={<PendingApproval />} />
          <Route path="/status" element={<StatusMessage />} />

          {/* Doctor Protected Route */}
          <Route
            path="/"
            element={
              <DoctorProtectedRoute>
                <DoctorWorkstation />
              </DoctorProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="doctors" element={<DoctorsList />} />
            <Route path="pending" element={<PendingApprovals />} />
            <Route path="hospitals" element={<HospitalsManager />} />
            <Route path="audit" element={<GlobalAuditLog />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

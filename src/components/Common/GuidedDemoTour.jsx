import React, { useState } from 'react';
import { HelpCircle, ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2, User, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TOUR_STEPS = [
  {
    title: '1. Sign in as Verified Doctor',
    action: 'doctor_login',
    description:
      'ClinicNotes enforces verified clinician access. You can sign in as an approved doctor (Dr. A. Sharma) using the 1-click credentials to access patient encounter documentation.',
  },
  {
    title: '2. Dictate Encounters & Live Highlighting',
    tab: 'notes',
    description:
      'In Tab 1, doctors dictate notes. Speech is transcribed in real-time in English or Hindi, with instant multi-color tagging: History (green), Meds (yellow), Tests (blue), and PHI (red font only).',
  },
  {
    title: '3. Zero-Knowledge Client-Side Encryption',
    tab: 'notes',
    description:
      'All notes and consultations are encrypted in the browser with AES-GCM 256-bit using the doctor passphrase before being saved to Supabase. Even database administrators cannot read note contents.',
  },
  {
    title: '4. Tab 2: Doctor-Patient Consultation',
    tab: 'consultation',
    description:
      'Live doctor-patient conversations can be recorded using Two-Device Mode (patient scans QR code on phone), Single-Device toggle, or sample loading. Structured conclusions and medicines are auto-extracted.',
  },
  {
    title: '5. Quick-Commerce Pharmacy Gateway',
    tab: 'consultation',
    description:
      'Extracted medications are compared across Blinkit (10-min), Zepto, Apollo Pharmacy, Tata 1mg, and PharmEasy, with generic alternatives and live order tracking.',
  },
  {
    title: '6. Switch to Hospital Admin Governance',
    action: 'admin_portal',
    description:
      'Now sign in as Hospital Admin (Dr. Vikram Malhotra) to open the Admin Governance Portal at /admin. Notice the banner: admins see account metadata only, never patient notes!',
  },
  {
    title: '7. Verify Credentials & Approve Doctors',
    action: 'approve_doctor',
    description:
      'Under "Pending Approvals", administrators verify the doctor’s Medical Council Registration Number (MCI/SMC) and click "Approve Doctor" to activate their portal access.',
  },
  {
    title: '8. Global Compliance & Audit Trail',
    action: 'audit_log',
    description:
      'Every login, credential approval, export, and clinical encounter is logged in the immutable Audit Trail with CSV export, guaranteeing full DPDP Act 2023 compliance.',
  },
];

export function GuidedDemoTour({ isOpen, onClose, onSwitchTab }) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  const handleNext = async () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      const target = TOUR_STEPS[nextStep];
      if (target.tab && onSwitchTab) {
        onSwitchTab(target.tab);
      }

      if (target.action === 'admin_portal') {
        try {
          await signIn({ email: 'admin@clinicnotes.hospital', password: 'Admin@123456' });
          navigate('/admin');
        } catch (e) {}
      } else if (target.action === 'approve_doctor') {
        navigate('/admin/pending');
      } else if (target.action === 'audit_log') {
        navigate('/admin/audit');
      }
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      const target = TOUR_STEPS[prevStep];
      if (target.tab && onSwitchTab) {
        onSwitchTab(target.tab);
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-white rounded-xl shadow-2xl border-2 border-teal-600 p-5 animate-in fade-in slide-in-from-bottom-4">
      {/* Tour Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
            {currentStep + 1}/{TOUR_STEPS.length}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Interactive End-to-End Tour
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
          title="Exit tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tour Step Content */}
      <div className="py-4 space-y-2">
        <h3 className="font-bold text-slate-800 text-base">{step.title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
      </div>

      {/* Progress Dots & Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center space-x-1">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep ? 'w-5 bg-teal-600' : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="px-3 py-1.5 text-xs bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-lg shadow-xs transition-colors flex items-center gap-1"
          >
            {currentStep === TOUR_STEPS.length - 1 ? (
              <>
                Finish Tour <CheckCircle2 className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Next Step <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

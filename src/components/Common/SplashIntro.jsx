import React, { useState, useEffect } from 'react';

/**
 * Branded Splash Intro Animation for ClinicNotes
 * - Full-screen background in exact app teal accent (#0f766e / bg-teal-700)
 * - "Clinic" slides in from LEFT edge; "Notes" slides in from RIGHT edge
 * - Meet and align in center, stacked as two lines (Clinic on top, Notes below)
 * - Hold for ~0.6s
 * - Exit: "Notes" slides out to LEFT, "Clinic" slides out to RIGHT, overlay fades out
 * - Overlay unmounts completely from DOM, revealing interactive login page underneath
 * - Respects prefers-reduced-motion and sessionStorage
 */
export function SplashIntro({ onFinish }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        const timer = setTimeout(() => {
          handleComplete();
        }, 400);
        return () => clearTimeout(timer);
      }
    }

    // Exit phase: start fade out and slide out at 2.4s
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2400);

    // Total sequence finish at 3.6s
    const finishTimer = setTimeout(() => {
      handleComplete();
    }, 3600);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  const handleComplete = () => {
    try {
      sessionStorage.setItem('clinicnotes_splash_shown', 'true');
    } catch (e) {}
    if (onFinish) onFinish();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-teal-700 text-white select-none overflow-hidden transition-opacity duration-700 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <style>{`
        @keyframes slideClinicInLeftOutRight {
          0% {
            transform: translateX(-120vw);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          38% {
            transform: translateX(0);
            opacity: 1;
          }
          66% {
            transform: translateX(0);
            opacity: 1;
          }
          82% {
            opacity: 1;
          }
          100% {
            transform: translateX(120vw);
            opacity: 0;
          }
        }

        @keyframes slideNotesInRightOutLeft {
          0% {
            transform: translateX(120vw);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          38% {
            transform: translateX(0);
            opacity: 1;
          }
          66% {
            transform: translateX(0);
            opacity: 1;
          }
          82% {
            opacity: 1;
          }
          100% {
            transform: translateX(-120vw);
            opacity: 0;
          }
        }

        .anim-clinic-intro {
          animation: slideClinicInLeftOutRight 3.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform, opacity;
        }

        .anim-notes-intro {
          animation: slideNotesInRightOutLeft 3.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform, opacity;
        }
      `}</style>

      {/* Skip button in top right corner */}
      <button
        type="button"
        onClick={handleComplete}
        className="absolute top-5 right-6 text-xs text-teal-100/70 hover:text-white px-3 py-1.5 rounded-full bg-teal-800/40 hover:bg-teal-800/80 transition-colors z-10 flex items-center gap-1 font-medium tracking-wide"
      >
        <span>Skip</span>
        <span>&rarr;</span>
      </button>

      {/* Centered Logo Lockup */}
      <div className="flex flex-col items-center justify-center text-center px-4">
        <div className="anim-clinic-intro text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none text-white drop-shadow-sm font-sans">
          Clinic
        </div>
        <div className="anim-notes-intro text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none text-teal-100 drop-shadow-sm font-sans mt-1">
          Notes
        </div>
      </div>
    </div>
  );
}

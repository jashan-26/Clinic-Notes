import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  ClipboardList,
  Settings,
  LogOut,
  ShieldCheck,
  Lock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/doctors', label: 'Doctors Directory', icon: Users },
    { to: '/admin/pending', label: 'Pending Approvals', icon: UserCheck },
    { to: '/admin/hospitals', label: 'Hospitals & Branches', icon: Building2 },
    { to: '/admin/audit', label: 'Global Audit Trail', icon: ClipboardList },
    { to: '/admin/settings', label: 'Admin Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Privacy & Architecture Banner (MANDATORY REQUIREMENT) */}
      <div className="bg-teal-900 text-teal-100 px-4 py-2 text-xs flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-2">
          <Lock className="w-3.5 h-3.5 text-teal-300 flex-shrink-0" />
          <span>
            <strong>Zero-Knowledge Architecture:</strong> Admins can see account metadata only. Patient notes and consultations are end-to-end encrypted on client devices and unreadable to admins.
          </span>
        </div>
        <span className="hidden md:inline-block text-[11px] text-teal-300 font-mono">
          E2EE • AES-GCM 256-bit
        </span>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex">
          <div>
            {/* Sidebar Brand */}
            <div className="p-5 border-b border-slate-100 flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-800 text-sm block">ClinicNotes Admin</span>
                <span className="text-[10px] text-teal-700 uppercase font-semibold tracking-wider">
                  Governance Portal
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-teal-50 text-teal-800 font-semibold border border-teal-200'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User Profile Card & Sign Out */}
          <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50/50">
            <div className="p-2 bg-white border border-slate-200 rounded-lg">
              <div className="text-xs font-semibold text-slate-800 truncate">
                {profile?.full_name && profile.full_name !== 'Doctor User'
                  ? profile.full_name
                  : (profile?.email?.includes('admin') ? 'Hospital Administrator' : (profile?.full_name || 'Administrator'))}
              </div>
              <div className="text-[11px] text-slate-500 truncate">{profile?.email}</div>
              <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                Administrator
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Mobile Navigation Header */}
          <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between md:hidden">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-teal-700" />
              <span className="font-bold text-slate-800 text-sm">ClinicNotes Admin</span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

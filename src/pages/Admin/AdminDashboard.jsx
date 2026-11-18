import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  ShieldX,
  FileText,
  MessageSquare,
  TrendingUp,
  Building2,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { INITIAL_DEMO_USERS, INITIAL_HOSPITALS, isSupabaseConfigured, supabase } from '../../supabase/client';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    pendingDoctors: 0,
    approvedDoctors: 0,
    suspendedDoctors: 0,
    totalNotes: 28,
    totalConsultations: 42,
    notesThisWeek: 16,
  });

  const [consultationsData, setConsultationsData] = useState([]);
  const [doctorsByStateData, setDoctorsByStateData] = useState([]);
  const [doctorsByHospitalData, setDoctorsByHospitalData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    let profiles = [];
    let hospitals = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: profs } = await supabase.from('profiles').select('*');
        const { data: hosps } = await supabase.from('hospitals').select('*');
        if (profs) profiles = profs;
        if (hosps) hospitals = hosps;
      } catch (e) {
        console.warn('Could not load from Supabase, using local fallback:', e);
      }
    }

    if (profiles.length === 0) {
      const stored = localStorage.getItem('clinicnotes_demo_profiles');
      profiles = stored ? JSON.parse(stored) : INITIAL_DEMO_USERS;
    }

    if (hospitals.length === 0) {
      const storedHosps = localStorage.getItem('clinicnotes_demo_hospitals');
      hospitals = storedHosps ? JSON.parse(storedHosps) : INITIAL_HOSPITALS;
    }

    const doctors = profiles.filter((p) => p.role === 'doctor');
    const pending = doctors.filter((p) => p.status === 'pending').length;
    const approved = doctors.filter((p) => p.status === 'approved').length;
    const suspended = doctors.filter((p) => p.status === 'suspended').length;

    setStats({
      totalDoctors: doctors.length,
      pendingDoctors: pending,
      approvedDoctors: approved,
      suspendedDoctors: suspended,
      totalNotes: 28 + approved * 3,
      totalConsultations: 42 + approved * 4,
      notesThisWeek: 16 + approved,
    });

    // 14-day consultations trend data
    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      // Realistic simulation curve
      const count = Math.floor(4 + Math.sin(i) * 3 + Math.random() * 4);
      last14Days.push({ date: dateStr, consultations: count });
    }
    setConsultationsData(last14Days);

    // Group doctors by state
    const stateCounts = {};
    doctors.forEach((d) => {
      const st = d.state || 'Delhi';
      stateCounts[st] = (stateCounts[st] || 0) + 1;
    });
    const stateChart = Object.entries(stateCounts).map(([state, count]) => ({
      state,
      doctors: count,
    }));
    setDoctorsByStateData(stateChart);

    // Group doctors by hospital
    const hospCounts = {};
    doctors.forEach((d) => {
      const hName = d.branch || d.hospital_name || 'AIIMS New Delhi';
      const shortName = hName.split(',')[0].replace('Hospital', '').trim();
      hospCounts[shortName] = (hospCounts[shortName] || 0) + 1;
    });
    const hospChart = Object.entries(hospCounts).map(([hospital, count]) => ({
      hospital: hospital.slice(0, 14),
      doctors: count,
    }));
    setDoctorsByHospitalData(hospChart);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Hospital Administration Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time governance, credential verification & outpatient teleconsultation metrics
        </p>
      </div>

      {/* 7 Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Total Doctors */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Doctors</span>
            <Users className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalDoctors}</div>
          <p className="text-[11px] text-slate-400">Registered across network</p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{stats.pendingDoctors}</div>
          <p className="text-[11px] text-amber-700">Awaiting MCI validation</p>
        </div>

        {/* Approved Doctors */}
        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span>Active Clinicians</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-950">{stats.approvedDoctors}</div>
          <p className="text-[11px] text-emerald-700">Authorized & approved</p>
        </div>

        {/* Suspended Doctors */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Suspended</span>
            <ShieldX className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.suspendedDoctors}</div>
          <p className="text-[11px] text-slate-400">Temporarily deactivated</p>
        </div>

        {/* Encrypted Notes */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Encrypted Notes</span>
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalNotes}</div>
          <p className="text-[11px] text-slate-400">AES-GCM zero-knowledge</p>
        </div>

        {/* Total Consultations */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Consultations</span>
            <MessageSquare className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalConsultations}</div>
          <p className="text-[11px] text-slate-400">Concluded outpatient calls</p>
        </div>

        {/* Notes This Week */}
        <div className="bg-white border border-teal-200 bg-teal-50/20 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-teal-800 text-xs font-semibold">
            <span>Activity This Week</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-950">+{stats.notesThisWeek}</div>
          <p className="text-[11px] text-teal-700">Encounters documented</p>
        </div>
      </div>

      {/* Recharts Data Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Consultations per day (Last 14 days) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Outpatient Consultations Trend</h3>
              <p className="text-xs text-slate-500">Daily telemedicine & clinic encounter volume (Last 14 Days)</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Aggregated metadata
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consultationsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F766E" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="consultations"
                  stroke="#0F766E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#tealGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Doctors by State */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Clinicians by State</h3>
            <p className="text-xs text-slate-500">Geographic distribution</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doctorsByStateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="state" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="doctors" fill="#14B8A6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

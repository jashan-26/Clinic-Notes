import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { INITIAL_HOSPITALS, isSupabaseConfigured, supabase } from '../supabase/client';
import { Activity, Lock, Mail, User, Stethoscope, Building2, AlertCircle, Check, ShieldCheck } from 'lucide-react';

export function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [medRegNo, setMedRegNo] = useState('');
  const [specialization, setSpecialization] = useState('Internal Medicine');
  const [department, setDepartment] = useState('Dept of Internal Medicine');

  // Cascading Location & Hospital Selection
  const [hospitalsList, setHospitalsList] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [customHospital, setCustomHospital] = useState(false);
  const [customHospitalName, setCustomHospitalName] = useState('');

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Load hospitals from Supabase or Initial Seeds
  useEffect(() => {
    async function loadHospitals() {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('hospitals').select('*');
        if (data && data.length > 0) {
          setHospitalsList(data);
          return;
        }
      }
      // Local fallback
      const stored = localStorage.getItem('clinicnotes_demo_hospitals');
      setHospitalsList(stored ? JSON.parse(stored) : INITIAL_HOSPITALS);
    }
    loadHospitals();
  }, []);

  // Compute unique states from loaded hospitals
  const uniqueStates = Array.from(new Set(hospitalsList.map((h) => h.state))).sort();

  // Filter hospitals based on selected state
  const filteredHospitals = selectedState
    ? hospitalsList.filter((h) => h.state === selectedState)
    : [];

  // Get branches for selected hospital
  const selectedHospitalObj = hospitalsList.find((h) => h.id === selectedHospitalId);
  const availableBranches = selectedHospitalObj ? [selectedHospitalObj.branch] : [];

  // Reset hospital/branch when state changes
  const handleStateChange = (newState) => {
    setSelectedState(newState);
    setSelectedHospitalId('');
    setSelectedBranch('');
  };

  const handleHospitalChange = (newHospId) => {
    setSelectedHospitalId(newHospId);
    const obj = hospitalsList.find((h) => h.id === newHospId);
    if (obj) {
      setSelectedBranch(obj.branch);
    } else {
      setSelectedBranch('');
    }
  };

  // Password Strength Meter calculation
  const getPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 100, label: 'Strong (Hospital Grade)', color: 'bg-emerald-600' };
      default:
        return { score: 15, label: 'Too short', color: 'bg-red-400' };
    }
  };

  const passStrength = getPasswordStrength(password);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    if (!acceptTerms) {
      setError('You must accept the HIPAA & DPDP clinical privacy terms.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const hospitalName = customHospital
        ? customHospitalName
        : selectedHospitalObj?.name || 'Affiliated Clinic';

      await signUp({
        email,
        password,
        full_name: fullName,
        medical_registration_no: medRegNo,
        specialization,
        department,
        hospital_id: customHospital ? null : selectedHospitalId || null,
        branch: customHospital ? 'Primary Centre' : selectedBranch,
        state: selectedState || 'National',
        hospital_name: hospitalName,
      });

      // Redirect to pending verification screen
      navigate('/pending');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-700 text-white shadow-sm mb-3">
          <Activity className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Doctor Clinical Registration
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Register with ClinicNotes Hospital & Outpatient Network
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4 text-xs">
            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doctor Full Name</label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Rajesh Sharma"
                    className="block w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Email</label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="r.sharma@hospital.org"
                    className="block w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>
            </div>

            {/* Password & Strength Meter */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Create Password</label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters, uppercase, number, symbol"
                  className="block w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600"
                />
              </div>

              {/* Strength Progress Bar */}
              {password && (
                <div className="mt-1.5 space-y-1">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passStrength.color} transition-all duration-300`}
                      style={{ width: `${passStrength.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>Password Strength:</span>
                    <span className="font-semibold">{passStrength.label}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Medical Registration & Specialization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Medical Registration Number (MCI / SMC)
                </label>
                <input
                  type="text"
                  required
                  value={medRegNo}
                  onChange={(e) => setMedRegNo(e.target.value)}
                  placeholder="e.g. MCI-2015-44912"
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Specialization</label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-teal-600"
                >
                  <option value="Internal Medicine">Internal Medicine (General OPD)</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pulmonology">Pulmonology & Respiratory</option>
                  <option value="Pediatrics">Pediatrics & Neonatal Care</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics & Joint Care</option>
                  <option value="Emergency Medicine">Emergency Medicine</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hospital Department / Ward</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Dept of Internal Medicine, OPD Block 2"
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Cascading Location & Hospital Selector */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-teal-700" /> Hospital Affiliation
              </span>

              {!customHospital ? (
                <>
                  {/* Step 1: State Dropdown */}
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">1. Select State</label>
                    <select
                      value={selectedState}
                      onChange={(e) => handleStateChange(e.target.value)}
                      required={!customHospital}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-teal-600 text-xs"
                    >
                      <option value="">-- Choose Indian State --</option>
                      {uniqueStates.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Hospital Dropdown (Filtered by State) */}
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">2. Select Hospital</label>
                    <select
                      value={selectedHospitalId}
                      onChange={(e) => handleHospitalChange(e.target.value)}
                      disabled={!selectedState}
                      required={!customHospital}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-teal-600 text-xs disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {selectedState ? '-- Choose Hospital --' : 'Select state first'}
                      </option>
                      {filteredHospitals.map((hosp) => (
                        <option key={hosp.id} value={hosp.id}>
                          {hosp.name} ({hosp.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 3: Branch Dropdown (Filtered by Hospital) */}
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">3. Branch / Campus</label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      disabled={!selectedHospitalId}
                      required={!customHospital}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-teal-600 text-xs disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {selectedHospitalId ? '-- Choose Branch --' : 'Select hospital first'}
                      </option>
                      {availableBranches.map((br) => (
                        <option key={br} value={br}>
                          {br}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                /* Custom Hospital Name entry */
                <div className="space-y-1">
                  <label className="block font-medium text-slate-700">Enter Hospital / Clinic Name</label>
                  <input
                    type="text"
                    required={customHospital}
                    value={customHospitalName}
                    onChange={(e) => setCustomHospitalName(e.target.value)}
                    placeholder="e.g. City Health Clinic, Indiranagar"
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-teal-600"
                  />
                  <p className="text-[10px] text-slate-500">
                    Your unlisted hospital will be submitted for verification by the network administrator.
                  </p>
                </div>
              )}

              {/* Not listed toggle */}
              <div className="pt-1">
                <label className="inline-flex items-center space-x-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={customHospital}
                    onChange={(e) => setCustomHospital(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>My hospital or clinic is not listed above</span>
                </label>
              </div>
            </div>

            {/* Terms and Privacy Checkbox */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <label className="inline-flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 mt-0.5"
                />
                <span className="text-slate-700 leading-normal">
                  I certify that I am a licensed healthcare professional. I understand patient records are end-to-end encrypted with my doctor passphrase and adhere to the Digital Personal Data Protection (DPDP) Act.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2.5 px-4 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors ${
                loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-teal-700 hover:bg-teal-800'
              }`}
            >
              {loading ? 'Submitting Registration...' : 'Submit Doctor Registration'}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-600">
            Already registered with the network?{' '}
            <Link to="/login" className="font-semibold text-teal-700 hover:underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

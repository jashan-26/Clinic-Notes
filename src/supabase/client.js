import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// Mock storage for high-fidelity demo mode when Supabase is not yet configured
const DEMO_STORAGE_KEY_PROFILES = 'clinicnotes_demo_profiles';
const DEMO_STORAGE_KEY_HOSPITALS = 'clinicnotes_demo_hospitals';
const DEMO_STORAGE_KEY_SESSION = 'clinicnotes_demo_session';

export const INITIAL_HOSPITALS = [
  { id: 'hosp-1', name: 'AIIMS New Delhi', branch: 'Main Campus, Ansari Nagar', city: 'New Delhi', state: 'Delhi' },
  { id: 'hosp-2', name: 'Tata Memorial Hospital', branch: 'Advanced Centre, Parel', city: 'Mumbai', state: 'Maharashtra' },
  { id: 'hosp-3', name: 'Manipal Hospital', branch: 'Old Airport Road', city: 'Bengaluru', state: 'Karnataka' },
  { id: 'hosp-4', name: 'Apollo Hospitals', branch: 'Main Centre, Greams Road', city: 'Chennai', state: 'Tamil Nadu' },
  { id: 'hosp-5', name: 'Medanta The Medicity', branch: 'Super Specialty Wing, Sector 7', city: 'Lucknow', state: 'Uttar Pradesh' },
  { id: 'hosp-6', name: 'Zydus Hospital', branch: 'Zydus Drive, Thaltej', city: 'Ahmedabad', state: 'Gujarat' },
  { id: 'hosp-7', name: 'Fortis Hospital', branch: 'EM Bypass, Anandapur', city: 'Kolkata', state: 'West Bengal' },
  { id: 'hosp-8', name: 'KIMS Hospital', branch: 'Minister Road, Secunderabad', city: 'Hyderabad', state: 'Telangana' },
];

export const INITIAL_DEMO_USERS = [
  {
    id: 'user-admin-1',
    email: 'admin@clinicnotes.hospital',
    password: 'Admin@123456',
    full_name: 'Dr. Vikram Malhotra',
    role: 'admin',
    medical_registration_no: 'MCI-1994-0821',
    specialization: 'Healthcare Administration',
    department: 'Medical Directorate',
    hospital_id: 'hosp-1',
    branch: 'Main Campus, Ansari Nagar',
    state: 'Delhi',
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'user-doc-1',
    email: 'doctor@clinicnotes.hospital',
    password: 'Doctor@123456',
    full_name: 'Dr. A. Sharma',
    role: 'doctor',
    medical_registration_no: 'MCI-2015-44912',
    specialization: 'Internal Medicine',
    department: 'Dept of Internal Medicine',
    hospital_id: 'hosp-1',
    branch: 'Main Campus, Ansari Nagar',
    state: 'Delhi',
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'user-doc-2',
    email: 'priya.nair@manipal.org',
    password: 'Doctor@123456',
    full_name: 'Dr. Priya Nair',
    role: 'doctor',
    medical_registration_no: 'KMC-2018-8831',
    specialization: 'Pulmonology',
    department: 'Respiratory Care',
    hospital_id: 'hosp-3',
    branch: 'Old Airport Road',
    state: 'Karnataka',
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'user-doc-3',
    email: 'karan.mehta@apollo.com',
    password: 'Doctor@123456',
    full_name: 'Dr. Karan Mehta',
    role: 'doctor',
    medical_registration_no: 'TMC-2020-5521',
    specialization: 'Cardiology',
    department: 'Cardiology OPD',
    hospital_id: 'hosp-4',
    branch: 'Main Centre, Greams Road',
    state: 'Tamil Nadu',
    status: 'pending',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'user-doc-4',
    email: 'sunita.deshmukh@tatamemorial.org',
    password: 'Doctor@123456',
    full_name: 'Dr. Sunita Deshmukh',
    role: 'doctor',
    medical_registration_no: 'MMC-2012-7719',
    specialization: 'Oncology',
    department: 'Medical Oncology',
    hospital_id: 'hosp-2',
    branch: 'Advanced Centre, Parel',
    state: 'Maharashtra',
    status: 'pending',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'user-doc-5',
    email: 'rahul.verma@medanta.org',
    password: 'Doctor@123456',
    full_name: 'Dr. Rahul Verma',
    role: 'doctor',
    medical_registration_no: 'UPMC-2016-3392',
    specialization: 'Neurology',
    department: 'Neurology & Stroke',
    hospital_id: 'hosp-5',
    branch: 'Super Specialty Wing, Sector 7',
    state: 'Uttar Pradesh',
    status: 'suspended',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

// Initialize local storage seeds if absent
if (!localStorage.getItem(DEMO_STORAGE_KEY_HOSPITALS)) {
  localStorage.setItem(DEMO_STORAGE_KEY_HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
}
if (!localStorage.getItem(DEMO_STORAGE_KEY_PROFILES)) {
  localStorage.setItem(DEMO_STORAGE_KEY_PROFILES, JSON.stringify(INITIAL_DEMO_USERS));
}

/**
 * Real Supabase Client when configured, otherwise transparent demo client
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

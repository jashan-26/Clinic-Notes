import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, MapPin, Users, X, Check } from 'lucide-react';
import { INITIAL_HOSPITALS, isSupabaseConfigured, supabase } from '../../supabase/client';
import { logAuditEvent } from '../../components/Common/AuditLogModal';

export function HospitalsManager() {
  const [hospitals, setHospitals] = useState([]);
  const [doctorCounts, setDoctorCounts] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);

  const [form, setForm] = useState({
    name: '',
    branch: '',
    city: '',
    state: 'Delhi',
  });

  useEffect(() => {
    loadHospitalsAndCounts();
  }, []);

  const loadHospitalsAndCounts = async () => {
    let hosps = [];
    let profs = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: hData } = await supabase.from('hospitals').select('*');
        const { data: pData } = await supabase.from('profiles').select('hospital_id, branch');
        if (hData) hosps = hData;
        if (pData) profs = pData;
      } catch (e) {
        console.warn('Error fetching hospitals from Supabase:', e);
      }
    }

    if (hosps.length === 0) {
      const stored = localStorage.getItem('clinicnotes_demo_hospitals');
      hosps = stored ? JSON.parse(stored) : INITIAL_HOSPITALS;
    }
    if (profs.length === 0) {
      const storedP = localStorage.getItem('clinicnotes_demo_profiles');
      profs = storedP ? JSON.parse(storedP) : [];
    }

    setHospitals(hosps);

    // Compute doctor counts per hospital/branch
    const counts = {};
    profs.forEach((p) => {
      const key = p.hospital_id || p.branch;
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    setDoctorCounts(counts);
  };

  const handleOpenAdd = () => {
    setEditingHospital(null);
    setForm({ name: '', branch: '', city: '', state: 'Delhi' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (hosp) => {
    setEditingHospital(hosp);
    setForm({
      name: hosp.name,
      branch: hosp.branch,
      city: hosp.city,
      state: hosp.state,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSupabaseConfigured && supabase) {
      if (editingHospital) {
        await supabase.from('hospitals').update(form).eq('id', editingHospital.id);
        logAuditEvent('HOSPITAL_UPDATED', `Updated hospital ${form.name}`, 'Administrator');
      } else {
        await supabase.from('hospitals').insert(form);
        logAuditEvent('HOSPITAL_ADDED', `Added hospital ${form.name}`, 'Administrator');
      }
    } else {
      const stored = JSON.parse(localStorage.getItem('clinicnotes_demo_hospitals') || '[]');
      if (editingHospital) {
        const updated = stored.map((h) =>
          h.id === editingHospital.id ? { ...h, ...form } : h
        );
        localStorage.setItem('clinicnotes_demo_hospitals', JSON.stringify(updated));
      } else {
        const newHosp = { id: 'hosp-' + Date.now(), ...form };
        stored.push(newHosp);
        localStorage.setItem('clinicnotes_demo_hospitals', JSON.stringify(stored));
      }
      logAuditEvent('HOSPITAL_SAVED_LOCAL', `Saved hospital ${form.name}`, 'Administrator');
    }

    setIsModalOpen(false);
    await loadHospitalsAndCounts();
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete hospital "${name}" and all its branch mappings?`)) {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('hospitals').delete().eq('id', id);
      } else {
        const stored = JSON.parse(localStorage.getItem('clinicnotes_demo_hospitals') || '[]');
        const updated = stored.filter((h) => h.id !== id);
        localStorage.setItem('clinicnotes_demo_hospitals', JSON.stringify(updated));
      }
      logAuditEvent('HOSPITAL_DELETED', `Deleted hospital ${name}`, 'Administrator');
      await loadHospitalsAndCounts();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hospital & Branch Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure partner hospital centers, outpatient clinics, and branch network
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hospital Branch</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hospitals.map((hosp) => {
          const docCount = doctorCounts[hosp.id] || doctorCounts[hosp.branch] || 1;
          return (
            <div
              key={hosp.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{hosp.name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {hosp.state}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{hosp.branch}, {hosp.city}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 flex items-center gap-1 font-medium text-[11px]">
                  <Users className="w-3.5 h-3.5 text-teal-700" />
                  <span>{docCount} Registered Clinicians</span>
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(hosp)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                    title="Edit hospital branch"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(hosp.id, hosp.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                    title="Delete branch"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingHospital ? 'Edit Hospital Branch' : 'Add New Hospital Branch'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hospital / Medical Center Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Apollo Super Specialty Hospital"
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Branch / Campus Name</label>
                <input
                  type="text"
                  required
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  placeholder="e.g. Main Centre, Greams Road"
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Chennai"
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="Tamil Nadu"
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-lg"
                >
                  Save Hospital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

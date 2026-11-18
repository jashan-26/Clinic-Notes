import React, { useState, useEffect } from 'react';
import {
  History,
  Lock,
  Unlock,
  Trash2,
  ChevronRight,
  Shield,
  FileText,
  Key,
  X,
  AlertTriangle,
  Cloud,
} from 'lucide-react';
import { NotesCrypto } from '../../utils/crypto';
import { isSupabaseConfigured, supabase } from '../../supabase/client';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent } from '../Common/AuditLogModal';

export function NotesHistorySidebar({
  currentTranscript,
  currentSummary,
  currentSpans,
  onLoadNote,
}) {
  const { user } = useAuth();
  const [savedNotes, setSavedNotes] = useState([]);
  const [passphrase, setPassphrase] = useState('');
  const [useEncryption, setUseEncryption] = useState(true); // Default encrypted
  const [unlockModalNote, setUnlockModalNote] = useState(null);
  const [unlockPassphrase, setUnlockPassphrase] = useState('');
  const [unlockError, setUnlockError] = useState(null);

  useEffect(() => {
    loadSavedNotes();
  }, [user]);

  const loadSavedNotes = async () => {
    let notes = [];
    if (isSupabaseConfigured && supabase && user) {
      try {
        const { data, error } = await supabase
          .from('doctor_notes')
          .select('id, title, encrypted_payload, iv, summary_meta, created_at')
          .order('created_at', { ascending: false });

        if (data) {
          notes = data.map((n) => ({
            id: n.id,
            title: n.title,
            patientName: n.summary_meta?.patientName || n.title,
            savedAt: n.created_at,
            encrypted: true,
            iv: n.iv,
            payload: n.encrypted_payload,
          }));
        }
      } catch (e) {
        console.warn('Error reading notes from Supabase:', e);
      }
    }

    if (notes.length === 0) {
      const stored = localStorage.getItem('clinicnotes_saved_notes');
      if (stored) {
        notes = JSON.parse(stored);
      }
    }

    setSavedNotes(notes);
  };

  const handleSaveCurrentNote = async () => {
    if (!currentTranscript && !currentSummary) {
      alert('Cannot save an empty note.');
      return;
    }

    const title =
      currentSummary?.patient?.name ||
      currentTranscript.slice(0, 30).trim() ||
      'Clinical Note';

    const notePayload = {
      transcript: currentTranscript,
      summary: currentSummary,
      spans: currentSpans,
      savedAt: new Date().toISOString(),
      patientName: currentSummary?.patient?.name || 'Patient',
    };

    try {
      let storageRecord;
      if (useEncryption && passphrase) {
        const encrypted = await NotesCrypto.encrypt(JSON.stringify(notePayload), passphrase);

        if (isSupabaseConfigured && supabase && user) {
          // Save directly to Supabase doctor_notes
          const { data, error } = await supabase
            .from('doctor_notes')
            .insert({
              doctor_id: user.id,
              title,
              encrypted_payload: encrypted.payload,
              iv: encrypted.iv,
              summary_meta: {
                patientName: notePayload.patientName,
                language: 'en-IN',
                span_count: currentSpans.length,
              },
            })
            .select()
            .single();

          if (error) throw error;
        }

        storageRecord = {
          id: 'note-' + Date.now(),
          title,
          patientName: notePayload.patientName,
          savedAt: notePayload.savedAt,
          encrypted: true,
          iv: encrypted.iv,
          payload: encrypted.payload,
        };
      } else {
        storageRecord = {
          id: 'note-' + Date.now(),
          title,
          patientName: notePayload.patientName,
          savedAt: notePayload.savedAt,
          encrypted: false,
          payload: notePayload,
        };
      }

      // Maintain local cache as offline fallback
      const updated = [storageRecord, ...savedNotes];
      localStorage.setItem('clinicnotes_saved_notes', JSON.stringify(updated));
      setSavedNotes(updated);

      logAuditEvent('NOTE_SAVED', `Saved clinical note for ${notePayload.patientName}`);
      alert('Clinical note successfully encrypted & saved.');
      await loadSavedNotes();
    } catch (err) {
      alert('Failed to save note: ' + err.message);
    }
  };

  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved note permanently?')) {
      if (isSupabaseConfigured && supabase && user) {
        await supabase.from('doctor_notes').delete().eq('id', id);
      }
      const updated = savedNotes.filter((n) => n.id !== id);
      localStorage.setItem('clinicnotes_saved_notes', JSON.stringify(updated));
      setSavedNotes(updated);
      logAuditEvent('NOTE_DELETED', `Deleted note ${id}`);
    }
  };

  const handleNoteClick = async (note) => {
    if (note.encrypted) {
      setUnlockModalNote(note);
      setUnlockPassphrase('');
      setUnlockError(null);
    } else {
      onLoadNote(note.payload);
      logAuditEvent('NOTE_REOPENED', `Reopened note for ${note.patientName}`);
    }
  };

  const handleUnlockAndLoad = async () => {
    if (!unlockModalNote || !unlockPassphrase) return;
    try {
      const decryptedStr = await NotesCrypto.decrypt(unlockModalNote, unlockPassphrase);
      const noteData = JSON.parse(decryptedStr);
      onLoadNote(noteData);
      logAuditEvent('ENCRYPTED_NOTE_UNLOCKED', `Decrypted note for ${unlockModalNote.patientName}`);
      setUnlockModalNote(null);
    } catch (err) {
      setUnlockError('Incorrect passphrase. Unable to decrypt note.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-teal-700" />
          <h3 className="font-semibold text-slate-800 text-sm">Patient Encounters History</h3>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
          {savedNotes.length} saved
        </span>
      </div>

      {/* Encryption Settings & Passphrase */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-1.5 font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={useEncryption}
              onChange={(e) => setUseEncryption(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="flex items-center gap-1 font-semibold text-teal-900">
              <Shield className="w-3.5 h-3.5 text-teal-700" /> AES-GCM Encrypted Notes
            </span>
          </label>
        </div>

        {useEncryption && (
          <div className="space-y-1.5 pt-1 animate-in fade-in">
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Doctor encryption passphrase..."
              className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-800 leading-normal">
              <strong>Zero-Knowledge:</strong> Stored encrypted. Even the admin cannot read your notes.
            </div>
            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 leading-normal flex items-start gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>Warning: A forgotten passphrase means the notes cannot be recovered.</span>
            </div>
          </div>
        )}
      </div>

      {/* History Items List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {savedNotes.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
            No saved notes yet. Click "Save" on any summarized clinical note.
          </div>
        ) : (
          savedNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleNoteClick(note)}
              className="p-3 rounded-lg border border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50/30 transition-all cursor-pointer flex items-center justify-between text-xs group"
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 flex-shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">{note.title}</span>
                  {note.encrypted && (
                    <Lock className="w-3 h-3 text-amber-600 flex-shrink-0" title="AES-GCM Encrypted" />
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {new Date(note.savedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => handleDeleteNote(note.id, e)}
                  className="p-1 text-slate-300 hover:text-red-600 rounded transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Unlock Encrypted Note Modal */}
      {unlockModalNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <h4 className="font-semibold text-slate-800 text-sm">Decrypt Protected Note</h4>
              </div>
              <button onClick={() => setUnlockModalNote(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              This note for <strong>{unlockModalNote.patientName}</strong> is encrypted with AES-GCM. Please enter your doctor passphrase to decrypt.
            </p>

            <input
              type="password"
              value={unlockPassphrase}
              onChange={(e) => setUnlockPassphrase(e.target.value)}
              placeholder="Enter passphrase..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
              autoFocus
            />

            {unlockError && <p className="text-xs text-red-600 font-medium">{unlockError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setUnlockModalNote(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlockAndLoad}
                className="px-4 py-1.5 text-xs bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-lg"
              >
                Unlock & Load
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

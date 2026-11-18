-- ==============================================================================
-- CLINICNOTES — SUPABASE POSTGRES SCHEMA & SECURITY POLICIES
-- Multi-Tenant Clinical Documentation Suite with End-to-End Encryption
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. HOSPITALS & BRANCHES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.hospitals (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    branch text not null,
    city text not null,
    state text not null,
    created_at timestamptz not null default now()
);

-- Index for cascading State -> Hospital -> Branch queries
create index if not exists idx_hospitals_state on public.hospitals(state);
create index if not exists idx_hospitals_name on public.hospitals(name);

-- ------------------------------------------------------------------------------
-- 2. PROFILES TABLE (Linked 1:1 with auth.users)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    email text not null,
    role text not null check (role in ('doctor', 'admin')) default 'doctor',
    medical_registration_no text,
    specialization text,
    department text,
    hospital_id uuid references public.hospitals(id) on delete set null,
    branch text,
    state text,
    status text not null check (status in ('pending', 'approved', 'rejected', 'suspended')) default 'pending',
    rejection_reason text,
    created_at timestamptz not null default now(),
    last_login_at timestamptz
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_hospital on public.profiles(hospital_id);

-- ------------------------------------------------------------------------------
-- 3. DOCTOR NOTES TABLE (Zero-Knowledge Ciphertext Stored)
-- ------------------------------------------------------------------------------
create table if not exists public.doctor_notes (
    id uuid primary key default gen_random_uuid(),
    doctor_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    encrypted_payload text not null, -- AES-GCM 256-bit ciphertext
    iv text not null,               -- Initialization Vector
    summary_meta jsonb default '{}'::jsonb, -- Non-sensitive: language, word_count, span_counts
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_doctor_notes_doctor on public.doctor_notes(doctor_id);
create index if not exists idx_doctor_notes_created on public.doctor_notes(created_at desc);

-- ------------------------------------------------------------------------------
-- 4. CONSULTATIONS TABLE (Zero-Knowledge Ciphertext Stored)
-- ------------------------------------------------------------------------------
create table if not exists public.consultations (
    id uuid primary key default gen_random_uuid(),
    doctor_id uuid not null references public.profiles(id) on delete cascade,
    encrypted_payload text not null, -- AES-GCM 256-bit ciphertext
    iv text not null,
    duration_seconds integer default 0,
    medicine_count integer default 0,
    consent_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists idx_consultations_doctor on public.consultations(doctor_id);
create index if not exists idx_consultations_created on public.consultations(created_at desc);

-- ------------------------------------------------------------------------------
-- 5. AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid references public.profiles(id) on delete set null,
    actor_role text not null,
    action text not null,
    target_type text,
    target_id text,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_action on public.audit_logs(action);

-- ------------------------------------------------------------------------------
-- 6. LOGIN EVENTS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.login_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    event text not null check (event in ('login', 'logout', 'failed_login')),
    user_agent text,
    created_at timestamptz not null default now()
);

create index if not exists idx_login_events_user on public.login_events(user_id);
create index if not exists idx_login_events_created on public.login_events(created_at desc);

-- ------------------------------------------------------------------------------
-- 7. HELPER FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- Helper to check if current authenticated user has admin role
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
end;
$$ language plpgsql security definer;

-- Trigger: Automatically create public.profiles upon auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
    _hospital_id uuid;
begin
    -- Extract hospital_id if provided as valid uuid
    begin
        _hospital_id := (new.raw_user_meta_data->>'hospital_id')::uuid;
    exception when others then
        _hospital_id := null;
    end;

    insert into public.profiles (
        id,
        full_name,
        email,
        role,
        medical_registration_no,
        specialization,
        department,
        hospital_id,
        branch,
        state,
        status,
        created_at
    ) values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', 'Doctor User'),
        new.email,
        coalesce(new.raw_user_meta_data->>'role', 'doctor'),
        new.raw_user_meta_data->>'medical_registration_no',
        new.raw_user_meta_data->>'specialization',
        new.raw_user_meta_data->>'department',
        _hospital_id,
        new.raw_user_meta_data->>'branch',
        new.raw_user_meta_data->>'state',
        coalesce(new.raw_user_meta_data->>'status', 'pending'),
        now()
    );

    -- Log user signup in audit_logs
    insert into public.audit_logs (
        actor_id,
        actor_role,
        action,
        target_type,
        target_id,
        metadata
    ) values (
        new.id,
        coalesce(new.raw_user_meta_data->>'role', 'doctor'),
        'USER_SIGNUP',
        'profiles',
        new.id::text,
        jsonb_build_object(
            'email', new.email,
            'status', coalesce(new.raw_user_meta_data->>'status', 'pending'),
            'registration_no', new.raw_user_meta_data->>'medical_registration_no'
        )
    );

    return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if needed and re-bind
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Helper to promote an account to admin by email
create or replace function public.promote_user_to_admin(target_email text)
returns text as $$
declare
    _user_id uuid;
begin
    select id into _user_id from auth.users where email = target_email;
    if _user_id is null then
        return 'User with email ' || target_email || ' not found.';
    end if;

    update public.profiles
    set role = 'admin', status = 'approved'
    where id = _user_id;

    insert into public.audit_logs (actor_id, actor_role, action, target_type, target_id, metadata)
    values (_user_id, 'admin', 'PROMOTED_TO_ADMIN', 'profiles', _user_id::text, jsonb_build_object('email', target_email));

    return 'User ' || target_email || ' successfully promoted to admin (approved).';
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on ALL tables
alter table public.hospitals enable row level security;
alter table public.profiles enable row level security;
alter table public.doctor_notes enable row level security;
alter table public.consultations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.login_events enable row level security;

-- --- HOSPITALS POLICIES ---
-- Everyone (authenticated and anonymous) can read hospitals for dropdown selection
create policy "Allow anyone to read hospitals"
    on public.hospitals for select
    using (true);

-- Only Admins can insert, update, or delete hospitals
create policy "Allow admins to insert hospitals"
    on public.hospitals for insert
    with check (public.is_admin());

create policy "Allow admins to update hospitals"
    on public.hospitals for update
    using (public.is_admin());

create policy "Allow admins to delete hospitals"
    on public.hospitals for delete
    using (public.is_admin());

-- --- PROFILES POLICIES ---
-- Users can view their own profile, Admins can view all profiles
create policy "Users read own profile or admin reads all"
    on public.profiles for select
    using (auth.uid() = id or public.is_admin());

-- Users can update basic details on their own profile (cannot change role or status)
create policy "Users update own profile non-privileged fields"
    on public.profiles for update
    using (auth.uid() = id)
    with check (
        auth.uid() = id
        and role = (select p.role from public.profiles p where p.id = auth.uid())
        and status = (select p.status from public.profiles p where p.id = auth.uid())
    );

-- Admins can update any profile (e.g. approve, reject, suspend)
create policy "Admins can update any profile"
    on public.profiles for update
    using (public.is_admin());

-- --- DOCTOR NOTES POLICIES (PRIVACY BY DESIGN) ---
-- A doctor can read only their own notes
create policy "Doctor reads own notes"
    on public.doctor_notes for select
    using (doctor_id = auth.uid());

-- A doctor can insert their own notes
create policy "Doctor inserts own notes"
    on public.doctor_notes for insert
    with check (doctor_id = auth.uid());

-- A doctor can update their own notes
create policy "Doctor updates own notes"
    on public.doctor_notes for update
    using (doctor_id = auth.uid());

-- A doctor can delete their own notes
create policy "Doctor deletes own notes"
    on public.doctor_notes for delete
    using (doctor_id = auth.uid());

-- NOTE: Notice that NO policy grants Admin access to doctor_notes.
-- Admins CANNOT read note content. Privacy-by-design invariant enforced.

-- --- CONSULTATIONS POLICIES (PRIVACY BY DESIGN) ---
create policy "Doctor reads own consultations"
    on public.consultations for select
    using (doctor_id = auth.uid());

create policy "Doctor inserts own consultations"
    on public.consultations for insert
    with check (doctor_id = auth.uid());

create policy "Doctor updates own consultations"
    on public.consultations for update
    using (doctor_id = auth.uid());

create policy "Doctor deletes own consultations"
    on public.consultations for delete
    using (doctor_id = auth.uid());

-- NOTE: No policy grants Admin access to consultations ciphertext.

-- --- AUDIT LOGS POLICIES ---
-- Admins can view all audit logs; Doctors can view logs for their own actions
create policy "Admins view all audit logs or doctors view own"
    on public.audit_logs for select
    using (public.is_admin() or actor_id = auth.uid());

-- Authenticated users or service-role can insert audit log entries
create policy "Authenticated users insert audit log entries"
    on public.audit_logs for insert
    with check (auth.uid() is not null);

-- --- LOGIN EVENTS POLICIES ---
create policy "Admins view all login events or user views own"
    on public.login_events for select
    using (public.is_admin() or user_id = auth.uid());

create policy "Authenticated users insert login events"
    on public.login_events for insert
    with check (auth.uid() is not null);

-- ------------------------------------------------------------------------------
-- 9. SEED DATA: 8 HOSPITALS ACROSS INDIAN STATES
-- ------------------------------------------------------------------------------
insert into public.hospitals (name, branch, city, state)
values
    ('AIIMS New Delhi', 'Main Campus, Ansari Nagar', 'New Delhi', 'Delhi'),
    ('Tata Memorial Hospital', 'Advanced Centre, Parel', 'Mumbai', 'Maharashtra'),
    ('Manipal Hospital', 'Old Airport Road', 'Bengaluru', 'Karnataka'),
    ('Apollo Hospitals', 'Main Centre, Greams Road', 'Chennai', 'Tamil Nadu'),
    ('Medanta The Medicity', 'Super Specialty Wing, Sector 7', 'Lucknow', 'Uttar Pradesh'),
    ('Zydus Hospital', 'Zydus Drive, Thaltej', 'Ahmedabad', 'Gujarat'),
    ('Fortis Hospital', 'EM Bypass, Anandapur', 'Kolkata', 'West Bengal'),
    ('KIMS Hospital', 'Minister Road, Secunderabad', 'Hyderabad', 'Telangana')
on conflict do nothing;

-- ------------------------------------------------------------------------------
-- 10. INSTRUCTIONS TO CREATE FIRST ADMIN ACCOUNT
-- ------------------------------------------------------------------------------
-- 1. Sign up a user in Supabase Auth (or via ClinicNotes /signup page)
--    with email 'admin@clinicnotes.hospital' and your password.
-- 2. Execute the following SQL query in Supabase SQL Editor:
--    SELECT public.promote_user_to_admin('admin@clinicnotes.hospital');
-- ==============================================================================

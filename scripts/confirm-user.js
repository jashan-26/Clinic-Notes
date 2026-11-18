import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function confirmUser(targetEmail) {
  if (!targetEmail) {
    console.error('Usage: node scripts/confirm-user.js <email>');
    process.exit(1);
  }

  const email = targetEmail.trim().toLowerCase();
  console.log(`\n🔍 Looking up user in Supabase Auth: ${email}...`);

  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError.message);
    process.exit(1);
  }

  const user = usersData?.users?.find((u) => u.email?.toLowerCase() === email);
  if (!user) {
    console.error(`❌ User '${email}' not found in Supabase Auth (auth.users).`);
    console.log('Available users:');
    usersData?.users?.forEach((u) => console.log(` - ${u.email} (id: ${u.id})`));
    process.exit(1);
  }

  console.log(`Found Auth User: ID = ${user.id}`);
  console.log(`Current email_confirmed_at: ${user.email_confirmed_at || 'NULL (Unconfirmed)'}`);

  // Confirm email
  const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );

  if (updateError) {
    console.error('❌ Failed to confirm user email:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Email confirmed successfully in Supabase Auth!');

  // Check profiles table
  const { data: profile, error: profError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profError) {
    console.warn('Warning: Could not query profiles table:', profError.message);
  } else if (!profile) {
    console.log('⚠️ No profile row found in public.profiles. Creating profile row now...');
    const meta = user.user_metadata || {};
    const newProfile = {
      id: user.id,
      email: user.email,
      full_name: meta.full_name || (user.email.split('@')[0]),
      role: meta.role || 'doctor',
      status: 'approved',
      medical_registration_no: meta.medical_registration_no || 'REG-ACTIVE',
      specialization: meta.specialization || 'General Medicine',
      department: meta.department || 'Internal Medicine',
      state: meta.state || 'Delhi',
      branch: meta.branch || 'Main Campus',
      created_at: new Date().toISOString(),
    };
    const { error: insErr } = await supabaseAdmin.from('profiles').insert(newProfile);
    if (insErr) {
      console.error('Failed to insert profile row:', insErr.message);
    } else {
      console.log('✅ Profile row created with status: approved');
    }
  } else {
    console.log(`\n📋 Profile Record:`);
    console.log(` - Full Name:    ${profile.full_name}`);
    console.log(` - Role:         ${profile.role}`);
    console.log(` - Status:       ${profile.status}`);
    console.log(` - Registration: ${profile.medical_registration_no || 'N/A'}`);
    console.log(` - Department:   ${profile.department || 'N/A'}`);
    console.log(` - Hospital:     ${profile.branch || 'Affiliated'}, ${profile.state || 'N/A'}`);

    if (profile.status !== 'approved') {
      console.log(`\nPromoting profile status from '${profile.status}' to 'approved'...`);
      await supabaseAdmin.from('profiles').update({ status: 'approved' }).eq('id', user.id);
      console.log('✅ Profile status is now: approved');
    }
  }

  // Record audit log
  await supabaseAdmin.from('audit_logs').insert({
    actor_id: null,
    actor_role: 'admin_cli',
    action: 'ADMIN_MANUAL_USER_CONFIRM',
    target_type: 'auth.users',
    target_id: user.id,
    metadata: { email, confirmed: true, script: 'confirm-user.js' },
  });

  console.log(`\n🎉 User ${email} is fully verified and approved! You can now log in at http://localhost:5173/login.\n`);
}

confirmUser(process.argv[2]);

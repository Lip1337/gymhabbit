import { createClient } from "@supabase/supabase-js";

// Service-Role-Client: umgeht RLS. NUR serverseitig verwenden – der Key ist geheim
// und darf niemals an den Browser gelangen.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasServiceRole(): boolean {
  return Boolean(supabaseUrl && serviceRoleKey);
}

export function createAdminClient() {
  return createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Auth-only Supabase client — used exclusively for:
 *   - supabaseAuth.auth.signInWithPassword(...)
 *   - supabaseAuth.auth.getUser(token)
 *
 * Keeping auth operations on a SEPARATE client instance prevents
 * signInWithPassword() from setting an in-memory session that would
 * bleed into the DB client's PostgREST Authorization header on warm
 * Vercel instances, causing RLS to silently hide rows.
 *
 * All .from() database queries must use the main supabase client
 * (lib/supabase.js) which never has signInWithPassword called on it
 * and therefore always sends the service-role key to PostgREST.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  }
);

module.exports = supabaseAuth;

// lib/supabase.ts
import { createClient } from "@supabase/supabase-js"

// Create a single Supabase client for server-side operations
// This client uses the service role key and should ONLY be used on the server.
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in environment variables.")
  // In a real app, you might throw an error or handle this more gracefully
}

export const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
  auth: {
    persistSession: false, // No session persistence needed for server-side
  },
})

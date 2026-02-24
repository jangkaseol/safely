import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://rndhvjsgzrdmavwowpdr.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Please set it in your Vercel project settings or .env.local file.",
  )
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)

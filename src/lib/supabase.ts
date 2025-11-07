import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const supabase = createClient()

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type Tool = Database['public']['Tables']['tools']['Row']
export type Assignment = Database['public']['Tables']['assignments']['Row']
export type TimeEntry = Database['public']['Tables']['time_entries']['Row']
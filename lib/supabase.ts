import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type MaintenanceLog = {
  id?: string
  vehicle_id: string
  date: string
  type: string
  description: string
  technician: string
  mileage?: number
  next_service?: string
  created_at?: string
}

export type Driver = {
  id?: string
  name: string
  created_at?: string
}

export type InspectionLog = {
  id?: string
  vehicle_id: string
  date: string
  driver: string
  week: string
  notes?: string
  passed: boolean
  created_at?: string
}

import { createClient } from '@supabase/supabase-js'

// Tama na kukunin natin sa process.env kung nasa .env.local sila
// Pero kung gusto mo itong i-hardcode muna para sigurado:
const supabaseUrl = 'https://dkdvqywzvlfloqtvpiyh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrZHZxeXd6dmxmbG9xdHZwaXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNDYyNzQsImV4cCI6MjA4OTgyMjI3NH0.v2VKffRKrdd3pPqjpGe1ac2jCRkO-27_xkYwR18R_gk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
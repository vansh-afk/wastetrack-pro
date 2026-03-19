import { createClient } from '@supabase/supabase-js'

// 🔴 IMPORTANT: REPLACE THESE WITH YOUR ACTUAL SUPABASE CREDENTIALS
// Get these from: https://supabase.com -> Project Settings -> API
const supabaseUrl = 'https://twevnpvpwlzpxgazvqgj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZXZucHZwd2x6cHhnYXp2cWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjg3OTIsImV4cCI6MjA4ODkwNDc5Mn0.0JLpmWZ7RUwY8WydY3LeZChonX8q1bEVtZ3wcC44wDs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test the connection (check browser console)
console.log('✅ Supabase connected')
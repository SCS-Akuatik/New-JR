// src/js/config.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export sb agar bisa di-import oleh file JS lain
export const sb = createClient(supabaseUrl, supabaseKey);

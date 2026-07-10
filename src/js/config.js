// src/js/config.js
import { createClient } from '@supabase/supabase-js';

// Pakai kredensial langsung biar Vercel nggak bingung!
const supabaseUrl = "https://xwqdkvxythrewgjxhiru.supabase.co";
const supabaseKey = "sb_publishable_xfjCBEL-Hf77z-ssKaeZbg_-Or1pIML";

// Export sb agar bisa di-import oleh file JS lain
export const sb = createClient(supabaseUrl, supabaseKey);

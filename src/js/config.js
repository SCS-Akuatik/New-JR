// src/js/config.js

// PAKAI LINK CDN KHUSUS ESM BIAR VITE NGGAK NYARI NODE_MODULES!
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = "https://xwqdkvxythrewgjxhiru.supabase.co";
const supabaseKey = "sb_publishable_xfjCBEL-Hf77z-ssKaeZbg_-Or1pIML";

export const sb = createClient(supabaseUrl, supabaseKey);

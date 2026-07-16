import { createClient } from '@supabase/supabase-js';

// Langsung pakai hardcode karena kita di Acode tanpa .env lokal
const supabaseUrl = "https://xwqdkvxythrewgjxhiru.supabase.co";
const supabaseKey = "sb_publishable_xfjCBEL-Hf77z-ssKaeZbg_-Or1pIML";

export const sb = createClient(supabaseUrl, supabaseKey);

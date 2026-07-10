// src/js/config.js
// Tarik fungsi Supabase dari script HTML (bypass Vercel build error)

const supabaseUrl = "https://xwqdkvxythrewgjxhiru.supabase.co";
const supabaseKey = "sb_publishable_xfjCBEL-Hf77z-ssKaeZbg_-Or1pIML";

// Langsung pakai window.supabase
export const sb = window.supabase.createClient(supabaseUrl, supabaseKey);

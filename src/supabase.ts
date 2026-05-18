import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bnvazzzavhquvqigecdw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudmF6enphdmhxdXZxaWdlY2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwOTY3MTUsImV4cCI6MjA5NDY3MjcxNX0.TTWqkp_S8pQ6n5JClMiHHQEuGzPNCzHRuVD1ln4vNCQ';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

import { createClient } from '@supabase/supabase-js';

// Clé « publishable » : faite pour être publique. Les règles d'accès (supabase/schema.sql) protègent les données.
export const supabase = createClient(
  'https://kbfictvldzuogtiyipmk.supabase.co',
  'sb_publishable_-kiAx5flF_frx0cGYTizcw_GbwTsptj',
);

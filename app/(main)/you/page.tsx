import { createClient } from '@/lib/supabase/server';
import { YouPageClient } from './YouPageClient';

export default async function YouPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return <YouPageClient />;
}

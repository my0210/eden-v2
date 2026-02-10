import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if we're likely inside the PWA (standalone mode).
      // If not, we're in a regular browser opened from an email link.
      // Either way, redirect to the app — this handles both cases.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If code exchange failed (expired link, already used, etc.)
  // redirect to login with a helpful hint
  const loginUrl = new URL('/login', origin);
  return NextResponse.redirect(loginUrl.toString());
}

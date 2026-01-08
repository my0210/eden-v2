import { redirect } from 'next/navigation';

// Magic link handles both signup and login, so redirect to login
export default function SignupPage() {
  redirect('/login');
}

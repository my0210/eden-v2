import { redirect } from 'next/navigation';

export default function MainPage() {
  // Home → /chat renders the morph shell (home + chat in one screen)
  redirect('/chat');
}

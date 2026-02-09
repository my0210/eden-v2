import { redirect } from 'next/navigation';

export default function MainPage() {
  // Chat is now the main screen
  redirect('/chat');
}

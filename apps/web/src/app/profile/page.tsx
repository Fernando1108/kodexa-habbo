import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function ProfileRedirectPage() {
  const session = await auth();
  if (!session?.user?.username) redirect('/login');
  redirect(`/community/profiles/${session.user.username}`);
}

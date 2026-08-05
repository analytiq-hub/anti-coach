'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSession } from '@/contexts/AppSessionContext';

/** Post-login landing: always go to /chat. */
export default function DashboardRedirect() {
  const router = useRouter();
  const { status } = useAppSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/chat');
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [router, status]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
    </div>
  );
}

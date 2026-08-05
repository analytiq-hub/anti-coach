'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSession } from '@/contexts/AppSessionContext';
import ChatPage from '@/components/chat/ChatPage';

export default function ChatRoutePage() {
  const { status } = useAppSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-full">
      <ChatPage />
    </div>
  );
}

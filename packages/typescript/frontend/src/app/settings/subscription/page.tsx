'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSession } from '@/contexts/AppSessionContext';
import { DocRouterAccountApi } from '@/utils/api';
import { AppSession } from '@/types/AppSession';
import SubscriptionManager from '@/components/SubscriptionManager';
import SettingsLayout from '@/components/SettingsLayout';

export default function AccountSubscriptionPage() {
  const router = useRouter();
  const { session, status } = useAppSession();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const docRouterAccountApi = useMemo(() => new DocRouterAccountApi(), []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status !== 'authenticated') return;

    const load = async () => {
      try {
        const appSession = session as AppSession | null;
        if (!appSession?.user?.id) return;
        const response = await docRouterAccountApi.listOrganizations({
          userId: appSession.user.id,
        });
        const orgs = response.organizations ?? [];
        const individual = orgs.find((o) => o.type === 'individual') ?? orgs[0];
        if (!individual) {
          setError('No account found');
          return;
        }
        setOrganizationId(individual.id);
      } catch {
        setError('Failed to load billing account');
      }
    };
    load();
  }, [status, session, router, docRouterAccountApi]);

  if (status === 'loading' || (!organizationId && !error)) {
    return (
      <SettingsLayout selectedMenu="subscription">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
        </div>
      </SettingsLayout>
    );
  }

  if (error || !organizationId) {
    return (
      <SettingsLayout selectedMenu="subscription">
        <p className="text-red-600">{error ?? 'Unable to load subscription'}</p>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout selectedMenu="subscription">
      <div className="space-y-6">
        <SubscriptionManager organizationId={organizationId} />
      </div>
    </SettingsLayout>
  );
}

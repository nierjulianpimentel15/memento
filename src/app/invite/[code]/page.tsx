'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface GroupPreview {
  id: string;
  name: string;
  description: string;
}

export default function InvitePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<GroupPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetch(`/api/invite/${params.code}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setGroup(data.group);
      });
  }, [params.code]);

  async function join() {
    setJoining(true);
    const res = await fetch(`/api/invite/${params.code}`, { method: 'POST' });
    const data = await res.json();
    setJoining(false);
    if (!res.ok) {
      if (res.status === 401) {
        router.push(`/login?next=/invite/${params.code}`);
        return;
      }
      setError(data.error ?? 'Could not join this group.');
      return;
    }
    router.push(`/groups/${data.groupId}/gallery`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6 text-center">
        {error && <p className="text-sm text-light-gray">{error}</p>}
        {!error && !group && <p className="text-sm text-medium-gray">Loading invite…</p>}
        {group && (
          <>
            <h1 className="text-xl font-semibold">Join {group.name}</h1>
            <p className="mt-2 text-sm text-medium-gray">{group.description || 'You have been invited to this private group.'}</p>
            <Button onClick={join} className="mt-5 w-full" disabled={joining}>
              {joining ? 'Joining…' : 'Accept invite'}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}

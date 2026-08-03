'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Crown, ShieldCheck, UserMinus } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Member {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

async function fetchMembers(groupId: string) {
  const res = await fetch(`/api/groups/${groupId}/members`);
  if (!res.ok) throw new Error('Failed to load members');
  return res.json() as Promise<{ members: Member[] }>;
}

export default function GroupSettingsPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const queryClient = useQueryClient();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: ['members', groupId], queryFn: () => fetchMembers(groupId) });

  const createInvite = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/groups/${groupId}/invite`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!res.ok) throw new Error('Failed to create invite');
      return res.json() as Promise<{ inviteUrl: string }>;
    },
    onSuccess: (data) => setInviteUrl(data.inviteUrl),
  });

  const memberAction = useMutation({
    mutationFn: async ({ action, targetUserId }: { action: string; targetUserId: string }) => {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetUserId }),
      });
      if (!res.ok) throw new Error('Action failed');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', groupId] }),
  });

  return (
    <>
      <Header title="Group settings" />
      <main className="mx-auto max-w-3xl space-y-6 px-5 py-8">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Invite people</h2>
          <p className="mt-1 text-sm text-medium-gray">Generate a link to bring someone into this group.</p>
          <div className="mt-3 flex items-center gap-2">
            <Button onClick={() => createInvite.mutate()} disabled={createInvite.isPending} size="sm">
              {createInvite.isPending ? 'Generating…' : 'Generate invite link'}
            </Button>
            {inviteUrl && (
              <div className="flex flex-1 items-center gap-2 rounded-md border border-white/10 bg-dark-gray px-3 py-2 text-xs">
                <span className="truncate">{inviteUrl}</span>
                <button onClick={() => navigator.clipboard.writeText(inviteUrl)} aria-label="Copy invite link">
                  <Copy size={14} />
                </button>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Members</h2>
          <div className="space-y-2">
            {data?.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <img src={m.user.avatarUrl ?? undefined} alt="" className="h-8 w-8 rounded-full bg-dark-gray object-cover" />
                  <div className="text-sm">
                    <p className="font-medium">{m.user.displayName}</p>
                    <p className="text-xs text-medium-gray">@{m.user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-medium-gray">
                    {m.role === 'OWNER' && <Crown size={12} />}
                    {m.role === 'ADMIN' && <ShieldCheck size={12} />}
                    {m.role}
                  </span>
                  {m.role !== 'OWNER' && (
                    <>
                      {m.role === 'MEMBER' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => memberAction.mutate({ action: 'promote', targetUserId: m.user.id })}
                        >
                          Make admin
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => memberAction.mutate({ action: 'demote', targetUserId: m.user.id })}
                        >
                          Remove admin
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => memberAction.mutate({ action: 'remove', targetUserId: m.user.id })}
                      >
                        <UserMinus size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </>
  );
}

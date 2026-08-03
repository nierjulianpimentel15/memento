'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Users, Image as ImageIcon } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import * as Dialog from '@radix-ui/react-dialog';

interface GroupSummary {
  id: string;
  name: string;
  description: string;
  coverImage: string | null;
  _count: { posts: number; members: number };
}

async function fetchGroups(): Promise<{ groups: GroupSummary[] }> {
  const res = await fetch('/api/groups');
  if (!res.ok) throw new Error('Failed to load groups');
  return res.json();
}

export default function GroupsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups });
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <Header title="Your groups" />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-medium-gray">Private spaces for the people who matter most.</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> New group
          </Button>
        </div>

        {isLoading && <p className="text-sm text-medium-gray">Loading…</p>}

        {!isLoading && data?.groups.length === 0 && (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <Users size={28} className="text-medium-gray" />
            <div>
              <p className="font-medium">No groups yet</p>
              <p className="mt-1 text-sm text-medium-gray">Create one to start sharing memories.</p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="mt-2">
              Create your first group
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.groups.map((group, i) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link href={`/groups/${group.id}/gallery`}>
                <Card className="group overflow-hidden transition-transform hover:-translate-y-0.5">
                  <div className="flex h-36 items-center justify-center bg-dark-gray">
                    {group.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={group.coverImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={28} className="text-medium-gray" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium">{group.name}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-medium-gray">{group.description || 'No description yet.'}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-medium-gray">
                      <span>{group._count.members} members</span>
                      <span>{group._count.posts} posts</span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function CreateGroupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Could not create group.');
      return;
    }
    setName('');
    setDescription('');
    onOpenChange(false);
    queryClient.invalidateQueries({ queryKey: ['groups'] });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="glass-strong fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 shadow-elevate">
          <Dialog.Title className="text-lg font-semibold">New group</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-medium-gray">
            Give your circle a name. You can invite people right after.
          </Dialog.Description>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <Label htmlFor="group-name">Name</Label>
              <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="The Rivera Family" required />
            </div>
            <div>
              <Label htmlFor="group-description">Description (optional)</Label>
              <Input
                id="group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Every trip, every holiday, all in one place."
              />
            </div>
            {error && <p className="text-xs text-light-gray">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !name.trim()}>
                {submitting ? 'Creating…' : 'Create group'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

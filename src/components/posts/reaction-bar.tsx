'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Smile, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const REACTIONS = [
  { type: 'HEART', icon: Heart },
  { type: 'SMILE', icon: Smile },
  { type: 'FIRE', icon: Flame },
] as const;

export function ReactionBar({ postId }: { postId: string }) {
  const queryClient = useQueryClient();

  const react = useMutation({
    mutationFn: async (type: string) => {
      const res = await fetch(`/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error('Failed to react');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  return (
    <div className="flex items-center gap-1">
      {REACTIONS.map(({ type, icon: Icon }) => (
        <button
          key={type}
          onClick={() => react.mutate(type)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full text-light-gray transition-colors hover:bg-white/10 hover:text-white',
            react.isPending && 'opacity-50'
          )}
          aria-label={`React with ${type.toLowerCase()}`}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  );
}

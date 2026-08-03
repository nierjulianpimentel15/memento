'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Lightbox } from '@/components/gallery/lightbox';
import type { GalleryPost } from '@/types/gallery';

interface TimelineGroup {
  label: string;
  year: number;
  month: number;
  posts: GalleryPost[];
}

async function fetchMemories(groupId: string) {
  const res = await fetch(`/api/groups/${groupId}/memories`);
  if (!res.ok) throw new Error('Failed to load memories');
  return res.json() as Promise<{ timeline: TimelineGroup[] }>;
}

export default function MemoriesPage() {
  const params = useParams<{ groupId: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['memories', params.groupId],
    queryFn: () => fetchMemories(params.groupId),
  });
  const [activePost, setActivePost] = useState<GalleryPost | null>(null);

  return (
    <>
      <Header title="Memories" />
      <main className="mx-auto max-w-5xl px-5 py-8">
        {isLoading && <p className="text-sm text-medium-gray">Loading memories…</p>}
        {!isLoading && data?.timeline.length === 0 && (
          <p className="text-sm text-medium-gray">No memories yet — upload some photos to build your timeline.</p>
        )}

        <div className="space-y-10">
          {data?.timeline.map((group) => (
            <section key={`${group.year}-${group.month}`}>
              <div className="mb-3 flex items-baseline gap-2">
                <h2 className="text-lg font-semibold tracking-tight">{group.label}</h2>
                <span className="text-xs text-medium-gray">{group.posts.length} memories</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {group.posts.map((post) => {
                  const cover = post.images[0];
                  if (!cover) return null;
                  return (
                    <button
                      key={post.id}
                      onClick={() => setActivePost(post)}
                      className="aspect-square overflow-hidden rounded-md"
                    >
                      <img
                        src={cover.thumbnailUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      {activePost && <Lightbox post={activePost} onClose={() => setActivePost(null)} />}
    </>
  );
}

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasonryGallery } from '@/components/gallery/masonry-gallery';
import { Lightbox } from '@/components/gallery/lightbox';
import { UploadDialog } from '@/components/posts/upload-dialog';
import type { GalleryPost } from '@/types/gallery';

async function fetchPosts({ pageParam, groupId, q }: { pageParam?: string; groupId: string; q: string }) {
  const params = new URLSearchParams({ groupId });
  if (pageParam) params.set('cursor', pageParam);
  if (q) params.set('q', q);
  const res = await fetch(`/api/posts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load photos');
  return res.json() as Promise<{ posts: GalleryPost[]; nextCursor: string | null }>;
}

export default function GalleryPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const [query, setQuery] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activePost, setActivePost] = useState<GalleryPost | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['posts', groupId, query],
    queryFn: ({ pageParam }) => fetchPosts({ pageParam, groupId, q: query }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  return (
    <>
      <Header title="Gallery" />
      <main className="mx-auto max-w-6xl px-5 py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-medium-gray" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search captions…"
              className="pl-9"
            />
          </div>
          <Button onClick={() => setUploadOpen(true)}>
            <Plus size={16} /> Add photos
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-medium-gray">Loading gallery…</p>
        ) : (
          <MasonryGallery
            posts={posts}
            onOpenPost={setActivePost}
            onLoadMore={() => hasNextPage && fetchNextPage()}
            hasMore={!!hasNextPage}
            isFetchingMore={isFetchingNextPage}
          />
        )}
      </main>

      <UploadDialog groupId={groupId} open={uploadOpen} onOpenChange={setUploadOpen} />
      {activePost && <Lightbox post={activePost} onClose={() => setActivePost(null)} />}
    </>
  );
}

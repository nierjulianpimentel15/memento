'use client';

import { useQuery } from '@tanstack/react-query';

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  bio: string;
  createdAt: string;
  _count: { posts: number; memberships: number };
}

async function fetchMe(): Promise<CurrentUser | null> {
  const res = await fetch('/api/auth/me');
  const data = await res.json();
  return data.user ?? null;
}

export function useCurrentUser() {
  return useQuery({ queryKey: ['me'], queryFn: fetchMe });
}

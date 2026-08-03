export interface PostImage {
  id: string;
  storageKey: string;
  webKey: string;
  thumbnailKey: string;
  originalUrl: string;
  webUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  order: number;
}

export interface PostAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface GalleryPost {
  id: string;
  caption: string;
  location: string | null;
  takenAt: string;
  images: PostImage[];
  author: PostAuthor;
  _count: { comments: number; reactions: number };
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CommentAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface CommentNode {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  author: CommentAuthor;
  replies?: CommentNode[];
}

async function fetchPost(postId: string) {
  const res = await fetch(`/api/posts/${postId}`);
  if (!res.ok) throw new Error('Failed to load comments');
  return res.json() as Promise<{ post: { comments: CommentNode[] } }>;
}

export function CommentSection({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['post-comments', postId], queryFn: () => fetchPost(postId) });
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const addComment = useMutation({
    mutationFn: async (payload: { body: string; parentId?: string }) => {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to post comment');
      return res.json();
    },
    onSuccess: () => {
      setBody('');
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete comment');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post-comments', postId] }),
  });

  const comments = data?.post.comments ?? [];

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Comments</h3>
      <div className="space-y-3">
        {comments.length === 0 && <p className="text-sm text-medium-gray">No comments yet.</p>}
        {comments.map((comment) => (
          <div key={comment.id}>
            <CommentRow comment={comment} onReply={() => setReplyTo(comment.id)} onDelete={() => deleteComment.mutate(comment.id)} />
            {comment.replies?.map((reply) => (
              <div key={reply.id} className="ml-6 mt-2">
                <CommentRow comment={reply} onDelete={() => deleteComment.mutate(reply.id)} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          addComment.mutate({ body: body.trim(), parentId: replyTo ?? undefined });
        }}
        className="mt-4 flex items-center gap-2"
      >
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={replyTo ? 'Write a reply…' : 'Add a comment…'}
        />
        <Button type="submit" size="sm" disabled={addComment.isPending || !body.trim()}>
          Post
        </Button>
      </form>
      {replyTo && (
        <button onClick={() => setReplyTo(null)} className="mt-1 text-xs text-medium-gray underline">
          Cancel reply
        </button>
      )}
    </div>
  );
}

function CommentRow({
  comment,
  onReply,
  onDelete,
}: {
  comment: CommentNode;
  onReply?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-2.5 text-sm">
      <img src={comment.author.avatarUrl ?? undefined} alt="" className="h-7 w-7 shrink-0 rounded-full bg-dark-gray object-cover" />
      <div className="flex-1">
        <p>
          <span className="font-medium">{comment.author.displayName}</span>{' '}
          <span className="text-light-gray">{comment.body}</span>
        </p>
        <div className="mt-0.5 flex gap-3 text-xs text-medium-gray">
          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
          {comment.editedAt && <span>(edited)</span>}
          {onReply && (
            <button onClick={onReply} className="hover:text-white">
              Reply
            </button>
          )}
          <button onClick={onDelete} className="hover:text-white">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

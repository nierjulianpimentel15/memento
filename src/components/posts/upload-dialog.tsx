'use client';

import { useState, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

export function UploadDialog({
  groupId,
  open,
  onOpenChange,
}: {
  groupId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFiles([]);
    setCaption('');
    setLocation('');
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setError('Choose at least one photo.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const form = new FormData();
    form.set('groupId', groupId);
    form.set('caption', caption);
    if (location) form.set('location', location);
    files.forEach((f) => form.append('files', f));

    const res = await fetch('/api/upload', { method: 'POST', body: form });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Upload failed.');
      return;
    }

    reset();
    onOpenChange(false);
    queryClient.invalidateQueries({ queryKey: ['posts', groupId] });
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="glass-strong fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 shadow-elevate">
          <Dialog.Title className="text-lg font-semibold">Add photos</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-medium-gray">
            Share a moment with your group.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 px-4 py-8 text-center hover:border-white/30"
            >
              <UploadCloud size={22} className="text-medium-gray" />
              <span className="text-sm text-light-gray">
                {files.length ? `${files.length} photo${files.length > 1 ? 's' : ''} selected` : 'Click to choose photos'}
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              hidden
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <span key={i} className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-xs">
                    {f.name}
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label={`Remove ${f.name}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div>
              <Label htmlFor="caption">Caption</Label>
              <Input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Say something about this memory…" />
            </div>
            <div>
              <Label htmlFor="location">Location (optional)</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Baguio, Philippines" />
            </div>

            {error && <p className="text-xs text-light-gray">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Uploading…' : 'Upload'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

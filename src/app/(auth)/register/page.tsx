'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validation/schemas';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setServerError(data.error ?? 'Something went wrong. Please try again.');
      return;
    }
    router.push('/groups');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create your space</h1>
          <p className="mt-2 text-sm text-light-gray">A quiet place for your group's memories.</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" placeholder="Jamie Rivera" {...register('displayName')} />
              {errors.displayName && <p className="mt-1 text-xs text-light-gray">{errors.displayName.message}</p>}
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="jamie" {...register('username')} />
              {errors.username && <p className="mt-1 text-xs text-light-gray">{errors.username.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-light-gray">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••••" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-light-gray">{errors.password.message}</p>}
            </div>

            {serverError && <p className="text-xs text-light-gray">{serverError}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-medium-gray">
          Already have an account?{' '}
          <Link href="/login" className="text-white underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

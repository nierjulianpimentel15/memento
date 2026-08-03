import { describe, it, expect } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const key = `test-${Math.random()}`;
    const result = rateLimit(key, 3, 1000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('blocks requests once the limit is exceeded', () => {
    const key = `test-${Math.random()}`;
    rateLimit(key, 2, 1000);
    rateLimit(key, 2, 1000);
    const third = rateLimit(key, 2, 1000);
    expect(third.allowed).toBe(false);
  });
});

import { NextResponse } from 'next/server';
import { WAITLIST_BASE_COUNT } from '@/lib/config';

/**
 * PLACEHOLDER waitlist backend.
 * Stores emails in memory, which resets on every deploy / cold start and isn't
 * shared between serverless instances. Replace `store` with your provider
 * (Resend Audiences, Klaviyo, Mailchimp, Supabase, Vercel KV…). See README.
 */
const store = new Set<string>();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ count: WAITLIST_BASE_COUNT + store.size });
}

export async function POST(req: Request) {
  let body: { email?: unknown; company?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot: real people never fill the hidden "company" field.
  if (typeof body.company === 'string' && body.company.length > 0) {
    return NextResponse.json({ ok: true, count: WAITLIST_BASE_COUNT + store.size });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 422 });
  }

  const isNew = !store.has(email);
  store.add(email);
  return NextResponse.json({ ok: true, isNew, count: WAITLIST_BASE_COUNT + store.size });
}

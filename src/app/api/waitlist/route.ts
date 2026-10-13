import { NextResponse } from 'next/server';
import { WAITLIST_BASE_COUNTS, isProductId, type ProductId } from '@/lib/config';

/**
 * PLACEHOLDER waitlist backend, one list per product.
 * Stores emails in memory, which resets on every deploy / cold start and isn't
 * shared between serverless instances. Replace `stores` with your provider
 * (Resend Audiences, Klaviyo, Mailchimp, Supabase, Vercel KV…). See README.
 */
const stores = new Map<ProductId, Set<string>>();
const store = (p: ProductId) => {
  let s = stores.get(p);
  if (!s) stores.set(p, (s = new Set()));
  return s;
};
const countFor = (p: ProductId) => WAITLIST_BASE_COUNTS[p] + store(p).size;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const product = new URL(req.url).searchParams.get('product') ?? 'corner-series';
  if (!isProductId(product)) return NextResponse.json({ error: 'Unknown product.' }, { status: 404 });
  return NextResponse.json({ count: countFor(product) });
}

export async function POST(req: Request) {
  let body: { email?: unknown; company?: unknown; product?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const product = body.product ?? 'corner-series';
  if (!isProductId(product)) return NextResponse.json({ error: 'Unknown product.' }, { status: 404 });

  // Honeypot: real people never fill the hidden "company" field.
  if (typeof body.company === 'string' && body.company.length > 0) {
    return NextResponse.json({ ok: true, count: countFor(product) });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 422 });
  }

  const isNew = !store(product).has(email);
  store(product).add(email);
  return NextResponse.json({ ok: true, isNew, count: countFor(product) });
}

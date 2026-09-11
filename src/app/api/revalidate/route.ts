import { revalidateTag, revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// Lightweight memory debounce to absorb rapid concurrent webhook hits
let lastRevalidatedAt = 0;
const DEBOUNCE_WINDOW_MS = 2000;

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
    const incomingSecret =
      request.headers.get('x-webhook-secret') ||
      request.headers.get('x-revalidate-secret') ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!webhookSecret || incomingSecret !== webhookSecret) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    let payload: any = null;
    try {
      payload = await request.json();
    } catch {
      // Body may be empty on direct pings, which is fine
    }

    const now = Date.now();
    const shouldFullRevalidate = now - lastRevalidatedAt > DEBOUNCE_WINDOW_MS;

    if (shouldFullRevalidate) {
      lastRevalidatedAt = now;
      // Invalidate global events collection and layout
      (revalidateTag as any)('events', 'events');
      revalidatePath('/', 'layout');
      revalidatePath('/search', 'page');
      revalidatePath('/cities', 'page');
    }

    // If a specific event was updated/inserted, invalidate its granular tag as well
    const modifiedSlug = payload?.record?.slug || payload?.old_record?.slug || payload?.slug;
    if (modifiedSlug) {
      (revalidateTag as any)(`event_${modifiedSlug}`, `event_${modifiedSlug}`);
      revalidatePath(`/events/${modifiedSlug}`, 'page');
    }

    return NextResponse.json({
      revalidated: true,
      throttled: !shouldFullRevalidate,
      slug: modifiedSlug || null,
      now,
    });
  } catch (err: any) {
    console.error('[API/Revalidate] Error:', err);
    return NextResponse.json({ message: 'Error revalidating', error: err?.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-webhook-secret, x-revalidate-secret, authorization',
    },
  });
}
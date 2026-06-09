import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'Exclusive Event on EvenTime';
    const category = searchParams.get('category') || 'Event';
    const date = searchParams.get('date') || 'Coming Soon';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F5F5F7',
            padding: '60px',
            border: '16px solid #6C47FF',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 32,
              fontWeight: 'bold',
              color: '#6C47FF',
              textTransform: 'uppercase',
              letterSpacing: '4px',
              marginBottom: '24px',
            }}
          >
            {category}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 80,
              fontWeight: '900',
              color: '#1D1D1F',
              textAlign: 'center',
              lineHeight: 1.1,
              marginBottom: '40px',
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 36,
              fontWeight: '600',
              color: '#86868B',
            }}
          >
            {date} • Hosted on EvenTime
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error(errorMessage);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
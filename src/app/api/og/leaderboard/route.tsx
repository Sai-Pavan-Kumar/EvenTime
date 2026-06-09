import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || 'Curator';
    const score = searchParams.get('score') || '0';
    const rank = searchParams.get('rank') || '1';
    const image = searchParams.get('image');

    // Only render image if it's a valid external URL to prevent NextOG fetch errors
    const hasValidImage = image && image.startsWith('http');

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#F5F5F7',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'white',
              borderRadius: '32px',
              width: '100%',
              height: '100%',
              padding: '50px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              justifyContent: 'space-between',
              border: rank === '1' ? '4px solid #F59E0B' : '2px solid #E2E8F0',
            }}
          >
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '32px', color: '#64748B', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
                  Leaderboard Standing
                </span>
                <span style={{ fontSize: '72px', color: '#1D1D1F', fontWeight: 900, marginTop: '10px', maxWidth: '700px' }}>
                  {name}
                </span>
              </div>
              {hasValidImage && (
                <img
                  src={image}
                  alt={name}
                  style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '80px',
                    objectFit: 'cover',
                    border: rank === '1' ? '6px solid #F59E0B' : '6px solid #E2E8F0',
                  }}
                />
              )}
            </div>

            {/* Stats Area */}
            <div style={{ display: 'flex', gap: '30px', marginTop: '40px' }}>
              {/* Rank Block */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: rank === '1' ? '#FFFBEB' : '#F8FAFC',
                  padding: '30px',
                  borderRadius: '24px',
                  flex: 1,
                  border: rank === '1' ? '2px solid #FDE68A' : 'none',
                }}
              >
                <span style={{ fontSize: '28px', color: rank === '1' ? '#D97706' : '#64748B', fontWeight: 600 }}>Global Rank</span>
                <span style={{ fontSize: '80px', color: rank === '1' ? '#B45309' : '#0F172A', fontWeight: 900, marginTop: '8px' }}>
                  #{rank}
                </span>
              </div>
              
              {/* Score Block */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#F0FDF4',
                  padding: '30px',
                  borderRadius: '24px',
                  flex: 1,
                }}
              >
                <span style={{ fontSize: '28px', color: '#166534', fontWeight: 600 }}>ET Score</span>
                <span style={{ fontSize: '80px', color: '#14532D', fontWeight: 900, marginTop: '8px' }}>
                  {score}
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    return new Response('Failed to generate sharing image', { status: 500 });
  }
}
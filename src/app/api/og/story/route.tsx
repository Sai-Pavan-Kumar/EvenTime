import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'Exclusive Event';
    const category = searchParams.get('category') || 'Event';
    const date = searchParams.get('date') || 'TBA';
    const organizer = searchParams.get('organizer') || 'EvenTime';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0A0A0B',
            padding: '80px',
            position: 'relative',
          }}
        >
          {/* Neon Glow Background Blobs */}
          <div style={{ display: 'flex', position: 'absolute', top: '-15%', left: '-10%', width: '900px', height: '900px', backgroundColor: '#6C47FF', borderRadius: '500px', filter: 'blur(180px)', opacity: 0.25 }} />
          <div style={{ display: 'flex', position: 'absolute', bottom: '-10%', right: '-5%', width: '700px', height: '700px', backgroundColor: '#059669', borderRadius: '500px', filter: 'blur(160px)', opacity: 0.15 }} />

          {/* Top Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '100px' }}>
            <div style={{ display: 'flex', width: '60px', height: '60px', backgroundColor: '#6C47FF', borderRadius: '16px', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>E</span>
            </div>
            <span style={{ color: 'white', fontSize: '36px', fontWeight: 'bold', letterSpacing: '-1px' }}>EvenTime</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <div style={{ display: 'flex', border: '1.5px solid rgba(108, 71, 255, 0.4)', padding: '10px 20px', borderRadius: '100px', alignSelf: 'flex-start', marginBottom: '40px' }}>
              <span style={{ color: '#A855F7', fontSize: '28px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '4px' }}>{category}</span>
            </div>
            
            <div style={{ display: 'flex' }}>
              <h1 style={{ color: 'white', fontSize: '110px', fontWeight: 'bold', lineHeight: 1.1, marginBottom: '60px', letterSpacing: '-4px' }}>
                {title}
              </h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <span style={{ color: 'white', fontSize: '48px', fontWeight: '600' }}>{date}</span>
              <span style={{ color: '#86868B', fontSize: '38px' }}>Managed by @{organizer}</span>
            </div>
          </div>

          {/* Footer with Domain */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '60px' }}>
            <div style={{ display: 'flex' }}>
              <span style={{ color: '#6C47FF', fontSize: '32px', fontWeight: 'bold', letterSpacing: '2px' }}>EVENTIME.SBHUB.IN</span>
            </div>
            <div style={{ display: 'flex', backgroundColor: 'white', padding: '18px 40px', borderRadius: '100px' }}>
              <span style={{ color: 'black', fontSize: '24px', fontWeight: 'bold' }}>Register Now</span>
            </div>
          </div>
        </div>
      ),
      { width: 1080, height: 1920 }
    );
  } catch (e: unknown) {
  const errorMessage = e instanceof Error ? e.message : 'Unknown error';
  console.error(errorMessage);
  return new Response(`Failed to generate image`, { status: 500 });
}
}
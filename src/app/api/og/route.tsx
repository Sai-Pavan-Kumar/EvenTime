import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const raw = dateStr.split(' · ')[0]?.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (m >= 1 && m <= 12) {
      return `${d} ${months[m - 1]} ${y}`;
    }
  }
  return raw;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const titleParam = searchParams.get('title')?.trim() || '';
    const categoryParam = searchParams.get('category')?.trim() || '';
    const dateParam = searchParams.get('date')?.trim() || '';
    const cityParam = searchParams.get('city')?.trim() || searchParams.get('location')?.trim() || '';

    const isHomepage =
      !titleParam ||
      titleParam.toLowerCase().includes('discover tech') ||
      categoryParam.toLowerCase() === 'eventime';

    // Editorial Content
    const title = isHomepage
      ? 'Discover Tech, Startup & Career Events'
      : titleParam;

    const category = isHomepage
      ? 'EVENT DIRECTORY'
      : (categoryParam || 'FEATURED EVENT').toUpperCase();

    const formattedDate = formatDisplayDate(dateParam);
    const metaParts = [formattedDate, cityParam].filter(Boolean);
    const subtitle = isHomepage
      ? "India's cleanest directory for hackathons, meetups, and workshops."
      : metaParts.length > 0
      ? metaParts.join('   ·   ')
      : 'Curated on EvenTime';

    // Dynamic optical font sizing: perfectly fit 1200x630 canvas with zero truncation
    const getFontSize = (text: string) => {
      if (text.length <= 32) return 56;
      if (text.length <= 55) return 48;
      if (text.length <= 80) return 40;
      return 34;
    };

    const fontSize = isHomepage ? 54 : getFontSize(title);

    // Load brand fonts (Outfit) and logo synchronously from local disk
    const fontExtraBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Outfit-ExtraBold.ttf');
    const fontSemiBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Outfit-SemiBold.ttf');
    const logoPath = path.join(process.cwd(), 'public', 'logo-256.png');

    const [fontExtraBoldData, fontSemiBoldData, logoData] = await Promise.all([
      fs.promises.readFile(fontExtraBoldPath),
      fs.promises.readFile(fontSemiBoldPath),
      fs.promises.readFile(logoPath).then((buf) => `data:image/png;base64,${buf.toString('base64')}`),
    ]);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#FAFAFC',
            padding: '72px 80px',
            fontFamily: 'Outfit, sans-serif',
            position: 'relative',
          }}
        >
          {/* Subtle Top 5px Brand Accent Bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '5px',
              backgroundColor: '#6C47FF',
              display: 'flex',
            }}
          />

          {/* Top Row: Official Brand Logo & Wordmark (Left) + Category (Right) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            {/* Brand Logo & Wordmark */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <img
                src={logoData}
                alt="EvenTime"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                }}
              />
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  display: 'flex',
                }}
              >
                <span style={{ color: '#6C47FF' }}>Even</span>
                <span style={{ color: '#0F172A' }}>Time</span>
              </span>
            </div>

            {/* Right Category Tag */}
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#6C47FF',
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
              }}
            >
              {category}
            </span>
          </div>

          {/* Center Hero: Editorial Title & Restrained Subtitle */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              margin: 'auto 0',
              maxWidth: '1040px',
            }}
          >
            <h1
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: 800,
                color: '#0F172A',
                lineHeight: 1.18,
                letterSpacing: '-0.03em',
                margin: 0,
                marginBottom: subtitle ? '20px' : '0px',
                display: 'flex',
              }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#64748B',
                  lineHeight: 1.4,
                  letterSpacing: '-0.01em',
                  margin: 0,
                  display: 'flex',
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          {/* Bottom Row: Domain & Provenance */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingTop: '24px',
              borderTop: '1px solid #E2E8F0',
            }}
          >
            <span
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#94A3B8',
                letterSpacing: '-0.01em',
              }}
            >
              eventime.thesurfboard.in
            </span>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#6C47FF',
                letterSpacing: '-0.01em',
              }}
            >
              Curated on EvenTime
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Outfit',
            data: fontExtraBoldData,
            style: 'normal',
            weight: 800,
          },
          {
            name: 'Outfit',
            data: fontSemiBoldData,
            style: 'normal',
            weight: 600,
          },
        ],
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
        },
      }
    );
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error(errorMessage);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
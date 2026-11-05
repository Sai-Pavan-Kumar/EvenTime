import { NextResponse } from "next/server";
import { fetchHomePageData } from "@/lib/home/fetchHomePageData";

export const revalidate = false; // Pure event-driven on-demand cache

export async function GET() {
  try {
    const data = await fetchHomePageData();
    return NextResponse.json(data, {
      headers: {
        // Every tab focus (web) and app open hits this. s-maxage=0 ran a function and shipped ~80 KB
        // per hit; now the CDN answers. Freshness stays: the Supabase webhook purges /api/buffet on change.
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch (error) {
    console.error("[API/Buffet] Error:", error);
    return NextResponse.json({ error: "Failed to fetch buffet" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

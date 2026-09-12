import { NextResponse } from "next/server";
import { fetchHomePageData } from "@/lib/home/fetchHomePageData";

export const revalidate = false; // Pure event-driven on-demand cache

export async function GET() {
  try {
    const data = await fetchHomePageData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch buffet", message: error?.message },
      { status: 500 }
    );
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

import { NextResponse } from "next/server";
import { getSofiaCatalog } from "@/lib/sofia/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await getSofiaCatalog();
    return NextResponse.json(catalog, {
      headers: {
        "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown catalog error" },
      { status: 500 }
    );
  }
}

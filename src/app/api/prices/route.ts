import { NextResponse }  from "next/server";
import { fetchPrices }   from "@/lib/price-service";
import type { HoldingInput } from "@/lib/price-service";

export async function POST(request: Request) {
  try {
    const body    = await request.json();
    const inputs  = body.holdings as HoldingInput[];

    if (!Array.isArray(inputs)) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const prices = await fetchPrices(inputs);
    return NextResponse.json({ prices });
  } catch (err) {
    console.error("Prices API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}

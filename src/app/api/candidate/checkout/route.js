import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/Stripe";
import { REGION_TO_PRICE } from "@/lib/stripe/Pricing";

export async function POST(request) {
  try {
    const { region } = await request.json();
    const priceId = REGION_TO_PRICE[region];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid region" }, { status: 400 });
    }

    // ✅ Build a proper absolute origin with scheme
    const { origin } = new URL(request.url);            // e.g., http://localhost:3000 or https://yourdomain.com
    const fallback = process.env.NEXT_PUBLIC_BASE_URL;               // optional env, must include scheme if you set it
    const base = fallback?.startsWith("http") ? fallback : origin;

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${base}/candidate/instructions`,
      cancel_url: `${base}/candidate/checkout`,
      line_items: [{ price: priceId, quantity: 1 }],
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
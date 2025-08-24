import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function GET() {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
      limit: 100,
    });

    const items = prices.data
      .filter(
        (p) =>
          typeof p.unit_amount === "number" &&
          p.product &&
          typeof p.product !== "string"
      )
      .map((price) => {
        const product = price.product as Stripe.Product;
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          image: product.images?.[0] ?? null,
          priceId: price.id,
          currency: price.currency,
          unitAmount: price.unit_amount,
        };
      });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching Stripe products", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}

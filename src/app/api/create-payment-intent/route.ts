import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(request: Request) {
  try {
    const { priceId, email } = await request.json();
    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    const price = await stripe.prices.retrieve(priceId);
    if (!price || typeof price.unit_amount !== "number" || !price.currency) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    // Guard against tiny/invalid amounts. Stripe requires the amount to be at least the
    // minimum for the currency and a positive integer in the smallest currency unit.
    if (price.unit_amount <= 0) {
      return NextResponse.json(
        { error: "Price amount must be greater than 0" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      // Restrict to card so extra fields like phone aren't required by other methods
      payment_method_types: ["card"],
      receipt_email: email || undefined,
      metadata: {
        price_id: priceId,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent", error);
    // Surface Stripe error message when available to aid debugging small amounts
    const message =
      (typeof error === "object" && error && (error as any).message) ||
      "Failed to create payment intent";
    const status =
      typeof error === "object" && error && (error as any).statusCode
        ? Number((error as any).statusCode)
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

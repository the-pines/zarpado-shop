import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(request: Request) {
  try {
    const { priceId, email, address } = await request.json();
    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    const origin = request.headers.get("origin") ?? "";

    // Optionally create a customer to prefill email/address in Checkout
    let customerId: string | undefined = undefined;
    if (email || address) {
      const normalizedCountry =
        address?.country === "UK" ? "GB" : address?.country;
      const customer = await stripe.customers.create({
        email: email || undefined,
        address: address
          ? {
              country: normalizedCountry,
              postal_code: "WS11 1AA",
            }
          : undefined,
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/?canceled=true`,
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      customer_update: { address: "auto", name: "auto" },
      ...(customerId
        ? { customer: customerId }
        : email
        ? { customer_email: email }
        : {}),
    });

    return NextResponse.json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

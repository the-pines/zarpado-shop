"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_API_KEY as string
);

export function BuyButton({ priceId }: { priceId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    try {
      setLoading(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to start checkout");

      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to load");
      await stripe.redirectToCheckout({ sessionId: data.id });
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className='btn-glow btn-gradient mt-3 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white border border-white/10 hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed'
    >
      {loading ? (
        <span className='inline-flex items-center gap-2'>
          <span className='spinner' />
          Redirecting…
        </span>
      ) : (
        <span className='inline-flex items-center gap-2'>
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            className='opacity-90'
          >
            <path
              d='M3 6h18M7 12h14M11 18h10'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
            />
          </svg>
          Buy
        </span>
      )}
    </button>
  );
}

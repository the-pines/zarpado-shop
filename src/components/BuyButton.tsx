"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Stripe redirect via Checkout no longer used here; we route to custom checkout

type BuyButtonAddress = {
  country?: string;
  postal_code?: string;
};

export function BuyButton({
  priceId,
  email,
  address,
}: {
  priceId: string;
  email?: string;
  address?: BuyButtonAddress;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("priceId", priceId);
      if (email) params.set("email", email);
      if (address?.country) params.set("country", address.country);
      if (address?.postal_code) params.set("postal_code", address.postal_code);
      router.push(`/checkout-elements?${params.toString()}`);
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
